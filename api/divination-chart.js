const { noStore, readJson, serviceRpc, randomRequestId } = require('./_lib');
const { requireUser } = require('./_auth');

const SYSTEMS = Object.freeze({
  qimen: { reason: 'qimen-chart', label: '奇门遁甲' },
  fengshui: { reason: 'fengshui-chart', label: '玄空风水' },
  astrology: { reason: 'astro-chart', label: '独立星盘' },
  taiyi: { reason: 'taiyi-chart', label: '太乙神数' }
});

let enginePromise;

function loadEngines() {
  if (!enginePromise) {
    enginePromise = Promise.all([
      import('mingyu-core/divination/qimen'),
      import('mingyu-core/xuankong'),
      import('mingyu-core/divination/astrolabe'),
      import('mingyu-core/taiyi')
    ]).then(([qimen, xuankong, astrolabe, taiyi]) => ({ qimen, xuankong, astrolabe, taiyi }));
  }
  return enginePromise;
}

function finiteNumber(value, name, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(name + '超出允许范围');
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function parseDate(input, defaultTimezone = 8) {
  const date = String(input.date || '');
  const time = String(input.time || '12:00');
  const timezone = finiteNumber(input.timezone == null ? defaultTimezone : input.timezone, '时区', -12, 14);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    const error = new Error('日期或时间格式不正确');
    error.statusCode = 400;
    throw error;
  }
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    const error = new Error('日期不存在');
    error.statusCode = 400;
    throw error;
  }
  const sign = timezone >= 0 ? '+' : '-';
  const absolute = Math.abs(timezone);
  const hours = String(Math.floor(absolute)).padStart(2, '0');
  const minutes = String(Math.round((absolute - Math.floor(absolute)) * 60)).padStart(2, '0');
  const value = new Date(date + 'T' + time + ':00' + sign + hours + ':' + minutes);
  if (!Number.isFinite(value.getTime())) {
    const error = new Error('日期不存在');
    error.statusCode = 400;
    throw error;
  }
  return { value, date, time, timezone };
}

function annualCenter(year) {
  let root = String(year).split('').reduce((sum, number) => sum + Number(number), 0);
  while (root > 9) root = String(root).split('').reduce((sum, number) => sum + Number(number), 0);
  let star = 11 - root;
  while (star <= 0) star += 9;
  while (star > 9) star -= 9;
  return star;
}

async function generateChart(system, input) {
  const engines = await loadEngines();

  if (system === 'qimen') {
    const parsed = parseDate(input, 8);
    return engines.qimen.generateQimen(parsed.value, 'zhuanpan', 'hour', 'chaibu');
  }

  if (system === 'fengshui') {
    const year = Math.trunc(finiteNumber(input.buildYear, '建成或大修年份', 1864, 2100));
    const facingDegree = finiteNumber(input.facingDegree, '房屋朝向', 0, 359.999);
    const analysisYear = Math.trunc(finiteNumber(input.analysisYear, '分析年份', 1900, 2100));
    const chart = engines.xuankong.generateXuanKong({ year, facingDegree });
    const center = annualCenter(analysisYear);
    return Object.assign({}, chart, {
      analysisYear,
      annualCenter: center,
      annualPlate: engines.xuankong.flyStars(center, '顺飞')
    });
  }

  if (system === 'astrology') {
    const parsed = parseDate(input, 8);
    const latitude = finiteNumber(input.latitude, '纬度', -66, 66);
    const longitude = finiteNumber(input.longitude, '经度', -180, 180);
    return engines.astrolabe.generateAstrolabe({
      name: String(input.name || '命主').slice(0, 30),
      gender: input.gender === '女' ? '女' : '男',
      year: parsed.date.slice(0, 4),
      month: String(Number(parsed.date.slice(5, 7))),
      day: String(Number(parsed.date.slice(8, 10))),
      hour: parsed.time.slice(0, 2),
      minute: parsed.time.slice(3, 5),
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: String(parsed.timezone),
      locationName: String(input.locationName || '自定义坐标').slice(0, 60)
    });
  }

  if (system === 'taiyi') {
    const parsed = parseDate(input, 8);
    const scopes = ['year', 'month', 'day', 'hour'];
    const scope = scopes.includes(input.scope) ? input.scope : 'hour';
    return engines.taiyi.generateTaiyi({ date: parsed.value, scope });
  }

  const error = new Error('不支持的排盘类型');
  error.statusCode = 400;
  throw error;
}

async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await requireUser(req, res);
    const body = await readJson(req);
    const system = String(body.system || '');
    const config = SYSTEMS[system];
    if (!config) return res.status(400).json({ success: false, error: '不支持的排盘类型' });

    // 先完成输入校验和确定性排盘，避免算法错误时误扣次数；结果仅在扣费成功后返回。
    const chart = await generateChart(system, body.input || {});
    const requestId = String(body.requestId || randomRequestId(config.reason)).slice(0, 120);
    const debit = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_reason: config.reason,
      p_request_id: requestId
    });

    if (!debit || debit.success !== true) {
      const status = debit && debit.code === 'INSUFFICIENT' ? 402 : 400;
      return res.status(status).json({
        success: false,
        error: (debit && debit.msg) || '扣减失败',
        code: debit && debit.code,
        balance: debit && Number(debit.balance || 0)
      });
    }

    return res.status(200).json({
      success: true,
      system,
      engine: { name: 'mingyu-core', version: '0.1.32', license: 'MIT' },
      balance: Number(debit.balance || 0),
      chart
    });
  } catch (error) {
    const status = Number(error && error.statusCode) || 500;
    console.error('[divination-chart]', error && error.message);
    return res.status(status).json({ success: false, error: status >= 500 ? '排盘服务暂不可用' : error.message });
  }
}

handler._test = { generateChart, parseDate, annualCenter, loadEngines };
module.exports = handler;
