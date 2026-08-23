/**
 * 道问统一历法适配层。
 *
 * 公历/农历换算和四柱基础数据由 lunar-javascript 1.7.7 提供。
 * 对外保留原有 DaoCalendar 与全局函数名称，避免影响八字、黄历等模块。
 */
(function(root) {
  'use strict';

  var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var TG_WUXING = ['木','木','火','火','土','土','金','金','水','水'];
  var DZ_WUXING = ['水','土','木','木','土','火','火','土','金','金','土','水'];

  function engine() {
    if (!root.Solar || !root.Lunar || !root.LunarYear) {
      throw new Error('历法引擎尚未加载，请刷新页面后重试');
    }
    return { Solar: root.Solar, Lunar: root.Lunar, LunarYear: root.LunarYear };
  }

  function integer(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  }

  function validSolarDate(year, month, day) {
    if (![year, month, day].every(integer)) return false;
    var value = new Date(Date.UTC(year, month - 1, day));
    return value.getUTCFullYear() === year && value.getUTCMonth() + 1 === month && value.getUTCDate() === day;
  }

  function createSolar(year, month, day, hour) {
    if (!validSolarDate(year, month, day)) throw new Error('公历日期不存在，请检查年月日');
    try {
      return engine().Solar.fromYmdHms(year, month, day, hour || 0, 0, 0);
    } catch (error) {
      throw new Error('公历日期不存在，请检查年月日');
    }
  }

  function createLunar(year, month, day, isLeap, hour) {
    if (![year, month, day].every(integer) || year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 30) {
      throw new Error('农历日期不存在，请检查年月日');
    }
    var signedMonth = isLeap ? -month : month;
    var lunar;
    try {
      lunar = engine().Lunar.fromYmdHms(year, signedMonth, day, hour || 0, 0, 0);
    } catch (error) {
      throw new Error(isLeap ? '该年份没有这个闰月' : '农历日期不存在或该月天数不足');
    }
    if (lunar.getYear() !== year || lunar.getMonth() !== signedMonth || lunar.getDay() !== day) {
      throw new Error(isLeap ? '该年份没有这个闰月' : '农历日期不存在或该月天数不足');
    }
    return lunar;
  }

  function solarToLunar(year, month, day) {
    var lunar = createSolar(year, month, day, 12).getLunar();
    var lunarMonth = lunar.getMonth();
    return {
      year: lunar.getYear(),
      month: Math.abs(lunarMonth),
      day: lunar.getDay(),
      isLeap: lunarMonth < 0
    };
  }

  function lunarToSolar(year, month, day, isLeap) {
    var solar = createLunar(year, month, day, !!isLeap, 12).getSolar();
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  }

  function getLunarYearData(year) {
    if (!integer(year) || year < 1900 || year > 2100) throw new Error('农历年份超出支持范围');
    var months = engine().LunarYear.fromYear(year).getMonthsInYear();
    var monthDays = new Array(12);
    var leapMonth = 0;
    var leapMonthDays = 0;
    months.forEach(function(item) {
      var month = item.getMonth();
      if (month < 0) {
        leapMonth = Math.abs(month);
        leapMonthDays = item.getDayCount();
      } else if (month >= 1 && month <= 12) {
        monthDays[month - 1] = item.getDayCount();
      }
    });
    return { lunarYear: year, monthDays: monthDays, leapMonth: leapMonth, leapMonthDays: leapMonthDays };
  }

  function pillar(value) {
    value = String(value || '');
    var gan = TIAN_GAN.indexOf(value[0]);
    var zhi = DI_ZHI.indexOf(value[1]);
    if (gan < 0 || zhi < 0) throw new Error('历法引擎返回了无效干支');
    return { ganZhi: value, gan: gan, zhi: zhi };
  }

  function detailsFromSolar(year, month, day, hour, minute, dayBoundary) {
    if (!validSolarDate(year, month, day)) throw new Error('公历日期不存在，请检查年月日');
    hour = integer(hour) ? hour : 0;
    minute = integer(minute) ? minute : 0;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) throw new Error('出生时间不存在，请检查时分');
    var solar;
    try {
      solar = engine().Solar.fromYmdHms(year, month, day, hour, minute, 0);
    } catch (error) {
      throw new Error('公历日期不存在，请检查年月日');
    }
    var lunar = solar.getLunar();
    var eightChar = lunar.getEightChar();
    // sect=1 表示晚子时（23:00）换日；与本站原有排盘口径一致。
    eightChar.setSect(dayBoundary === 'midnight' ? 2 : 1);
    var lunarMonth = lunar.getMonth();
    var hiddenStems = [
      { stems:eightChar.getYearHideGan(), tenGods:eightChar.getYearShiShenZhi() },
      { stems:eightChar.getMonthHideGan(), tenGods:eightChar.getMonthShiShenZhi() },
      { stems:eightChar.getDayHideGan(), tenGods:eightChar.getDayShiShenZhi() },
      { stems:eightChar.getTimeHideGan(), tenGods:eightChar.getTimeShiShenZhi() }
    ];
    return {
      solar: { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() },
      lunar: { year: lunar.getYear(), month: Math.abs(lunarMonth), day: lunar.getDay(), isLeap: lunarMonth < 0 },
      lunarText: lunar.toString(),
      yearPillar: pillar(eightChar.getYear()),
      monthPillar: pillar(eightChar.getMonth()),
      dayPillar: pillar(eightChar.getDay()),
      hourPillar: pillar(eightChar.getTime()),
      yearNaYin: eightChar.getYearNaYin(),
      naYin: [eightChar.getYearNaYin(), eightChar.getMonthNaYin(), eightChar.getDayNaYin(), eightChar.getTimeNaYin()],
      stemTenGods: [eightChar.getYearShiShenGan(), eightChar.getMonthShiShenGan(), '日主', eightChar.getTimeShiShenGan()],
      hiddenStems: hiddenStems,
      diShi: [eightChar.getYearDiShi(), eightChar.getMonthDiShi(), eightChar.getDayDiShi(), eightChar.getTimeDiShi()],
      xunKong: [eightChar.getYearXunKong(), eightChar.getMonthXunKong(), eightChar.getDayXunKong(), eightChar.getTimeXunKong()]
    };
  }

  function yunFromSolar(year, month, day, hour, minute, gender, dayBoundary) {
    var solar = engine().Solar.fromYmdHms(year, month, day, hour, minute || 0, 0);
    var eightChar = solar.getLunar().getEightChar();
    eightChar.setSect(dayBoundary === 'midnight' ? 2 : 1);
    // 起运采用分钟级折算法（sect=2），男=1、女=0。
    var yun = eightChar.getYun(gender === '男' ? 1 : 0, 2);
    var startSolar = yun.getStartSolar();
    var daYun = yun.getDaYun(9).slice(1).map(function(item) {
      var ganZhi = item.getGanZhi();
      return {
        ganZhi: ganZhi,
        gan: ganZhi.charAt(0),
        zhi: ganZhi.charAt(1),
        startAge: item.getStartAge(),
        endAge: item.getEndAge(),
        startYear: item.getStartYear(),
        endYear: item.getEndYear(),
        xunKong: item.getXunKong(),
        years: item.getLiuNian(10).map(function(yearItem) {
          return {year:yearItem.getYear(), age:yearItem.getAge(), ganZhi:yearItem.getGanZhi(), xunKong:yearItem.getXunKong()};
        })
      };
    });
    return {
      forward: yun.isForward(),
      start: {year:yun.getStartYear(), month:yun.getStartMonth(), day:yun.getStartDay(), hour:yun.getStartHour()},
      startSolar: {year:startSolar.getYear(), month:startSolar.getMonth(), day:startSolar.getDay(), hour:startSolar.getHour(), minute:startSolar.getMinute()},
      daYun: daYun
    };
  }

  function timeIndexToHour(timeIndex) {
    if (!integer(timeIndex) || timeIndex < 0 || timeIndex > 12) return 12;
    if (timeIndex === 0) return 0;
    if (timeIndex === 12) return 23;
    return timeIndex * 2;
  }

  function jieQiDates(year) {
    var names = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
    var tables = [
      engine().Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getJieQiTable(),
      engine().Solar.fromYmdHms(year + 1, 1, 15, 12, 0, 0).getLunar().getJieQiTable()
    ];
    return names.map(function(name, index) {
      var expectedYear = index === 11 ? year + 1 : year;
      var value = null;
      tables.some(function(table) {
        var candidate = table[name];
        if (candidate && candidate.getYear() === expectedYear) {
          value = candidate;
          return true;
        }
        return false;
      });
      if (!value) return null;
      return {
        name: name,
        year: value.getYear(),
        month: value.getMonth(),
        day: value.getDay(),
        hour: value.getHour(),
        minute: value.getMinute()
      };
    }).filter(Boolean);
  }

  function solarDetails(year, month, day, timeIndex) {
    return detailsFromSolar(year, month, day, timeIndexToHour(timeIndex));
  }

  function getDayPillar(year, month, day) {
    return detailsFromSolar(year, month, day, 12).dayPillar;
  }

  function getHourPillar(dayGan, hourIndex) {
    var first = [0,2,4,6,8][dayGan % 5];
    return {
      ganZhi: TIAN_GAN[(first + hourIndex) % 10] + DI_ZHI[hourIndex % 12],
      gan: (first + hourIndex) % 10,
      zhi: hourIndex % 12
    };
  }

  function calculateBazi(year, month, day, hour, gender) {
    var details = detailsFromSolar(year, month, day, hour, 0, 'late-zi');
    var pillars = {
      year: details.yearPillar,
      month: details.monthPillar,
      day: details.dayPillar,
      hour: details.hourPillar
    };
    var wuxingCount = {金:0,木:0,水:0,火:0,土:0};
    Object.keys(pillars).forEach(function(key) {
      wuxingCount[TG_WUXING[pillars[key].gan]]++;
      wuxingCount[DZ_WUXING[pillars[key].zhi]]++;
    });
    return {
      pillars: pillars,
      wuxingCount: wuxingCount,
      lunar: details.lunar,
      shengXiao: SHENG_XIAO[pillars.year.zhi],
      yearPillar: pillars.year.ganZhi,
      monthPillar: pillars.month.ganZhi,
      dayPillar: pillars.day.ganZhi,
      hourPillar: pillars.hour.ganZhi,
      gender: gender
    };
  }

  root.DaoCalendar = {
    engine: { name: 'lunar-javascript', version: '1.7.7' },
    validSolarDate: validSolarDate,
    solarToLunar: solarToLunar,
    lunarToSolar: lunarToSolar,
    baziDetails: detailsFromSolar,
    baziYun: yunFromSolar,
    jieQiDates: jieQiDates,
    solarDetails: solarDetails
  };
  root.solarToLunar = solarToLunar;
  root.lunarToSolar = lunarToSolar;
  root.getLunarYearData = getLunarYearData;
  root.getDayPillar = getDayPillar;
  root.getHourPillar = getHourPillar;
  root.calculateBazi = calculateBazi;
})(typeof window !== 'undefined' ? window : globalThis);
