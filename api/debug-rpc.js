const { dataRpc } = require('./_lib');
const { requireUser } = require('./_auth');

module.exports = async function handler(req, res) {
  try {
    const user = await requireUser(req, res);
    const result = await dataRpc('api_get_balance', { p_user_id: user.id });
    return res.status(200).json({ success: true, user: user.id, balance: result });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, status: e.status, details: JSON.stringify(e.details).slice(0, 500) });
  }
};
