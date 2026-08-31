/** 紫微 AI 深度解读：基础命盘免费；AI 成功生成后原子扣 1 次。 */
const { noStore, readJson, serviceRpc, randomRequestId } = require('./_lib');
const { requireUser } = require('./_auth');
const { callDeepSeek } = require('./_deepseek');

const COST = 1;

function safeText(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 300);
}

function buildPrompt(chart) {
  const school = chart.school === 'zhongzhou' ? '中州派' : '通行派';
  const payload = JSON.stringify(chart).slice(0, 42000);
  return '你是一位紫微斗数传统文化解读助手。以下命盘已经由 iztro 2.6.0 按' + school + '算法计算完成。\n' +
    '必须完全使用给定结构化数据，不得重新推算出生盘，不得改写宫位、星曜、四化或运限。\n' +
    '重点读取当前选中的宫位、activeLevel 运限层级、该层流曜、四化列表，以及本命十二宫关系。\n' +
    '依次输出：一、命盘总览；二、所选宫位；三、当前运限；四、四化飞入飞出；五、三方四正；六、可执行建议。\n' +
    '每个结论都紧跟“依据”，明确引用宫位、星曜、亮度、四化或运限层级。不得出现“可信度”字样，不作医疗诊断，不把趋势描述成确定事件。\n\n' +
    '结构化命盘：' + payload;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await requireUser(req, res);
    const body = await readJson(req);
    const chart = body.chart;
    if (!chart || typeof chart !== 'object' || Array.isArray(chart)) {
      return res.status(400).json({ success: false, error: '缺少紫微命盘数据' });
    }
    const raw = JSON.stringify(chart);
    if (raw.length > 60000) return res.status(413).json({ success: false, error: '紫微命盘数据过大' });

    // 先核验余额，避免余额不足时调用模型；真正扣费在模型成功返回后执行。
    const before = Number(await serviceRpc('api_get_balance', { p_user_id: user.id }) || 0);
    if (before < COST) {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '解读次数不足', balance: before, cost: COST });
    }

    const content = await callDeepSeek([{ role: 'user', content: buildPrompt(chart) }], { maxTokens: 2600, temperature: 0.55 });
    if (!safeText(content, 80)) throw new Error('AI returned empty content');

    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_reason: 'ai-ziwei-reading',
      p_request_id: randomRequestId('ai-ziwei-reading')
    });
    if (!debit || debit.success !== true) {
      if (debit && debit.code === 'INSUFFICIENT') {
        return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '余额刚刚发生变化，请刷新后重试', balance: Number(debit.balance || 0), cost: COST });
      }
      return res.status(409).json({ success: false, error: '解读已生成，但扣费确认失败，请重试' });
    }

    return res.status(200).json({ success: true, content, cost: COST, balance: Number(debit.balance || 0) });
  } catch (error) {
    console.error('[ai-ziwei-reading]', error.message);
    return res.status(503).json({ success: false, charged: false, cost: 0, error: 'AI 服务暂不可用，本次未扣费' });
  }
};
