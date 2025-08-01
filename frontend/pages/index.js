import { useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('movie');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cinefinder-backend-322727979682.europe-west1.run.app";

  const fetchSuggestions = async (q) => {
    if (q.length < 2) return setSuggestions([]);
    const endpoint = searchType === 'movie' ? 'movie' : 'person';

    try {
      const { data } = await axios.get(`https://api.themoviedb.org/3/search/${endpoint}`, {
        params: { api_key: 'b91766799d7320f59370587fc38d9a93', query: q, language: 'it-IT' }
      });

      const results = data.results.slice(0, 5);

      if (searchType === 'movie') {
        setSuggestions(results);
      } else {
        const formatted = results.map(p => ({
          id: p.id,
          name: p.name,
          known_for: p.known_for?.filter(k => k.title).map(k => k.title).slice(0, 2)
        }));
        setSuggestions(formatted);
      }

      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setVisibleCount(3);
    try {
      const { data } = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      console.log("📦 Risultato completo:", data);
      setResult(data);
    } catch {
      setResult({ error: 'Errore nella richiesta.' });
    }
    setLoading(false);
  };

  const renderCards = (movies) => (
    <>
      {movies.slice(0, visibleCount).map((movie, index) => (
        <div key={index} className="card mb-5 shadow-sm border-0">
          <div className="row g-0">
            <div className="col-md-4">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.tmdb.poster_path}`}
                alt={movie.tmdb.title}
                className="img-fluid rounded-start"
              />
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h3 className="card-title">{movie.tmdb.title}</h3>
                <p className="text-muted mb-2">
                  Anno: {movie.tmdb.release_date?.slice(0, 4)} — ⭐ {movie.tmdb.vote_average} ({movie.tmdb.vote_count} voti)
                </p>
                <p><strong>Regia di:</strong> <a href={`/director/${encodeURIComponent(movie.credits.director)}`}>
  {movie.credits.director}
</a></p>
                <p><strong>Attori principali:</strong>{" "}
                  {movie.credits.cast.map((actor, idx) => (
  <span key={idx}>
    <a href={`/person/${encodeURIComponent(actor)}`}>{actor}</a>
    {idx < movie.credits.cast.length - 1 && ', '}
  </span>
))}
                </p>
                {movie.tmdb.genres?.length > 0 && (
  <p><strong>Genere:</strong> {movie.tmdb.genres.map(g => g.name).join(', ')}</p>
)}
                <p className="mt-3">{movie.tmdb.overview}</p>

                {movie.trailer_url && (
                  <div className="ratio ratio-16x9 mb-4">
                    <iframe src={movie.trailer_url} title="Trailer" allowFullScreen />
                  </div>
                )}

                <h5 className="mt-4">Disponibile su:</h5>
                <ul className="list-group list-group-horizontal flex-wrap">
                  {movie.providers.length === 0 && (
                    <li className="list-group-item text-muted">⚠️ Nessuna piattaforma trovata.</li>
                  )}
                  {movie.providers.map((p, i) => (
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
      ))}

      {movies.length > visibleCount && (
        <div className="text-center my-4">
          <button
            className="btn btn-outline-primary btn-lg"
            onClick={() => setVisibleCount(prev => prev + 3)}
          >
            <i className="bi bi-chevron-down me-2"></i>Mostra altri
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <Head>
        <title>CineFinder 🎬</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container my-5">
        <h1 className="text-center mb-4">CineFinder 🎬</h1>

        <div className="d-flex justify-content-center mb-3 flex-wrap">
          {['movie', 'person', 'director'].map(type => (
            <div className="form-check form-check-inline" key={type}>
              <input
                className="form-check-input"
                type="radio"
                name="searchType"
                id={`search-${type}`}
                value={type}
                checked={searchType === type}
                onChange={(e) => setSearchType(e.target.value)}
              />
              <label className="form-check-label" htmlFor={`search-${type}`}>
                {type === 'movie' ? '🎬 Film' : type === 'person' ? '🎭 Attore' : '🎬 Regista'}
              </label>
            </div>
          ))}
        </div>

        <div className="input-group mb-4 position-relative mx-auto" style={{ maxWidth: 600 }}>
          <input
            type="text"
            className="form-control"
            placeholder={
              searchType === 'movie'
                ? "Scrivi un titolo..."
                : searchType === 'person'
                ? "Scrivi un attore..."
                : "Scrivi un regista..."
            }
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            onFocus={() => fetchSuggestions(query)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" type="button" onClick={handleSearch}>Cerca</button>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="list-group position-absolute w-100" style={{ zIndex: 999, top: '100%' }}>
              {suggestions.map(s => (
                <li
                  key={s.id}
                  className="list-group-item list-group-item-action"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const queryText = searchType === 'movie' ? s.title : s.name;
                    setQuery(queryText);
                    setShowSuggestions(false);
                    handleSearch();
                  }}
                >
                  {searchType === 'movie' ? s.title : s.name}
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

        {result?.person && (
          <>
            <h3 className="mb-4">Film con {result.person}:</h3>
            {renderCards(result.results)}
          </>
        )}

        {result?.director && (
          <>
            <h3 className="mb-4">Film diretti da {result.director}:</h3>
            {renderCards(result.results)}
          </>
        )}

        {result?.tmdb && !result?.person && !result?.director && (
          <>{renderCards([result])}</>
        )}
      </div>
    </>
  );
}