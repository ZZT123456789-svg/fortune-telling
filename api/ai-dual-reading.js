/** 双人合盘 AI：同盘缓存；首次成功扣 4 次；失败按原扣费流水精确冲正。 */
const { noStore, readJson, serviceRpc, dataRequest, sha256Hex, randomRequestId } = require('./_lib');
const { requireUser } = require('./_auth');
const { callDeepSeek } = require('./_deepseek');

const COST = 4;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((out, key) => {
    out[key] = stable(value[key]); return out;
  }, {});
  return value;
}

function safe(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 12000);
}

function prompt(body) {
  const a = JSON.stringify(body.a || {}).slice(0, 11000);
  const b = JSON.stringify(body.b || {}).slice(0, 11000);
  const compat = JSON.stringify(body.compat || {}).slice(0, 1800);
  return '你是一位传统八字文化合盘解读助手。以下甲乙命盘均由成熟历法引擎预先计算。你不得重新推算或修改四柱，不得补造出生信息。\n\n' +
    '甲方结构化命盘：' + a + '\n\n乙方结构化命盘：' + b + '\n\n基础合盘：' + compat + '\n\n' +
    '请依次输出：## 总体结构、## 日主强弱与五行互补、## 喜忌与用神互补、## 日支夫妻宫、## 天干合克、## 地支合冲刑害破、## 十神互动、## 性格与沟通、## 感情相处、## 事业财运协作、## 大运流年同步与冲突、## 相处建议。' +
    '每节使用“结论、命盘依据、可能的反向条件”组织内容。只引用输入中的四柱、藏干、十神、旺衰、喜用、关系和岁运证据。不要使用“可信度”字样，不作绝对吉凶、医疗诊断或命定婚姻结论。';
}

async function refund(userId, debitId) {
  return serviceRpc('api_refund_ai_usage', {
    p_user_id: userId,
    p_debit_request_id: debitId,
    p_amount: COST,
    p_reason: 'ai-dual-reading-failed'
  });
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  let user = null;
  let debitId = '';
  let debited = false;
  try {
    user = await requireUser(req, res);
    const body = await readJson(req);
    if (!body.a || !body.b || typeof body.a !== 'object' || typeof body.b !== 'object') {
      return res.status(400).json({ success: false, error: '缺少双人命盘数据' });
    }
    const encoded = JSON.stringify(body);
    if (Buffer.byteLength(encoded, 'utf8') > 30000) return res.status(413).json({ success: false, error: '双人命盘数据过大' });
    const chartHash = sha256Hex(JSON.stringify(stable({ a: body.a, b: body.b })));
    const cached = await dataRequest('/rest/v1/ai_dual_readings?user_id=eq.' + encodeURIComponent(user.id) + '&chart_hash=eq.' + chartHash + '&select=content&limit=1');
    if (Array.isArray(cached) && cached[0] && cached[0].content) {
      const balance = await serviceRpc('api_get_balance', { p_user_id: user.id });
      return res.status(200).json({ success: true, cached: true, content: cached[0].content, cost: 0, balance: Number(balance || 0) });
    }

    debitId = randomRequestId('ai-dual-reading');
    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id, p_amount: COST, p_reason: 'ai-dual-reading', p_request_id: debitId
    });
    if (!debit || debit.success !== true) {
      if (debit && debit.code === 'INSUFFICIENT') return res.status(402).json({ success:false, code:'INSUFFICIENT', error:'双人 AI 合盘需要 4 次余额', balance:Number(debit.balance||0), cost:COST });
      return res.status(409).json({ success:false, error:'扣费失败，请刷新余额后重试' });
    }
    debited = true;
    const content = safe(await callDeepSeek([{ role:'user', content:prompt(body) }], { maxTokens:3200, temperature:0.55 }), 20000);
    if (!content) throw new Error('empty AI content');
    await dataRequest('/rest/v1/ai_dual_readings?on_conflict=user_id,chart_hash', {
      method:'POST', headers:{ Prefer:'resolution=merge-duplicates,return=minimal' },
      body:JSON.stringify({ user_id:user.id, chart_hash:chartHash, content, updated_at:new Date().toISOString() })
    });
    return res.status(200).json({ success:true, cached:false, content, cost:COST, balance:Number(debit.balance||0) });
  } catch (error) {
    console.error('[ai-dual-reading]', error.message);
    let balance;
    let refunded = false;
    if (debited && user && debitId) {
      try {
        const result = await refund(user.id, debitId);
        refunded = !!(result && result.success);
        if (result && result.balance != null) balance = Number(result.balance);
      } catch (refundError) {
        console.error('[ai-dual-reading-refund]', refundError.message);
      }
    }
    return res.status(503).json({ success:false, refunded, balance, cost:refunded?0:COST, error:refunded?'AI 生成失败，本次 4 次已自动退回':'AI 服务暂不可用，请稍后重试' });
  }
};
