/** AI命理助手：匿名浏览器身份 + 服务端原子扣 2 次 + 失败自动退款 */
const { noStore, readJson, serviceRpc, randomRequestId } = require('./_lib');
const { requireUser } = require('./_auth');
const { callDeepSeek } = require('./_deepseek');

const COST = 2;

function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  let total = 0;
  for (const item of input.slice(-10)) {
    if (!item || (item.role !== 'user' && item.role !== 'assistant')) continue;
    const content = String(item.content || '').trim().slice(0, 4000);
    if (!content) continue;
    total += content.length;
    if (total > 12000) break;
    out.push({ role: item.role, content });
  }
  return out;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  let debitId = '';
  let user = null;
  try {
    user = await requireUser(req, res);

    const body = await readJson(req);
    const messages = cleanMessages(body.messages);
    if (!messages.length) return res.status(400).json({ success: false, error: '缺少有效消息' });

    debitId = randomRequestId('ai-chat');
    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_reason: 'ai-chat',
      p_request_id: debitId
    });
    if (!debit || debit.success !== true) {
      if (debit && debit.code === 'INSUFFICIENT') {
        return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '解读次数不足', balance: Number(debit.balance || 0), cost: COST });
      }
      return res.status(409).json({ success: false, error: '扣费失败，请刷新余额后重试' });
    }

    const fullMessages = [
      { role: 'system', content: '你是“道问”的传统文化命理辅助解读助手。只能依据用户给出的命盘、卦象或牌面信息做文化性解释，不编造用户未提供的命盘数据。用清晰、克制的中文回答；涉及医学、法律、投资等重要事项时明确提示不能替代专业建议。' }
    ].concat(messages);

    const content = await callDeepSeek(fullMessages, { maxTokens: 1200, temperature: 0.7 });
    return res.status(200).json({ success: true, content, cost: COST, balance: Number(debit.balance || 0) });
  } catch (e) {
    if (user && debitId) {
      try {
        await serviceRpc('api_refund_credits', {
          p_user_id: user.id,
          p_amount: COST,
          p_request_id: debitId,
          p_reason: 'ai-chat-failure'
        });
      } catch (refundErr) {
        console.error('[ai-chat] refund failed:', refundErr.message);
      }
    }
    console.error('[ai-chat]', e.message);
    return res.status(503).json({ success: false, error: 'AI 服务暂不可用，本次已自动退回次数' });
  }
};
