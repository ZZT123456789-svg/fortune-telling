/** AI八字深度解读：登录 + 服务端原子扣 1 次 + 失败自动退款 */
const { noStore, readJson, verifyUser, serviceRpc, randomRequestId } = require('./_lib');
const { callDeepSeek } = require('./_deepseek');

const COST = 1;

function safeText(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 300);
}

function buildPrompt(c) {
  const wx = JSON.stringify(c.wx || {}).slice(0, 1000);
  const ss = JSON.stringify(c.ss || []).slice(0, 1000);
  const dayun = JSON.stringify(c.dayun || []).slice(0, 2000);
  return '你是一位熟悉《滴天髓》《穷通宝鉴》《子平真诠》的传统命理文化解读助手。请只依据以下结构化八字数据进行解释，不补造缺失的出生信息。\n\n' +
    '八字：' + safeText(c.year) + ' ' + safeText(c.month) + ' ' + safeText(c.day) + ' ' + safeText(c.hour) + '\n' +
    '日主：' + safeText(c.dm) + '（五行' + safeText(c.de) + '）\n' +
    '性别：' + safeText(c.gender) + ' 生肖：' + safeText(c.sx) + '\n' +
    '五行分布：' + wx + '\n十神：' + ss + '\n身强弱：' + safeText(c.strength) +
    '\n调候用神：' + safeText(c.tiaoHou) + '\n格局：' + safeText(c.pattern, 600) + '\n大运：' + dayun + '\n\n' +
    '按“命格总览、事业财运、感情婚姻、健康提示、人生建议”分段输出。每条结论说明依据；保持文化体验性质，不把推断说成确定事实。健康内容只做一般生活方式提示，不作诊断。';
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  let debitId = '';
  let user = null;
  try {
    user = await verifyUser(req);
    if (!user) return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: '请先登录账号' });

    const body = await readJson(req);
    const chart = body.chart;
    if (!chart || typeof chart !== 'object' || Array.isArray(chart)) {
      return res.status(400).json({ success: false, error: '缺少八字数据' });
    }
    if (JSON.stringify(chart).length > 12000) {
      return res.status(413).json({ success: false, error: '八字数据过大' });
    }

    debitId = randomRequestId('ai-reading');
    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_reason: 'ai-reading',
      p_request_id: debitId
    });
    if (!debit || debit.success !== true) {
      if (debit && debit.code === 'INSUFFICIENT') {
        return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '解读次数不足', balance: Number(debit.balance || 0), cost: COST });
      }
      return res.status(409).json({ success: false, error: '扣费失败，请刷新余额后重试' });
    }

    const prompt = buildPrompt(chart);
    const content = await callDeepSeek([{ role: 'user', content: prompt }], { maxTokens: 2200, temperature: 0.65 });
    return res.status(200).json({ success: true, content, cost: COST, balance: Number(debit.balance || 0) });
  } catch (e) {
    if (user && debitId) {
      try {
        await serviceRpc('api_refund_credits', {
          p_user_id: user.id,
          p_amount: COST,
          p_request_id: debitId,
          p_reason: 'ai-reading-failure'
        });
      } catch (refundErr) {
        console.error('[ai-reading] refund failed:', refundErr.message);
      }
    }
    console.error('[ai-reading]', e.message);
    return res.status(503).json({ success: false, error: 'AI 服务暂不可用，本次已自动退回次数' });
  }
};
