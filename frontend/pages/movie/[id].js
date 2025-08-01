import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cinefinder-backend-322727979682.europe-west1.run.app";

export default function MoviePage() {
  const { id } = useRouter().query;
  const [m, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios.get(`${API_URL}/search?id=${id}&type=movie`)
      .then(res => setMovie(res.data))
      .catch(err => console.error("Errore nel fetch:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center my-5">Caricamento...</p>;
  if (!m) return <p className="text-center my-5">Film non trovato.</p>;

  return (
    <div className="container my-5">
      <Head><title>{m.tmdb.title} – CineFinder</title></Head>
      <h1>{m.tmdb.title}</h1>
      
      <p><strong>Genere:</strong> {m.tmdb.genres?.map(g => g.name).join(', ')}</p>

      <p><strong>Regista:</strong>{' '}
        <Link href={`/director/${encodeURIComponent(m.credits.director)}`} className="link-primary">
          {m.credits.director}
        </Link>
      </p>

      <p><strong>Attori principali:</strong>{' '}
        {m.credits.cast.map((actor, idx) => (
          <span key={idx}>
            <Link href={`/person/${encodeURIComponent(actor)}`} className="link-secondary">{actor}</Link>
            {idx < m.credits.cast.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>

      <p className="mt-3">{m.tmdb.overview}</p>

      {m.trailer_url && (
        <div className="ratio ratio-16x9 my-4">
          <iframe src={m.trailer_url} title="Trailer" allowFullScreen />
        </div>
      )}
    </div>
  );
}