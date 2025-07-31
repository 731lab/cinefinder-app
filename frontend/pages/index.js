import { useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cinefinder-backend-322727979682.europe-west1.run.app";
  console.log("🛠️ FRONTEND: API_URL =", API_URL);

  const fetchSuggestions = async (q) => {
    if (q.length < 2) return setSuggestions([]);
    try {
      const { data } = await axios.get('https://api.themoviedb.org/3/search/movie', {
        params: { api_key: 'b91766799d7320f59370587fc38d9a93', query: q, language: 'it-IT'  }
      });
      setSuggestions(data.results.slice(0, 5));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      setResult(data);
    } catch {
      setResult({ error: 'Errore nella richiesta.' });
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>CineFinder 🎬</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container my-5">
        <h1 className="text-center mb-4">CineFinder 🎬</h1>

        <div className="input-group mb-4 position-relative mx-auto" style={{ maxWidth: 600 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Scrivi un titolo..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            onFocus={() => fetchSuggestions(query)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" type="button" onClick={handleSearch}>Cerca</button>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ zIndex: 999, top: '100%' }}>
              {suggestions.map(s => (
                <li
                  key={s.id}
                  className="list-group-item list-group-item-action"
                  onMouseDown={() => {
                    setQuery(s.title);
                    setShowSuggestions(false);
                    handleSearch();
                  }}
                >
                  {s.title} ({s.release_date?.slice(0, 4)})
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading && (
          <div className="text-center my-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {result?.error && <div className="alert alert-danger">{result.error}</div>}

        {result?.tmdb && (
          <div className="card mb-5 shadow">
            <div className="row g-0">
              <div className="col-md-4">
                <img
                  src={`https://image.tmdb.org/t/p/w500${result.tmdb.poster_path}`}
                  alt={result.tmdb.title}
                  className="img-fluid rounded-start"
                />
              </div>
              <div className="col-md-8">
                <div className="card-body">
                  <h3 className="card-title">{result.tmdb.title}</h3>
                  <p className="text-muted mb-2">
                    Anno: {result.tmdb.release_date?.slice(0, 4)} — ⭐ {result.tmdb.vote_average} ({result.tmdb.vote_count} voti)
                  </p>
                  <p><strong>Regia di:</strong> {result.credits.director}</p>
                  <p><strong>Attori principali:</strong> {result.credits.cast.join(', ')}</p>
                  <p className="mt-3">{result.tmdb.overview}</p>

                  {/* Trailer */}
                  {result.trailer_url && (
                    <div className="ratio ratio-16x9 mb-4">
                      <iframe src={result.trailer_url} title="Trailer" allowFullScreen />
                    </div>
                  )}

                  <h5 className="mt-4">Disponibile su:</h5>
                  <ul className="list-group list-group-horizontal flex-wrap">
                    {result.providers.length === 0 && (
                      <li className="list-group-item text-muted">⚠️ Nessuna piattaforma trovata.</li>
                    )}
                    {result.providers.map((p, i) => (
                      <li key={i} className="list-group-item d-flex align-items-center me-2 mb-2">
                        {p.logo_path && (
                          <img
                            src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                            alt={p.name}
                            className="me-2"
                          />
                        )}
                        <div className="d-flex align-items-center">
                          <strong>{p.name}</strong>{p.type !== 'flatrate' && <span className="ms-1 text-muted">({p.type})</span>}
                          {p.direct_url && (
                            <a href={p.direct_url} target="_blank" rel="noreferrer" className="btn btn-link btn-sm ms-3 p-0">
                              <i className="bi bi-play-circle-fill fs-4"></i>
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}