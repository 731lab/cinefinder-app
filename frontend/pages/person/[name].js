import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function PersonPage() {
  const router = useRouter();
  const { name } = router.query;
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('vote_average');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cinefinder-backend-322727979682.europe-west1.run.app";

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    axios.get(`${API_URL}/search`, {
      params: { q: name, type: 'person', sort_by: sortBy }
    })
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
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.tmdb.poster_path}`}
                alt={movie.tmdb.title}
                className="img-fluid rounded-start"
              />
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h5 className="card-title">
                  <Link href={`/movie/${movie.tmdb.id}`}>{movie.tmdb.title}</Link>
                </h5>
                <p className="text-muted">Anno: {movie.tmdb.release_date?.slice(0, 4)}</p>
                <p><strong>Regista:</strong> <Link href={`/director/${movie.credits.director}`}>{movie.credits.director}</Link></p>
                <p><strong>Cast:</strong> {movie.credits.cast.map((a, i) => (
                  <span key={i}>
                    <Link href={`/person/${a}`}>{a}</Link>{i < movie.credits.cast.length - 1 ? ', ' : ''}
                  </span>
                ))}</p>
                <p><strong>Genere:</strong> {movie.tmdb.genres?.map(g => g.name).join(', ')}</p>
                <p>{movie.tmdb.overview}</p>
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
      <h1 className="mb-4">Film con {name}</h1>

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