/**
 * 统一历法适配层。
 *
 * 所有农历/公历换算都交给随网站固定部署的 iztro 2.5.8，避免维护一份
 * 容易出错的大小月、闰月表。这里保留原来的全局函数名，兼容旧模块。
 */
(function(root) {
  'use strict';

  var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var TG_WUXING = ['木','木','火','火','土','土','金','金','水','水'];
  var DZ_WUXING = ['水','土','木','木','土','火','火','土','金','金','土','水'];

  function engine() {
    if (!root.iztro || !root.iztro.astro) throw new Error('历法引擎尚未加载，请刷新页面后重试');
    return root.iztro;
  }

  function validSolarDate(year, month, day) {
    if (![year, month, day].every(Number.isInteger)) return false;
    var value = new Date(Date.UTC(year, month - 1, day));
    return value.getUTCFullYear() === year && value.getUTCMonth() + 1 === month && value.getUTCDate() === day;
  }

  function parseSolar(text) {
    var parts = String(text || '').split('-').map(Number);
    if (parts.length !== 3 || !validSolarDate(parts[0], parts[1], parts[2])) throw new Error('历法引擎返回了无效公历日期');
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  function chartBySolar(year, month, day, timeIndex) {
    if (!validSolarDate(year, month, day)) throw new Error('公历日期不存在，请检查年月日');
    return engine().astro.bySolar(year + '-' + month + '-' + day, timeIndex == null ? 6 : timeIndex, '男', true, 'zh-CN');
  }

  function chartByLunar(year, month, day, isLeap, timeIndex) {
    if (![year, month, day].every(Number.isInteger) || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 30) {
      throw new Error('农历日期不存在，请检查年月日');
    }
    var chart;
    try {
      chart = engine().astro.byLunar(year + '-' + month + '-' + day, timeIndex == null ? 6 : timeIndex, '男', !!isLeap, true, 'zh-CN');
    } catch (error) {
      throw new Error('农历日期不存在或该月天数不足');
    }
    var raw = chart && chart.rawDates && chart.rawDates.lunarDate;
    if (!raw || raw.lunarYear !== year || raw.lunarMonth !== month || raw.lunarDay !== day || !!raw.isLeap !== !!isLeap) {
      throw new Error(isLeap ? '该年份没有这个闰月' : '农历日期转换失败');
    }
    return chart;
  }

  function solarToLunar(year, month, day) {
    var chart = chartBySolar(year, month, day, 6);
    var raw = chart.rawDates.lunarDate;
    return { year: raw.lunarYear, month: raw.lunarMonth, day: raw.lunarDay, isLeap: !!raw.isLeap };
  }

  function lunarToSolar(year, month, day, isLeap) {
    return parseSolar(chartByLunar(year, month, day, isLeap, 6).solarDate);
  }

  function getLunarYearData(year) {
    var monthDays = [];
    var leapMonth = 0;
    var leapMonthDays = 0;
    for (var month = 1; month <= 12; month++) {
      try { chartByLunar(year, month, 30, false, 6); monthDays.push(30); }
      catch (error) { chartByLunar(year, month, 29, false, 6); monthDays.push(29); }
      try {
        chartByLunar(year, month, 29, true, 6);
        leapMonth = month;
        try { chartByLunar(year, month, 30, true, 6); leapMonthDays = 30; }
        catch (error) { leapMonthDays = 29; }
      } catch (error) {}
    }
    return { lunarYear: year, monthDays: monthDays, leapMonth: leapMonth, leapMonthDays: leapMonthDays };
  }

  function pillar(value) {
    var gan = TIAN_GAN.indexOf(value[0]);
    var zhi = DI_ZHI.indexOf(value[1]);
    return { ganZhi: value, gan: gan, zhi: zhi };
  }

  function getDayPillar(year, month, day) {
    return pillar(chartBySolar(year, month, day, 6).chineseDate.split(/\s+/)[2]);
  }

  function getHourPillar(dayGan, hourIndex) {
    var first = [0,2,4,6,8][dayGan % 5];
    return { ganZhi: TIAN_GAN[(first + hourIndex) % 10] + DI_ZHI[hourIndex % 12], gan: (first + hourIndex) % 10, zhi: hourIndex % 12 };
  }

  function solarDetails(year, month, day, timeIndex) {
    var chart = chartBySolar(year, month, day, timeIndex == null ? 6 : timeIndex);
    var lunar = chart.rawDates.lunarDate;
    var chinese = chart.rawDates.chineseDate;
    return {
      solar: parseSolar(chart.solarDate),
      lunar: { year: lunar.lunarYear, month: lunar.lunarMonth, day: lunar.lunarDay, isLeap: !!lunar.isLeap },
      lunarText: chart.lunarDate,
      yearPillar: pillar(chinese.yearly.join('')),
      monthPillar: pillar(chinese.monthly.join('')),
      dayPillar: pillar(chinese.daily.join('')),
      hourPillar: pillar(chinese.hourly.join(''))
    };
  }

  function calculateBazi(year, month, day, hour, gender) {
    var chart = chartBySolar(year, month, day, hour);
    var chinese = chart.rawDates.chineseDate;
    var pillars = {
      year: pillar(chinese.yearly.join('')),
      month: pillar(chinese.monthly.join('')),
      day: pillar(chinese.daily.join('')),
      hour: pillar(chinese.hourly.join(''))
    };
    var wuxingCount = {金:0,木:0,水:0,火:0,土:0};
    Object.keys(pillars).forEach(function(key) {
      wuxingCount[TG_WUXING[pillars[key].gan]]++;
      wuxingCount[DZ_WUXING[pillars[key].zhi]]++;
    });
    var lunar = chart.rawDates.lunarDate;
    return {
      pillars: pillars,
      wuxingCount: wuxingCount,
      lunar: {year:lunar.lunarYear,month:lunar.lunarMonth,day:lunar.lunarDay,isLeap:!!lunar.isLeap},
      shengXiao: SHENG_XIAO[pillars.year.zhi],
      yearPillar: pillars.year.ganZhi,
      monthPillar: pillars.month.ganZhi,
      dayPillar: pillars.day.ganZhi,
      hourPillar: pillars.hour.ganZhi,
      gender: gender
    };
  }

  root.DaoCalendar = {
    validSolarDate: validSolarDate,
    solarToLunar: solarToLunar,
    lunarToSolar: lunarToSolar,
    solarDetails: solarDetails,
    chartByLunar: chartByLunar
  };
  root.solarToLunar = solarToLunar;
  root.lunarToSolar = lunarToSolar;
  root.getLunarYearData = getLunarYearData;
  root.getDayPillar = getDayPillar;
  root.getHourPillar = getHourPillar;
  root.calculateBazi = calculateBazi;
})(typeof window !== 'undefined' ? window : globalThis);
