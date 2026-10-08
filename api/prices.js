export default async function handler(req, res) {
  const { user, limit = 100 } = req.query;

  if (!user) {
    res.status(400).json({ error: 'Parâmetro "user" (endereço da carteira) é obrigatório.' });
    return;
  }

  const headers = { Accept: 'application/json' };
  const query = `user=${encodeURIComponent(user)}&limit=${encodeURIComponent(limit)}`;

  try {
    // Endpoint atual da Polymarket
    let upstream = await fetch(`https://data-api.polymarket.com/v2/positions?${query}`, { headers });

    // Plano B: endpoint antigo, caso o novo falhe
    if (!upstream.ok) {
      upstream = await fetch(`https://data-api.polymarket.com/positions?${query}`, { headers });
    }

    const data = await upstream.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=4, stale-while-revalidate=10');
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao buscar posições na Polymarket.', details: String(err) });
  }
}
