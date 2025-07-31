from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os



app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = "b91766799d7320f59370587fc38d9a93"
WATCHMODE_API_KEY = "b8PvjAKzOqDAeJ27gk887ZOQNE4Gcoy3yJDWfHiT"


#TMDB_API_KEY    = os.getenv("TMDB_API_KEY")
#WATCHMODE_API_KEY = os.getenv("WATCHMODE_API_KEY")

if not TMDB_API_KEY or not WATCHMODE_API_KEY:
    raise RuntimeError("Imposta le variabili d'ambiente TMDB_API_KEY e WATCHMODE_API_KEY")
@app.get("/")
def root():
    return {"message": "CineFinder backend is running!"}

@app.get("/search")
def search(q: Optional[str] = Query(None), id: Optional[int] = Query(None)):
    if id:
        return get_by_tmdb_id(id)
    if q:
        return search_by_title(q)
    return {"error": "Nessun parametro fornito"}

def search_by_title(title: str):
    resp = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": TMDB_API_KEY, "query": title}
    ).json()
    if not resp.get("results"):
        return {"error": "Film non trovato"}
    return get_by_tmdb_id(resp["results"][0]["id"])

def fetch_direct_links_from_tmdb(tmdb_watch_url: str) -> dict:
    """
    Dato il link TMDb alla pagina Watch/Providers,
    restituisce un dict {provider_name: direct_url} estraendo tutti gli <a> con href che iniziano per '/watch'.
    """
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = requests.get(tmdb_watch_url, headers=headers, timeout=10)
    soup = BeautifulSoup(resp.text, "html.parser")

    direct = {}
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('/watch'):
            name = a.get_text(strip=True)
            url = urljoin('https://www.themoviedb.org', href)
            if name:
                direct[name] = url
    return direct

def get_by_tmdb_id(tmdb_id: int):
    # 1. Dati principali
    tmdb_movie = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json()

    # 2. Credits
    credits = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/credits",
        params={"api_key": TMDB_API_KEY}
    ).json()
    director = next((c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"), "Sconosciuto")
    cast = [c["name"] for c in credits.get("cast", [])[:3]]

    # 3. Trailer YouTube
    videos = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json().get("results", [])
    trailer = next((v for v in videos if v.get("site") == "YouTube" and v.get("type") == "Trailer"), None)
    trailer_url = f"https://www.youtube.com/embed/{trailer['key']}" if trailer else None

    # 4. Providers Italia (TMDB)
    prov_data = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/watch/providers",
        params={"api_key": TMDB_API_KEY}
    ).json().get("results", {}).get("IT", {})
    tmdb_watch_link = prov_data.get("link")

    # 5. Scraping per direct_link
    direct_map = fetch_direct_links_from_tmdb(tmdb_watch_link) if tmdb_watch_link else {}

    providers = []
    for kind in ("flatrate", "rent", "buy", "free"):
        for p in prov_data.get(kind, []):
            name = p.get("provider_name")
            providers.append({
                "name": name,
                "type": kind,
                "logo_path": p.get("logo_path"),
                "direct_url": direct_map.get(name, tmdb_watch_link)
            })

    return {
        "tmdb": tmdb_movie,
        "credits": {"director": director, "cast": cast},
        "trailer_url": trailer_url,
        "providers": providers
    }