const { noStore, readJson, dataRequest } = require('./_lib');
const { requireUser } = require('./_auth');

const MAX_BYTES = 96 * 1024;

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  try {
    const user = await requireUser(req, res);
    if (req.method === 'GET') {
      const rows = await dataRequest('/rest/v1/user_data?user_id=eq.' + encodeURIComponent(user.id) + '&select=payload,updated_at&limit=1');
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      return res.status(200).json({ success: true, data: row ? row.payload : null, updatedAt: row ? row.updated_at : null });
    }

    const body = await readJson(req);
    const payload = body && body.data;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(400).json({ success: false, error: '保存数据格式无效' });
    }
    const encoded = JSON.stringify(payload);
    if (Buffer.byteLength(encoded, 'utf8') > MAX_BYTES) {
      return res.status(413).json({ success: false, error: '保存数据过大' });
    }
    await dataRequest('/rest/v1/user_data?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: user.id, payload, updated_at: new Date().toISOString() })
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[user-data]', e.message);
    return res.status(503).json({ success: false, error: '数据保存服务暂不可用' });
  }
};
