export default async function handler(req, res) {
  const { user, limit = 20 } = req.query;

  if (!user) {
    res.status(400).json({ error: 'Parâmetro "user" (endereço da carteira) é obrigatório.' });
    return;
  }

  try {
    const url = `https://data-api.polymarket.com/activity?user=${encodeURIComponent(user)}&limit=${encodeURIComponent(limit)}&sortBy=TIMESTAMP&sortDirection=DESC`;
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await upstream.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=4, stale-while-revalidate=10');
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao buscar dados da Polymarket.', details: String(err) });
  }
}
