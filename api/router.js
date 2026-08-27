const handlers = Object.freeze({
  'ai-chat': require('./ai-chat'),
  'ai-reading': require('./ai-reading'),
  'ai-dual-reading': require('./ai-dual-reading'),
  'alipay': require('./alipay'),
  'alipay-notify': require('./alipay-notify'),
  'auth-login': require('./auth-login'),
  'auth-logout': require('./auth-logout'),
  'auth-recover': require('./auth-recover'),
  'auth-signup': require('./auth-signup'),
  'balance': require('./balance'),
  'check-order': require('./check-order'),
  'consume-credit': require('./consume-credit'),
  'divination-chart': require('./divination-chart'),
  'redeem': require('./redeem'),
  'session': require('./session'),
  'user-data': require('./user-data')
});

module.exports = async function router(req, res) {
  const routeValue = req.query && req.query.route;
  const route = Array.isArray(routeValue) ? routeValue.join('/') : String(routeValue || '');
  const handler = handlers[route];

  if (!handler) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }

  return handler(req, res);
};
