from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
from dotenv import load_dotenv
import json
import hashlib
from datetime import datetime, timedelta

# Load env
load_dotenv(dotenv_path=".env.local")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
WATCHMODE_API_KEY = os.getenv("WATCHMODE_API_KEY")
if not TMDB_API_KEY or not WATCHMODE_API_KEY:
    raise RuntimeError("Imposta le variabili d'ambiente TMDB_API_KEY e WATCHMODE_API_KEY")

# In-memory cache per Vercel Serverless
_cache = {}
CACHE_TTL = 3600 * 24  # 24 hours

def get_cache_key(cache_type: str, name: str):
    return f"{cache_type}:{hashlib.sha1(name.lower().encode()).hexdigest()}"

def load_cache(cache_type: str, name: str):
    key = get_cache_key(cache_type, name)
    if key in _cache:
        data, timestamp = _cache[key]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_TTL):
            return data
        else:
            del _cache[key]
    return None

def save_cache(cache_type: str, name: str, data: dict):
    key = get_cache_key(cache_type, name)
    _cache[key] = (data, datetime.now())

@app.get("/")
def root():
    return {"message": "CineFinder backend is running!"}

@app.get("/search")
def search(q: Optional[str] = Query(None), id: Optional[int] = Query(None), type: Optional[str] = Query("movie"), sort_by: Optional[str] = Query("vote_average")):
    if id:
        return get_by_tmdb_id(id)
    if not q:
        return {"error": "Parametro mancante"}

    if type == "movie":
        return search_by_title(q, sort_by)
    elif type == "person":
        return search_by_actor(q, sort_by)
    elif type == "director":
        return search_by_director(q, sort_by)
    else:
        return {"error": "Tipo di ricerca non valido"}

def search_by_title(title: str, sort_by="vote_average"):
    print(f"🎬 Titolo: {title}")
    resp = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": TMDB_API_KEY, "query": title, "language": "it-IT"}
    ).json()

    results = sorted(resp.get("results", []), key=lambda m: m.get(sort_by, 0), reverse=True)[:15]
    return [get_by_tmdb_id(r["id"]) for r in results if r.get("id")]

def search_by_actor(name: str, sort_by="vote_average"):
    cached = load_cache("actors", name)
    if cached:
        return cached

    search = requests.get(
        f"https://api.themoviedb.org/3/search/person",
        params={"api_key": TMDB_API_KEY, "query": name}
    ).json()

    if not search.get("results"):
        return {"error": "Attore non trovato"}

    person = search["results"][0]
    person_id = person["id"]
    full_name = person["name"]

    credits = requests.get(
        f"https://api.themoviedb.org/3/person/{person_id}/movie_credits",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json()

    movies = sorted(
        credits.get("cast", []),
        key=lambda m: m.get(sort_by, 0),
        reverse=True
    )[:15]

    results = [get_by_tmdb_id(m["id"]) for m in movies if m.get("id")]
    data = {
        "person": full_name,
        "results": results
    }
    save_cache("actors", name, data)
    return data


def search_by_director(name: str, sort_by="vote_average"):
    cached = load_cache("directors", name)
    if cached:
        return cached

    search = requests.get(
        f"https://api.themoviedb.org/3/search/person",
        params={"api_key": TMDB_API_KEY, "query": name}
    ).json()

    if not search.get("results"):
        return {"error": "Regista non trovato"}

    person = search["results"][0]
    person_id = person["id"]
    full_name = person["name"]

    credits = requests.get(
        f"https://api.themoviedb.org/3/person/{person_id}/movie_credits",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json()

    directed = [m for m in credits.get("crew", []) if m.get("job") == "Director"]
    movies = sorted(directed, key=lambda m: m.get(sort_by, 0), reverse=True)[:15]

    results = [get_by_tmdb_id(m["id"]) for m in movies if m.get("id")]
    data = {
        "director": full_name,
        "results": results
    }
    save_cache("directors", name, data)
    return data

def fetch_direct_links_from_tmdb(tmdb_watch_url: str) -> dict:
    try:
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
    except Exception as e:
        print(f"Errore nel fetch di direct links: {e}")
        return {}

def get_by_tmdb_id(tmdb_id: int):
    tmdb_movie = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json()

    credits = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/credits",
        params={"api_key": TMDB_API_KEY}
    ).json()
    director = next((c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"), "Sconosciuto")
    cast = [c["name"] for c in credits.get("cast", [])[:3]]

    genres = [g["name"] for g in tmdb_movie.get("genres", [])]

    videos = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/videos",
        params={"api_key": TMDB_API_KEY, "language": "it-IT"}
    ).json().get("results", [])
    trailer = next((v for v in videos if v.get("site") == "YouTube" and v.get("type") == "Trailer"), None)
    trailer_url = f"https://www.youtube.com/embed/{trailer['key']}" if trailer else None

    prov_data = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}/watch/providers",
        params={"api_key": TMDB_API_KEY}
    ).json().get("results", {}).get("IT", {})
    tmdb_watch_link = prov_data.get("link")

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
        "genres": genres,
        "trailer_url": trailer_url,
        "providers": providers
    }
