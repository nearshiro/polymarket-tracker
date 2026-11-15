const BASE = 'https://data-api.polymarket.com';

function toSeconds(t) {
  const n = Number(t);
  if (!isNaN(n)) return n > 1e12 ? Math.floor(n / 1000) : n;
  const d = Date.parse(t);
  return isNaN(d) ? 0 : Math.floor(d / 1000);
}

// Converte o formato novo da Polymarket (v2, snake_case) para o formato que o site já entende
function normalize(i) {
  const g = (...keys) => {
    for (const k of keys) if (i[k] !== undefined && i[k] !== null) return i[k];
    return undefined;
  };
  return {
    ...i,
    proxyWallet: g('proxyWallet', 'proxy_wallet', 'wallet'),
    timestamp: toSeconds(g('timestamp')),
    conditionId: g('conditionId', 'condition_id'),
    asset: g('asset', 'token_id', 'asset_id', 'assetId'),
    usdcSize: g('usdcSize', 'usdc_size', 'amount'),
    size: g('size', 'shares'),
    transactionHash: g('transactionHash', 'transaction_hash'),
    eventSlug: g('eventSlug', 'event_slug'),
    outcomeIndex: g('outcomeIndex', 'outcome_index'),
    profileImage: g('profileImage', 'profile_image')
  };
}

export default async function handler(req, res) {
  const { user, limit = 20 } = req.query;

  if (!user) {
    res.status(400).json({ error: 'Parâmetro "user" (endereço da carteira) é obrigatório.' });
    return;
  }

  const query = `user=${encodeURIComponent(user)}&limit=${encodeURIComponent(limit)}`;
  const headers = { Accept: 'application/json' };

  try {
    // Endpoint atual (v2); se falhar, tenta o antigo
    let upstream = await fetch(`${BASE}/v2/activity?${query}`, { headers });
    if (!upstream.ok) {
      upstream = await fetch(`${BASE}/activity?${query}&sortBy=TIMESTAMP&sortDirection=DESC`, { headers });
    }
    const json = await upstream.json().catch(() => ({}));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=4, stale-while-revalidate=10');

    if (!upstream.ok) {
      res.status(upstream.status).json(json);
      return;
    }

    const rows = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
    res.status(200).json(rows.map(normalize).sort((a, b) => b.timestamp - a.timestamp));
  } catch (err) {
    res.status(500).json({ error: 'Falha ao buscar dados da Polymarket.', details: String(err) });
  }
}
