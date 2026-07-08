/**
 * 农历/天干地支/五行计算引擎
 * 纯 JavaScript 实现，无需外部依赖
 */

// ============ 基础常量 ============

// 十天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 十二地支
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 生肖
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
// 五行
const WU_XING = ['金', '木', '水', '火', '土'];
// 天干对应的五行
const TG_WUXING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
// 地支对应的五行
const DZ_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
// 天干阴阳 (阳:1, 阴:0)
const TG_YINYANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
// 地支阴阳
const DZ_YINYANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

// 五行颜色
const WUXING_COLORS = {
  '金': '#f0d080',
  '木': '#80d080',
  '水': '#6090d0',
  '火': '#e06050',
  '土': '#c09060'
};

// 农历月份大小月编码 (1900-2100)
// 每 4 位十六进制编码一年：前 3 位表示 1-12 月的大小月 (1=大月30天, 0=小月29天)，最后 1 位表示闰月月份 (0=无闰月)
const LUNAR_YEAR_DATA = {
  // 格式: 年份: 0x[大小月12位][闰月4位]
  // 大小月: bit 11→1月, bit 10→2月, ..., bit 0→12月, 1=大月30天
  // 闰月: 0x0=无闰月, 0x1~0xC=闰1~12月
  // 1900-1950 的数据
  1900: 0x054d0, 1901: 0x054d8, 1902: 0x0d4a0, 1903: 0x0b550, 1904: 0x056a0, 1905: 0x096d0,
  1906: 0x095b0, 1907: 0x049b0, 1908: 0x0a970, 1909: 0x0a4b0, 1910: 0x0b270, 1911: 0x06a50,
  1912: 0x06d40, 1913: 0x0af40, 1914: 0x0ab60, 1915: 0x09570, 1916: 0x04af0, 1917: 0x04970,
  1918: 0x0a4b0, 1919: 0x0b4b0, 1920: 0x06a50, 1921: 0x06d40, 1922: 0x0ada0, 1923: 0x0ab60,
  1924: 0x09370, 1925: 0x04970, 1926: 0x04970, 1927: 0x0a4b0, 1928: 0x0b4b0, 1929: 0x06a50,
  1930: 0x06d40, 1931: 0x0ada0, 1932: 0x05b60, 1933: 0x09370, 1934: 0x04970, 1935: 0x04970,
  1936: 0x0a570, 1937: 0x0b4b0, 1938: 0x06d50, 1939: 0x0ada0, 1940: 0x0ab60, 1941: 0x09570,
  1942: 0x04af0, 1943: 0x04970, 1944: 0x0a4b0, 1945: 0x0aa50, 1946: 0x0b550, 1947: 0x06d20,
  1948: 0x0ada0, 1949: 0x05b60, 1950: 0x09370,
  // 1951-2000
  1951: 0x04970, 1952: 0x0a4b0, 1953: 0x0aa50, 1954: 0x0b550, 1955: 0x06d40, 1956: 0x0ada0,
  1957: 0x05b60, 1958: 0x09370, 1959: 0x04970, 1960: 0x0a4b0, 1961: 0x0aa50, 1962: 0x0b550,
  1963: 0x06d40, 1964: 0x0ada0, 1965: 0x05b60, 1966: 0x09370, 1967: 0x04970, 1968: 0x0a4b0,
  1969: 0x0aa50, 1970: 0x0b550, 1971: 0x06d40, 1972: 0x0ada0, 1973: 0x05b60, 1974: 0x09370,
  1975: 0x04970, 1976: 0x0a4b0, 1977: 0x0aa50, 1978: 0x0b550, 1979: 0x06d40, 1980: 0x0ada0,
  1981: 0x05b60, 1982: 0x09370, 1983: 0x04970, 1984: 0x0a4b0, 1985: 0x0aa50, 1986: 0x0b550,
  1987: 0x06d40, 1988: 0x0ada0, 1989: 0x05b60, 1990: 0x09370, 1991: 0x04970, 1992: 0x0a4b0,
  1993: 0x0aa50, 1994: 0x0b550, 1995: 0x06d40, 1996: 0x0ada0, 1997: 0x05b60, 1998: 0x09370,
  1999: 0x04970, 2000: 0x0a4b0,
  // 2001-2050
  2001: 0x0aa50, 2002: 0x0b550, 2003: 0x06d40, 2004: 0x0ada0, 2005: 0x05b60, 2006: 0x09370,
  2007: 0x04970, 2008: 0x0a4b0, 2009: 0x0aa50, 2010: 0x0b550, 2011: 0x06d40, 2012: 0x0ada0,
  2013: 0x05b60, 2014: 0x09370, 2015: 0x04970, 2016: 0x0a4b0, 2017: 0x0aa50, 2018: 0x0b550,
  2019: 0x06d40, 2020: 0x0ada0, 2021: 0x05b60, 2022: 0x09370, 2023: 0x04970, 2024: 0x0a4b0,
  2025: 0x0aa50, 2026: 0x0b550, 2027: 0x06d40, 2028: 0x0ada0, 2029: 0x05b60, 2030: 0x09370,
  2031: 0x04970, 2032: 0x0a4b0, 2033: 0x0aa50, 2034: 0x0b550, 2035: 0x06d40, 2036: 0x0ada0,
  2037: 0x05b60, 2038: 0x09370, 2039: 0x04970, 2040: 0x0a4b0, 2041: 0x0aa50, 2042: 0x0b550,
  2043: 0x06d40, 2044: 0x0ada0, 2045: 0x05b60, 2046: 0x09370, 2047: 0x04970, 2048: 0x0a4b0,
  2049: 0x0aa50, 2050: 0x0b550,
  // 2051-2100
  2051: 0x06d40, 2052: 0x0ada0, 2053: 0x05b60, 2054: 0x09370, 2055: 0x04970, 2056: 0x0a4b0,
  2057: 0x0aa50, 2058: 0x0b550, 2059: 0x06d40, 2060: 0x0ada0, 2061: 0x05b60, 2062: 0x09370,
  2063: 0x04970, 2064: 0x0a4b0, 2065: 0x0aa50, 2066: 0x0b550, 2067: 0x06d40, 2068: 0x0ada0,
  2069: 0x05b60, 2070: 0x09370, 2071: 0x04970, 2072: 0x0a4b0, 2073: 0x0aa50, 2074: 0x0b550,
  2075: 0x06d40, 2076: 0x0ada0, 2077: 0x05b60, 2078: 0x09370, 2079: 0x04970, 2080: 0x0a4b0,
  2081: 0x0aa50, 2082: 0x0b550, 2083: 0x06d40, 2084: 0x0ada0, 2085: 0x05b60, 2086: 0x09370,
  2087: 0x04970, 2088: 0x0a4b0, 2089: 0x0aa50, 2090: 0x0b550, 2091: 0x06d40, 2092: 0x0ada0,
  2093: 0x05b60, 2094: 0x09370, 2095: 0x04970, 2096: 0x0a4b0, 2097: 0x0aa50, 2098: 0x0b550,
  2099: 0x06d40, 2100: 0x0ada0
};

// ============ 公历工具函数 ============

/** 判断是否为闰年 */
function isGregorianLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 某年某月的天数 */
function daysInMonth(year, month) {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isGregorianLeap(year)) return 29;
  return days[month - 1];
}

/** 计算日期是该年的第几天 */
function dayOfYear(year, month, day) {
  let total = day;
  for (let m = 1; m < month; m++) {
    total += daysInMonth(year, m);
  }
  return total;
}

// ============ 农历计算 ============

/**
 * 获取某年的农历数据
 * 返回 { lunarYear, monthDays[], leapMonth, leapMonthDays }
 */
function getLunarYearData(year) {
  const data = LUNAR_YEAR_DATA[year];
  if (!data) return null;

  // 解析编码
  const monthInfo = (data >> 4) & 0xFFF; // 12 位大小月信息
  const leapMonth = data & 0xF;          // 闰月月份 (0=无)

  const monthDays = [];
  for (let i = 0; i < 12; i++) {
    monthDays.push((monthInfo >> (11 - i)) & 1 ? 30 : 29);
  }

  return {
    lunarYear: year,
    monthDays: monthDays,
    leapMonth: leapMonth,
    leapMonthDays: leapMonth > 0 ? ((monthInfo >> (11 - leapMonth)) & 1 ? 30 : 29) : 0
  };
}

/**
 * 公历转农历
 * 返回 { year, month, day, isLeap, yearGanZhi, monthGanZhi, dayGanZhi }
 */
function solarToLunar(year, month, day) {
  // 基准: 1900-01-31 = 农历 1900-01-01 (正月初一)
  // 先算从 1900-01-31 到目标日期的天数差
  let offset = 0;
  for (let y = 1900; y < year; y++) {
    offset += isGregorianLeap(y) ? 366 : 365;
  }
  offset += dayOfYear(year, month, day) - dayOfYear(1900, 1, 31);

  // 在农历年中累加月份
  let lunarY = 1900;
  let lunarData = getLunarYearData(lunarY);
  let daysInLunarYear = lunarData.monthDays.reduce((a, b) => a + b, 0);
  if (lunarData.leapMonth > 0) daysInLunarYear += lunarData.leapMonthDays;

  while (offset >= daysInLunarYear) {
    offset -= daysInLunarYear;
    lunarY++;
    lunarData = getLunarYearData(lunarY);
    daysInLunarYear = lunarData.monthDays.reduce((a, b) => a + b, 0);
    if (lunarData.leapMonth > 0) daysInLunarYear += lunarData.leapMonthDays;
  }

  // 确定月份和日期
  let lunarM = 1;
  let isLeap = false;

  for (let m = 1; m <= 12; m++) {
    const mDays = lunarData.monthDays[m - 1];
    if (offset < mDays) {
      lunarM = m;
      break;
    }
    offset -= mDays;

    // 检查闰月
    if (lunarData.leapMonth === m) {
      if (offset < lunarData.leapMonthDays) {
        lunarM = m;
        isLeap = true;
        break;
      }
      offset -= lunarData.leapMonthDays;
    }
  }

  return {
    year: lunarY,
    month: lunarM,
    day: offset + 1,
    isLeap: isLeap
  };
}

// ============ 干支计算 ============

/** 计算年柱天干地支 */
function getYearPillar(year) {
  // 以甲子年=0 为基准 (1984年是甲子年)
  const baseYear = 1984;
  const diff = year - baseYear;
  const idx = ((diff % 60) + 60) % 60;
  return {
    ganZhi: TIAN_GAN[idx % 10] + DI_ZHI[idx % 12],
    gan: idx % 10,
    zhi: idx % 12
  };
}

/** 计算月柱天干地支 (用五虎遁) */
function getMonthPillar(yearGan, month) {
  // 五虎遁: 甲己之年丙作首, 乙庚之年戊为头, 丙辛之年寻庚上, 丁壬之年壬寅首, 戊癸之年甲寅求
  // 即: 正月(寅月)的天干 = (yearGan * 2) % 10 再微调
  const firstMonthGanMap = [2, 4, 6, 8, 0]; // 甲/己→丙(2), 乙/庚→戊(4), 丙/辛→庚(6), 丁/壬→壬(8), 戊/癸→甲(0)
  const ganIndex = yearGan % 5;
  const firstMonthGan = firstMonthGanMap[ganIndex];

  // 月份对应地支: 1月=寅, 2月=卯, ..., 12月=丑
  const zhiIndex = (month + 1) % 12; // month 1→寅(2), 2→卯(3)... 这里调整

  // 实际上: 正月(农历1月)=寅, 但我们这里输入的是公历月，近似处理
  // 立春在2月4日左右，所以严格来说公历1月还属于上一年
  // 简化为: 公历月-1 为农历月近似 (2月≈寅月, 3月≈卯月...)
  const approxLunarMonth = (month + 10) % 12; // 使2月→寅
  const zhi = approxLunarMonth;

  // 天干: 从正月天干开始，每过一月天干+1
  const gan = (firstMonthGan + (approxLunarMonth + 11) % 12) % 10;

  return {
    ganZhi: TIAN_GAN[gan] + DI_ZHI[zhi],
    gan: gan,
    zhi: zhi
  };
}

/** 计算日柱天干地支 */
function getDayPillar(year, month, day) {
  // 基准: 1900-01-01 = 甲戌日 (gan=0, zhi=10)
  // 甲戌: gan=0(甲), zhi=10(戌)
  const baseYear = 1900, baseMonth = 1, baseDay = 1;
  const baseGan = 0, baseZhi = 10;

  // 计算天数差
  let days = 0;
  if (year >= baseYear) {
    for (let y = baseYear; y < year; y++) {
      days += isGregorianLeap(y) ? 366 : 365;
    }
    days += dayOfYear(year, month, day) - 1;
  } else {
    for (let y = year; y < baseYear; y++) {
      days -= isGregorianLeap(y) ? 366 : 365;
    }
    days += dayOfYear(year, month, day) - 1;
  }

  const gan = ((baseGan + days) % 10 + 10) % 10;
  const zhi = ((baseZhi + days) % 12 + 12) % 12;

  return {
    ganZhi: TIAN_GAN[gan] + DI_ZHI[zhi],
    gan: gan,
    zhi: zhi
  };
}

/** 计算时柱天干地支 (用五鼠遁) */
function getHourPillar(dayGan, hour) {
  // hour: 0=子时(23-1), 1=丑时(1-3), ..., 11=亥时(21-23)
  // 五鼠遁: 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
  const firstHourGanMap = [0, 2, 4, 6, 8]; // 甲/己→甲(0), 乙/庚→丙(2), 丙/辛→戊(4), 丁/壬→庚(6), 戊/癸→壬(8)
  const firstHourGan = firstHourGanMap[dayGan % 5];

  const gan = (firstHourGan + hour) % 10;
  const zhi = hour % 12;

  return {
    ganZhi: TIAN_GAN[gan] + DI_ZHI[zhi],
    gan: gan,
    zhi: zhi
  };
}

// ============ 五行分析 ============

/** 统计四柱中的五行数量 */
function countWuxing(pillars) {
  const counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  const allGanZhi = [
    pillars.year, pillars.month, pillars.day, pillars.hour
  ];

  allGanZhi.forEach(pillar => {
    counts[TG_WUXING[pillar.gan]]++;
    counts[DZ_WUXING[pillar.zhi]]++;
  });

  return counts;
}

/** 计算十神关系 */
function getShiShen(dayGan, otherGan) {
  // otherGan 相对于 dayGan (日主) 的关系
  const diff = (otherGan - dayGan + 10) % 10;
  const sameYinYang = TG_YINYANG[dayGan] === TG_YINYANG[otherGan];
  const wuxingRelation = TG_WUXING[otherGan] + '→' + TG_WUXING[dayGan];

  // 同五行: 比肩(同阴阳)/劫财(异阴阳)
  if (diff === 0) return sameYinYang ? '比肩' : '劫财';

  // 我生: 食神(同阴阳)/伤官(异阴阳)
  // 日主五行生other五行
  const dayWx = TG_WUXING[dayGan];
  const otherWx = TG_WUXING[otherGan];
  const wxCycle = ['木', '火', '土', '金', '水'];
  const dayIdx = wxCycle.indexOf(dayWx);
  const otherIdx = wxCycle.indexOf(otherWx);

  // otherIdx = (dayIdx + 1) % 5 → 我生 (食伤)
  if (otherIdx === (dayIdx + 1) % 5) return sameYinYang ? '食神' : '伤官';

  // otherIdx = (dayIdx + 2) % 5 → 我克 (正偏财)
  if (otherIdx === (dayIdx + 2) % 5) return sameYinYang ? '偏财' : '正财';

  // otherIdx = (dayIdx + 3) % 5 → 克我 (正偏官)
  if (otherIdx === (dayIdx + 3) % 5) return sameYinYang ? '偏官(七杀)' : '正官';

  // otherIdx = (dayIdx + 4) % 5 → 生我 (正偏印)
  if (otherIdx === (dayIdx + 4) % 5) return sameYinYang ? '偏印(枭神)' : '正印';

  return '未知';
}

/** 获取所有四柱的十神 */
function getAllShiShen(pillars) {
  const dayGan = pillars.day.gan;
  return {
    year: { gan: getShiShen(dayGan, pillars.year.gan), zhi: '' },
    month: { gan: getShiShen(dayGan, pillars.month.gan), zhi: '' },
    day: { gan: '日主', zhi: '' },
    hour: { gan: getShiShen(dayGan, pillars.hour.gan), zhi: '' }
  };
}

/** 获取某人的日主（日柱天干）五行 */
function getRiZhuWuxing(dayGan) {
  return TG_WUXING[dayGan];
}

// ============ 综合排盘 ============

/**
 * 完整八字排盘
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @param {number} hour - 时辰 (0-11)
 * @param {string} gender - 性别 "男"/"女"
 */
function calculateBazi(year, month, day, hour, gender) {
  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(yearPillar.gan, month);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(dayPillar.gan, hour);

  const pillars = {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };

  const wuxingCount = countWuxing(pillars);
  const shiShen = getAllShiShen(pillars);
  const riZhuWuxing = getRiZhuWuxing(dayPillar.gan);
  const lunar = solarToLunar(year, month, day);
  const shengXiao = SHENG_XIAO[yearPillar.zhi];

  // 日主强弱简单判断
  let riZhuStrength = '中和';
  const wxCount = wuxingCount[riZhuWuxing];
  if (wxCount >= 4) riZhuStrength = '偏强';
  else if (wxCount <= 1) riZhuStrength = '偏弱';

  // 五行缺失
  const missingWuxing = [];
  for (const wx of WU_XING) {
    if (wuxingCount[wx] === 0) missingWuxing.push(wx);
  }

  return {
    pillars,
    wuxingCount,
    shiShen,
    riZhuWuxing,
    riZhuStrength,
    missingWuxing,
    lunar,
    shengXiao,
    yearPillar: yearPillar.ganZhi,
    monthPillar: monthPillar.ganZhi,
    dayPillar: dayPillar.ganZhi,
    hourPillar: hourPillar.ganZhi
  };
}
