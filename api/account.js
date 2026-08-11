const { noStore, readJson } = require('./_lib');
const {
  bindGuestAccount,
  signIn,
  signOutToGuest,
  requestPasswordReset,
  completePasswordReset
} = require('./_auth');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const action = String(body.action || '');
    let result;
    if (action === 'save') result = await bindGuestAccount(req, res, body.email, body.password);
    else if (action === 'login') result = await signIn(req, res, body.email, body.password);
    else if (action === 'logout') result = await signOutToGuest(req, res);
    else if (action === 'request-reset') result = await requestPasswordReset(req, body.email);
    else if (action === 'reset') result = await completePasswordReset(req, res, body.email, body.token, body.password);
    else return res.status(400).json({ success: false, error: '未知账号操作' });
    return res.status(result.status || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    console.error('[account]', e.message);
    const isConflict = e.status === 409 || (e.details && String(e.details.code || '') === '23505');
    return res.status(isConflict ? 409 : 503).json({
      success: false,
      code: isConflict ? 'EMAIL_EXISTS' : 'ACCOUNT_UNAVAILABLE',
      error: isConflict ? '该邮箱已有保存账号，请使用“恢复数据”' : '账号服务暂不可用，请稍后重试'
    });
  }
};
