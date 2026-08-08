const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIG_SOURCE, noStore } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  let projectRef = '';
  try {
    projectRef = new URL(SUPABASE_URL).hostname.split('.')[0] || '';
  } catch (_) {}

  // URL and anon/publishable key are public browser config. Service-role credentials are never returned.
  return res.status(200).json({
    success: true,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    projectRef,
    source: SUPABASE_CONFIG_SOURCE
  });
};
