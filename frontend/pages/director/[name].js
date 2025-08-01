import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cinefinder-backend-322727979682.europe-west1.run.app";

export default function DirectorPage() {
  const router = useRouter();
  const { name } = router.query;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name) return;
    setLoading(true);

    const url = `${API_URL}/search?q=${name}&type=director`;
    console.log("🔗 Chiamata API:", url);

    axios.get(url)
      .then(res => {
        console.log("✅ Risposta:", res.data);
        setResult(res.data);
      })
      .catch(err => {
        console.error("❌ Errore API:", err);
        setResult({ error: 'Errore durante la ricerca.' });
      })
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Regista: {name}</h1>

      {loading && <p>Caricamento...</p>}
      {result?.error && <p className="text-danger">{result.error}</p>}

      {result?.results && result.results.map((movie, i) => (
        <div key={i} className="card mb-3">
          <div className="card-body">
            <h5><Link href={`/movie/${movie.tmdb.id}`}>
            {movie.tmdb.title}
             </Link>
            </h5>
            <p><strong>Anno:</strong> {movie.tmdb.release_date?.slice(0, 4)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}