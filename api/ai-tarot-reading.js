/** 塔罗 AI 深度解读：基础牌义免费；普通牌阵 1 次，凯尔特十字 2 次。 */
const { noStore, readJson, serviceRpc, randomRequestId } = require('./_lib');
const { requireUser } = require('./_auth');
const { callDeepSeek } = require('./_deepseek');

const SPREADS = Object.freeze({ daily: 1, yesno: 1, three: 3, love: 5, career: 5, celtic: 10 });

function safeText(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 300);
}

function validateReading(reading) {
  if (!reading || typeof reading !== 'object' || Array.isArray(reading)) throw new Error('缺少塔罗牌阵数据');
  const spread = safeText(reading.spread, 20);
  const expected = SPREADS[spread];
  if (!expected) throw new Error('不支持的塔罗牌阵');
  if (!Array.isArray(reading.cards) || reading.cards.length !== expected) throw new Error('牌阵张数不正确');
  const cards = reading.cards.map((card) => {
    const id = Number(card && card.id);
    if (!Number.isInteger(id) || id < 0 || id > 77) throw new Error('牌面编号不正确');
    const orientation = card.orientation === 'reversed' ? 'reversed' : card.orientation === 'upright' ? 'upright' : '';
    if (!orientation) throw new Error('牌面方向不正确');
    return {
      id,
      name: safeText(card.name, 60),
      englishName: safeText(card.englishName, 80),
      position: safeText(card.position, 80),
      orientation,
      meaning: safeText(card.meaning, 500)
    };
  });
  if (new Set(cards.map((card) => card.id)).size !== cards.length) throw new Error('牌阵中存在重复牌面');
  const question = safeText(reading.question, 240);
  if (!question) throw new Error('请填写占卜问题');
  return { spread, spreadName: safeText(reading.spreadName, 60), question, cards };
}

function buildPrompt(reading) {
  const payload = JSON.stringify(reading);
  return '你是一位审慎、具体的塔罗传统文化解读助手。牌组采用 Rider-Waite-Smith 体系，抽牌结果已由系统确定。\n' +
    '必须严格使用给定问题、牌阵位置、牌名与正逆位，不得重新抽牌、改牌或遗漏位置。\n' +
    '输出结构：一、核心结论；二、逐位置解读；三、牌与牌之间的关系；四、可执行建议；五、需要保留观察的变量。\n' +
    '每个重要判断都要说明依据来自哪张牌、哪个位置和正逆位。避免绝对预测、恐吓、医疗或法律定论；将结果表达为自我观察与决策参考。\n' +
    (reading.spread === 'yesno' ? '这是是非问题：先给出“倾向是／倾向否／暂不明确”，随后说明限制条件。\n' : '') +
    (reading.spread === 'celtic' ? '这是凯尔特十字：必须综合十个位置形成完整叙事，不得逐牌孤立拼接。\n' : '') +
    '\n结构化牌阵：' + payload;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await requireUser(req, res);
    const body = await readJson(req);
    const reading = validateReading(body.reading);
    const cost = reading.spread === 'celtic' ? 2 : 1;

    const before = Number(await serviceRpc('api_get_balance', { p_user_id: user.id }) || 0);
    if (before < cost) {
      return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '解读次数不足', balance: before, cost });
    }

    const content = await callDeepSeek([{ role: 'user', content: buildPrompt(reading) }], {
      maxTokens: reading.spread === 'celtic' ? 3200 : 2200,
      temperature: 0.6
    });
    if (!safeText(content, 80)) throw new Error('AI returned empty content');

    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: cost,
      p_reason: 'ai-tarot-reading-' + reading.spread,
      p_request_id: randomRequestId('ai-tarot-reading')
    });
    if (!debit || debit.success !== true) {
      if (debit && debit.code === 'INSUFFICIENT') {
        return res.status(402).json({ success: false, code: 'INSUFFICIENT', error: '余额刚刚发生变化，请刷新后重试', balance: Number(debit.balance || 0), cost });
      }
      return res.status(409).json({ success: false, error: '解读已生成，但扣费确认失败，请重试' });
    }

    return res.status(200).json({ success: true, content, cost, balance: Number(debit.balance || 0) });
  } catch (error) {
    const message = /缺少|不支持|不正确|重复|填写/.test(error.message || '') ? error.message : 'AI 服务暂不可用，本次未扣费';
    const status = message === error.message ? 400 : 503;
    console.error('[ai-tarot-reading]', error.message);
    return res.status(status).json({ success: false, charged: false, cost: 0, error: message });
  }
};
