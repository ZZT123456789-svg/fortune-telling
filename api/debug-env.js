const { DATA_API_URL } = require('./_lib');

module.exports = async function handler(req, res) {
  return res.status(200).json({
    DATA_API_URL: !!DATA_API_URL,
    DATA_API_URL_len: DATA_API_URL.length,
    SUPABASE_URL_set: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATA_SERVICE_KEY_set: !!process.env.DATA_SERVICE_KEY
  });
};
