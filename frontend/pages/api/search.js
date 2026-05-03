export default async function handler(req, res) {
  const { q, id, type = 'movie', sort_by = 'vote_average' } = req.query;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY non configurata' });
  }

  try {
    if (id) return res.json(await getByTmdbId(id, TMDB_API_KEY));
    if (!q) return res.status(400).json({ error: 'Parametro mancante' });

    if (type === 'movie') return res.json(await searchByTitle(q, sort_by, TMDB_API_KEY));
    if (type === 'person') return res.json(await searchByActor(q, sort_by, TMDB_API_KEY));
    if (type === 'director') return res.json(await searchByDirector(q, sort_by, TMDB_API_KEY));

    return res.status(400).json({ error: 'Tipo di ricerca non valido' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}

async function tmdbGet(path, params, apiKey) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString());
  return r.json();
}

async function getByTmdbId(tmdbId, apiKey) {
  const [movie, credits, videos, providers] = await Promise.all([
    tmdbGet(`/movie/${tmdbId}`, { language: 'it-IT' }, apiKey),
    tmdbGet(`/movie/${tmdbId}/credits`, {}, apiKey),
    tmdbGet(`/movie/${tmdbId}/videos`, { language: 'it-IT' }, apiKey),
    tmdbGet(`/movie/${tmdbId}/watch/providers`, {}, apiKey),
  ]);

  const director = credits.crew?.find(c => c.job === 'Director')?.name ?? 'Sconosciuto';
  const cast = credits.cast?.slice(0, 3).map(c => c.name) ?? [];
  const genres = movie.genres?.map(g => g.name) ?? [];

  const trailer = videos.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;

  const itProviders = providers.results?.IT ?? {};
  const tmdbWatchLink = itProviders.link ?? null;

  const providerList = [];
  for (const kind of ['flatrate', 'rent', 'buy', 'free']) {
    for (const p of itProviders[kind] ?? []) {
      providerList.push({
        name: p.provider_name,
        type: kind,
        logo_path: p.logo_path,
        direct_url: tmdbWatchLink,
      });
    }
  }

  return { tmdb: movie, credits: { director, cast }, genres, trailer_url: trailerUrl, providers: providerList };
}

async function searchByTitle(title, sortBy, apiKey) {
  const data = await tmdbGet('/search/movie', { query: title, language: 'it-IT' }, apiKey);
  const results = (data.results ?? [])
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
    .slice(0, 15);
  return Promise.all(results.filter(r => r.id).map(r => getByTmdbId(r.id, apiKey)));
}

async function searchByActor(name, sortBy, apiKey) {
  const search = await tmdbGet('/search/person', { query: name }, apiKey);
  if (!search.results?.length) return { error: 'Attore non trovato' };

  const person = search.results[0];
  const credits = await tmdbGet(`/person/${person.id}/movie_credits`, { language: 'it-IT' }, apiKey);
  const movies = (credits.cast ?? [])
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
    .slice(0, 15);

  const results = await Promise.all(movies.filter(m => m.id).map(m => getByTmdbId(m.id, apiKey)));
  return { person: person.name, results };
}

async function searchByDirector(name, sortBy, apiKey) {
  const search = await tmdbGet('/search/person', { query: name }, apiKey);
  if (!search.results?.length) return { error: 'Regista non trovato' };

  const person = search.results[0];
  const credits = await tmdbGet(`/person/${person.id}/movie_credits`, { language: 'it-IT' }, apiKey);
  const directed = (credits.crew ?? []).filter(m => m.job === 'Director');
  const movies = directed
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))
    .slice(0, 15);

  const results = await Promise.all(movies.filter(m => m.id).map(m => getByTmdbId(m.id, apiKey)));
  return { director: person.name, results };
}
