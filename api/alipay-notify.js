/**
 * ZPay 异步通知 — Vercel Serverless Function
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('ZPay notify:', JSON.stringify(req.body));
  // ZPay 回调验证 & 处理
  res.send('success');
};
