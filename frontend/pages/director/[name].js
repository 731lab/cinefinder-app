import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import Head from 'next/head';

export default function DirectorPage() {
  const router = useRouter();
  const { name } = router.query;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('vote_average');

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    axios.get(`/api/search`, { params: { q: name, type: 'director', sort_by: sortBy } })
      .then(res => setResult(res.data))
      .catch(() => setResult({ error: 'Errore durante la ricerca.' }))
      .finally(() => setLoading(false));
  }, [name, sortBy]);

  const renderCards = (movies) => (
    <div>
      {movies.map((movie, index) => (
        <div key={index} className="card mb-4">
          <div className="row g-0">
            <div className="col-md-4">
              {movie.tmdb.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.tmdb.poster_path}`}
                  alt={movie.tmdb.title}
                  className="img-fluid rounded-start"
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 bg-light rounded-start" style={{ minHeight: 200 }}>
                  <span className="text-muted">Nessuna immagine</span>
                </div>
              )}
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h5 className="card-title">
                  <Link href={`/movie/${movie.tmdb.id}`}>{movie.tmdb.title}</Link>
                </h5>
                <p className="text-muted">Anno: {movie.tmdb.release_date?.slice(0, 4)} — ⭐ {movie.tmdb.vote_average} ({movie.tmdb.vote_count} voti)</p>
                <p><strong>Cast:</strong>{' '}
                  {movie.credits.cast.map((a, i) => (
                    <span key={i}>
                      <Link href={`/person/${encodeURIComponent(a)}`}>{a}</Link>
                      {i < movie.credits.cast.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
                {movie.tmdb.genres?.length > 0 && (
                  <p><strong>Genere:</strong> {movie.tmdb.genres.map(g => g.name).join(', ')}</p>
                )}
                {movie.tmdb.overview && <p>{movie.tmdb.overview}</p>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container my-5">
      <Head><title>{name} – CineFinder</title></Head>
      <h1 className="mb-4">Film diretti da {name}</h1>

      <div className="mb-4">
        <label htmlFor="sortSelect" className="form-label">Ordina per:</label>
        <select
          id="sortSelect"
          className="form-select w-auto d-inline-block ms-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="vote_average">⭐ Voto</option>
          <option value="popularity">🔥 Popolarità</option>
        </select>
      </div>

      {loading && <p>Caricamento in corso...</p>}
      {result?.error && <div className="alert alert-danger">{result.error}</div>}
      {result?.results && renderCards(result.results)}
    </div>
  );
}
