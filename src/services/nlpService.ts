import * as chrono from 'chrono-node';
import nlp from 'compromise';

interface ParsedResult {
  date: Date | null;
  content: string;
}

/**
 * 日志记录对象
 */
const logger = {
  debug: function(message: string) {
    console.log(message);
  },
  error: function(message: string) {
    console.error(message);
  },
  warn: function(message: string) {
    console.warn(message);
  },
  info: function(message: string) {
    console.info(message);
  }
};

/**
 * 检测文本语言
 * @param text 输入文本
 * @returns 语言代码
 */
export function detectLanguage(text: string): string {
  if (!text || typeof text !== 'string') return 'en';
  
  // 中文检测
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'zh';
  }
  
  // 日文检测
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'ja';
  }
  
  // 韩文检测
  if (/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text)) {
    return 'ko';
  }
  
  // 默认英文
  return 'en';
}

/**
 * 时间正则表达式模式
 */
interface TimePattern {
  standard: RegExp;
  am: RegExp;
  pm: RegExp;
  today: RegExp;
  tomorrow: RegExp;
  dayAfterTomorrow: RegExp;
  nextWeek?: RegExp;
  weekday?: RegExp;
  monthName?: RegExp;
  dateFormat?: RegExp;
  numericDate?: RegExp;
  weekend?: RegExp;
  workday?: RegExp;
  otherRelative?: RegExp;
  holiday?: RegExp;
  complexExpression?: RegExp;
  nextNextWeek?: RegExp;
  monthDate?: RegExp;
  timeWords?: Record<string, number>;
}

const timePatterns: {[key: string]: TimePattern} = {
  // 英文时间模式
  en: {
    // 标准时间格式 (1:30pm, 13:30, 1.30, half past 1, quarter to 2)
    standard: /\b([0-9]{1,2})\s*(?::|：|\.)?\s*([0-9]{0,2})?\s*([aApP][mM])?\b|\b(?:half\s+past|half\s+after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+(?:past|after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+to\s+([0-9]{1,2})\b/,
    // 上午/下午标记
    am: /\b[aA][mM]\b|\bmorning\b|\bdawn\b|\bearly\b/,
    pm: /\b[pP][mM]\b|\bafternoon\b|\bevening\b|\bnight\b|\bnoon\b|\bmidday\b|\blate\b/,
    // 相对日期
    today: /\btoday\b|\bthis\s+day\b|\bcurrent\s+day\b/,
    tomorrow: /\btomorrow\b|\bnext\s+day\b|\bday\s+after\b/,
    dayAfterTomorrow: /\bday\s+after\s+tomorrow\b|\bin\s+two\s+days\b|\btwo\s+days\s+(?:from\s+)?(?:now|today)\b/,
    // 下周表达式
    nextWeek: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    // 周末/工作日表达式
    weekend: /\b(?:this\s+)?weekend\b|\bsat(?:urday)?\s+(?:and|&|or)\s+sun(?:day)?\b/i,
    workday: /\bwork(?:ing)?\s+day\b|\bweek\s+day\b/i,
    // 星期几
    weekday: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun)\b/i,
    // 月份名称
    monthName: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    // 日期格式 (April 4th, 4th of April, April 4, 4 April)
    dateFormat: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    // 数字日期格式 (MM/DD, MM-DD)
    numericDate: /\b(\d{1,2})(\/|-|\.)(\d{1,2})(?:(\/|-|\.)(\d{2,4}))?\b/,
    // 其他相对表达
    otherRelative: /\b(?:in|after)\s+(\d+)\s+(day|week|month|year)s?\b|\b(\d+)\s+(day|week|month|year)s?\s+(?:from\s+)?(?:now|today)\b/i,
  },
  // 中文时间模式
  zh: {
    // 标准时间格式 (1点30分, 13:30, 1点半, 1点1刻)
    standard: /([上下]午|早上|晚上|傍晚|凌晨|中午)?[ ]?([\d一二三四五六七八九十两]+)[点點时時](?:([\d一二三四五六七八九十两半刻]+)[分]?)?|(\d{1,2})[:：](\d{1,2})/,
    // 上午/下午标记
    am: /上午|早上|早晨|凌晨|清晨|一早/,
    pm: /下午|晚上|傍晚|夜晚|黄昏|夜间|晚间|午后|中午|正午/,
    // 相对日期
    today: /今天|今日|本日|现在|此刻|当前/,
    tomorrow: /明天|明日|次日|翌日/,
    dayAfterTomorrow: /后天|後天|隔天|隔日|大后天|大後天/,
    // 星期几
    weekday: /(周|星期|礼拜|禮拜|週)[一二三四五六日天]|[一二三四五六日天](?=(?:\s+|$))/,
    // 下周表达式
    nextWeek: /下[周週]\s*[一二三四五六日天]/,
    // 周末/工作日表达式
    weekend: /周末|週末|礼拜六日|禮拜六日|星期六日|星期六和星期日|星期六与星期日|周六和周日|周六与周日/,
    workday: /工作日|平日|上班日|非周末|非週末/,
    // 日期格式 (如: 5月3日, 2023年10月1日)
    dateFormat: /(\d{2,4}年)?(\d{1,2}月)(\d{1,2})(日|号)|(\d{1,2})\/(\d{1,2})|(\d{1,2})-(\d{1,2})/,
    // 其他相对表达
    otherRelative: /(\d+)[天日周週月年](?:后|後|之后|之後|以后|以後)|[过過](\d+)[天日周週月年]|(?:下|下个|下個|下一|今|本|这|這)(?:周|週|星期|月|礼拜|禮拜|年)|(?:上|上个|上個|上一|前|前个|前個)(?:周|週|星期|月|礼拜|禮拜|年)|(\d+)个?(?:月|周|星期|週|礼拜|禮拜|小时|小時)(?:后|後|之后|之後|以后|以後)/,
    // 增加复合表达式的识别能力
    complexExpression: /下[个個]?月(\d{1,2})(?:号|號|日)|下下[个個]?(?:周|週|星期)|(\d+)个?月(?:后|後|以后|以後)(?:[周週星期][一二三四五六日天])?/,
    // 更全面的中文时段表示
    timeWords: {
      '早上': 8, '早晨': 8, '凌晨': 5, '上午': 10, 
      '中午': 12, '午饭': 12, '午餐': 12, '正午': 12,
      '下午': 15, '午后': 15, 
      '傍晚': 18, '黄昏': 18, '薄暮': 18, '黄昏时分': 18,
      '晚上': 20, '夜晚': 21, '晚间': 20, '夜里': 21, '夜间': 21,
      '深夜': 23, '半夜': 0, '夜深': 23, '夜深人静': 0
    }
  },
  // 日文时间模式
  ja: {
    // 标准时间格式 (1:30pm, 13:30, 1.30, half past 1, quarter to 2)
    standard: /\b([0-9]{1,2})\s*(?::|：|\.)?\s*([0-9]{0,2})?\s*([aApP][mM])?\b|\b(?:half\s+past|half\s+after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+(?:past|after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+to\s+([0-9]{1,2})\b/,
    // 上午/下午标记
    am: /\b[aA][mM]\b|\bmorning\b|\bdawn\b|\bearly\b/,
    pm: /\b[pP][mM]\b|\bafternoon\b|\bevening\b|\bnight\b|\bnoon\b|\bmidday\b|\blate\b/,
    // 相对日期
    today: /\btoday\b|\bthis\s+day\b|\bcurrent\s+day\b/,
    tomorrow: /\btomorrow\b|\bnext\s+day\b|\bday\s+after\b/,
    dayAfterTomorrow: /\bday\s+after\s+tomorrow\b|\bin\s+two\s+days\b|\btwo\s+days\s+(?:from\s+)?(?:now|today)\b/,
    // 下周表达式
    nextWeek: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    // 周末/工作日表达式
    weekend: /\b(?:this\s+)?weekend\b|\bsat(?:urday)?\s+(?:and|&|or)\s+sun(?:day)?\b/i,
    workday: /\bwork(?:ing)?\s+day\b|\bweek\s+day\b/i,
    // 星期几
    weekday: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun)\b/i,
    // 月份名称
    monthName: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    // 日期格式 (April 4th, 4th of April, April 4, 4 April)
    dateFormat: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i,
    // 数字日期格式 (MM/DD, MM-DD)
    numericDate: /\b(\d{1,2})(\/|-|\.)(\d{1,2})(?:(\/|-|\.)(\d{2,4}))?\b/,
    // 其他相对表达
    otherRelative: /\b(?:in|after)\s+(\d+)\s+(day|week|month|year)s?\b|\b(\d+)\s+(day|week|month|year)s?\s+(?:from\s+)?(?:now|today)\b/i,
  },
  // 韩文时间模式
  ko: {
    // 标准时间格式 (1:30pm, 13:30, 1.30, half past 1, quarter to 2)
    standard: /\b([0-9]{1,2})\s*(?::|：|\.)?\s*([0-9]{0,2})?\s*([aApP][mM])?\b|\b(?:half\s+past|half\s+after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+(?:past|after)\s+([0-9]{1,2})\b|\b(?:quarter|15\s+minutes)\s+to\s+([0-9]{1,2})\b/,
    // 上午/下午标记
    am: /\b[aA][mM]\b|\bmorning\b|\bdawn\b|\bearly\b/,
    pm: /\b[pP][mM]\b|\bafternoon\b|\bevening\b|\bnight\b|\bnoon\b|\bmidday\b|\blate\b/,
    // 相对日期
    today: /\btoday\b|\bthis\s+day\b|\bcurrent\s+day\b/,
    tomorrow: /\btomorrow\b|\bnext\s+day\b|\bday\s+after\b/,
    dayAfterTomorrow: /\bday\s+after\s+tomorrow\b|\bin\s+two\s+days\b|\btwo\s+days\s+(?:from\s+)?(?:now|today)\b/,
    // 下周表达式
    nextWeek: /\bnext\s*[월화수목금토일]요일/i,
    // 周末/工作日表达式
    weekend: /\b주말/i,
    workday: /\b평일/i,
    // 星期几
    weekday: /\b[월화수목금토일]요일/i,
    // 月份名称
    monthName: /\b(1월|2월|3월|4월|5월|6월|7월|8월|9월|10월|11월|12월|1~12월|1-12월|1-12월)\b/i,
    // 日期格式 (April 4th, 4th of April, April 4, 4 April)
    dateFormat: /\b(\d{1,2})월\s*(\d{1,2})일\b/i,
    // 数字日期格式
    numericDate: /\b(\d{1,2})월\s*(\d{1,2})일\b/i,
    // 其他相对表达
    otherRelative: /\b(\d+)[일주월년]\s*(?:후|이후|전)\b|\b(?:다음|이번|지난)\s*[주월년]\b|\b(?:다음달|이번달|지난달)\b/i,
  }
};

/**
 * 获取指定语言的chrono解析选项
 * @param lang 语言代码
 * @returns chrono配置选项
 */
const getChronoOptions = (lang: 'en' | 'zh' | 'ja' | 'ko') => {
  // 基本选项
  const options = { 
    forwardDate: true,
  };
  
  // 根据语言返回不同配置
  switch (lang) {
    case 'en':
      return options;
    case 'zh':
      return options;
    case 'ja':
    case 'ko':
      return options;
    default:
      return options;
  }
};

/**
 * 获取指定语言的日期时间正则模式
 * @param lang 语言代码
 * @returns 日期时间正则模式对象
 */
const getDateTimePatterns = (lang: 'en' | 'zh' | 'ja' | 'ko') => {
  switch (lang) {
    case 'en':
      return {
        today: /\btoday\b/i,
        tomorrow: /\btomorrow\b/i,
        dayAfterTomorrow: /\bday after tomorrow\b/i,
        nextWeek: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        weekday: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        weekend: /\bweekend\b/i,
        // 增强数字日期格式识别能力，支持更多格式
        numericDate: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])(?:[\/\-](\d{2,4}))?\b/,
        // 增加月份日期格式识别能力，支持各种格式的月份日期组合
        monthDate: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[,\s]*(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?\b/i,
        // 增强相对日期表达能力 - 扩展相对时间表达
        otherRelative: /\b(?:in|after)\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)s?\b|\b(\d+)\s+(day|days|week|weeks|month|months|year|years)s?\s+(?:from\s+)?(?:now|today)\b|\b(next|coming)\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b(last|previous)\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        // 增强时间表达式识别能力
        standard: /\b(\d{1,2})(?::(\d{1,2}))?\s*(?:am|pm|a\.m\.|p\.m\.)??\b/i,
        am: /\b(?:am|a\.m\.|morning)\b/i,
        pm: /\b(?:pm|p\.m\.|afternoon|evening|night)\b/i,
      };
    case 'zh':
      return {
        today: /今[天日]/,
        tomorrow: /明[天日]|明儿/,
        dayAfterTomorrow: /后[天日]|後[天日]/,
        // 增强下周X和本周X的匹配能力
        nextWeek: /下[个個]?[周週][一二三四五六日天]|下[个個]?星期[一二三四五六日天]/,
        // 增加下下周的识别能力
        nextNextWeek: /下下[个個]?[周週][一二三四五六日天]|下下[个個]?星期[一二三四五六日天]/,
        weekday: /[周週星期][一二三四五六日天]/,
        weekend: /周末|週末|星期六|星期日|星期天/,
        numericDate: /(\d{1,2})[月\/\-](\d{1,2})(?:[日号號])?/,
        // 增强中文相对日期表达识别能力
        otherRelative: /(\d+)[天日周週月年](?:后|後|之后|之後|以后|以後)|[过過](\d+)[天日周週月年]|(?:下|下个|下個|下一|今|本|这|這)(?:周|週|星期|月|礼拜|禮拜|年)|(?:上|上个|上個|上一|前|前个|前個)(?:周|週|星期|月|礼拜|禮拜|年)|(\d+)个?(?:月|周|星期|週|礼拜|禮拜|小时|小時)(?:后|後|之后|之後|以后|以後)/,
        // 增加复合表达式的识别能力
        complexExpression: /下[个個]?月(\d{1,2})(?:号|號|日)|下下[个個]?(?:周|週|星期)|(\d+)个?月(?:后|後|以后|以後)(?:[周週星期][一二三四五六日天])?/,
        standard: /([上下]午|早上|晚上|傍晚|凌晨|中午)?[ ]?([\d一二三四五六七八九十]+)[点點时時](?:([\d一二三四五六七八九十半刻]+)[分]?)?|(\d{1,2})[:：](\d{1,2})/,
        am: /上午|早上|早晨|凌晨/,
        pm: /下午|晚上|傍晚|黄昏|晚间|中午/,
        // 更全面的中文时段表示
        timeWords: {
          '早上': 8, '早晨': 8, '凌晨': 5, '上午': 10, 
          '中午': 12, '午饭': 12, '午餐': 12, '正午': 12,
          '下午': 15, '午后': 15, 
          '傍晚': 18, '黄昏': 18, '薄暮': 18, '黄昏时分': 18,
          '晚上': 20, '夜晚': 21, '晚间': 20, '夜里': 21, '夜间': 21,
          '深夜': 23, '半夜': 0, '夜深': 23, '夜深人静': 0
        }
      };
    case 'ja':
      return {
        today: /今日|本日/,
        tomorrow: /明日|あした/,
        dayAfterTomorrow: /明後日|あさって/,
        nextWeek: /来週の[月火水木金土日]/,
        weekday: /[月火水木金土日]曜日/,
        weekend: /週末/,
        numericDate: /(\d{1,2})月(\d{1,2})日/,
        // 增强日文相对日期表达识别能力
        otherRelative: /(\d+)[日週月年]後|(\d+)[日週月年]前|来[週月年]|先[週月年]|次[週月年]|前[週月年]|(\d+)[日週月年](?:後|以後)/,
        standard: /(\d{1,2})(?:時|:)(\d{1,2})?(?:分)?/,
        am: /午前|朝|早朝/,
        pm: /午後|夕方|夜|晩/,
      };
    case 'ko':
      return {
        today: /오늘/,
        tomorrow: /내일/,
        dayAfterTomorrow: /모레/,
        nextWeek: /다음\s*[월화수목금토일]요일/,
        weekday: /[월화수목금토일]요일/,
        weekend: /주말/,
        numericDate: /(\d{1,2})월\s*(\d{1,2})일/,
        // 增强韩文相对日期表达识别能力
        otherRelative: /(\d+)[일주월년]\s*후|(\d+)[일주월년]\s*전|다음\s*[주월년]|이번\s*[주월년]|지난\s*[주월년]|다음달|이번달|지난달|(\d+)[일주월년]\s*(?:후|이후)/,
        standard: /(\d{1,2})(?:시|:)(\d{1,2})?(?:분)?/,
        am: /오전|아침/,
        pm: /오후|저녁|밤/,
      };
    default:
      return {
        today: /today/i,
        tomorrow: /tomorrow/i,
        standard: /(\d{1,2})(?::(\d{1,2}))?/,
        am: /am/i,
        pm: /pm/i,
      };
  }
}; 

/**
 * 定义星期几的映射
 */
type WeekdayMap = {
  [key: string]: {
    [key: string]: number;
  };
};

/**
 * 星期几映射表
 */
const weekdayMap: WeekdayMap = {
  'en': {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0
  },
  'zh': {
    '周一': 1,
    '周二': 2,
    '周三': 3,
    '周四': 4,
    '周五': 5,
    '周六': 6,
    '周日': 0,
    '星期一': 1,
    '星期二': 2,
    '星期三': 3,
    '星期四': 4,
    '星期五': 5,
    '星期六': 6,
    '星期日': 0
  },
  'ja': {
    '月曜日': 1,
    '火曜日': 2,
    '水曜日': 3,
    '木曜日': 4,
    '金曜日': 5,
    '土曜日': 6,
    '日曜日': 0
  },
  'ko': {
    '월요일': 1,
    '화요일': 2,
    '수요일': 3,
    '목요일': 4,
    '금요일': 5,
    '토요일': 6,
    '일요일': 0,
    '월': 1,
    '화': 2,
    '수': 3,
    '목': 4,
    '금': 5,
    '토': 6,
    '일': 0
  }
};

/**
 * 验证日期是否匹配指定的星期几，并调整日期
 * @param text 输入文本
 * @param date 当前日期
 * @param isNextWeek 是否在下周
 * @param lang 语言
 * @returns 调整后的日期
 */
const validateDateWithWeekday = (text: string, date: Date, isNextWeek: boolean, lang: 'en' | 'zh' | 'ja' | 'ko'): Date => {
  const newDate = new Date(date);
  
  // 获取当前日期的星期几
  const currentDay = newDate.getDay();
  
  // 查找文本中的星期几
  const weekdays = weekdayMap[lang];
  let targetDay = -1;
  
  for (const [weekday, dayNum] of Object.entries(weekdays)) {
    if (text.toLowerCase().includes(weekday.toLowerCase())) {
      targetDay = dayNum;
      break;
    }
  }
  
  if (targetDay === -1) {
    console.log('未找到有效的星期几');
    return newDate;
  }
  
  // 计算需要调整的天数
  let daysToAdd = targetDay - currentDay;
  
  // 如果目标日期已经过去，调整到下周
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  // 如果指定是下周，且日期不在下周，则额外加7天
  if (isNextWeek && daysToAdd < 7) {
    daysToAdd += 7;
  }
  
  // 调整日期
  newDate.setDate(newDate.getDate() + daysToAdd);
  console.log(`调整日期到${isNextWeek ? '下周' : '本周'}的星期${targetDay}:`, newDate);
  
  return newDate;
};

/**
 * 解析相对日期表达式
 * @param text 输入文本
 * @param resultDate 当前日期
 * @param lang 语言
 * @returns 处理后的日期
 */
function parseRelativeDateExpression(text: string, resultDate: Date, lang: 'en' | 'zh' | 'ja' | 'ko'): Date {
  const patterns = getDateTimePatterns(lang);
  if (!patterns.otherRelative) return resultDate;

  const match = text.match(patterns.otherRelative);
  if (!match) return resultDate;

  console.log('匹配到相对日期表达式:', match[0]);
  const newDate = new Date(resultDate);

  // 处理不同语言的相对日期表达式
  switch (lang) {
    case 'en':
      if (match[1] && match[2]) {
        // 格式: "in 3 days", "after 2 months"
        const number = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.includes('day')) {
          newDate.setDate(newDate.getDate() + number);
        } else if (unit.includes('week')) {
          newDate.setDate(newDate.getDate() + number * 7);
        } else if (unit.includes('month')) {
          newDate.setMonth(newDate.getMonth() + number);
        } else if (unit.includes('year')) {
          newDate.setFullYear(newDate.getFullYear() + number);
        }
        console.log(`设置日期为${match[0]}:`, newDate);
      } else if (match[3] && match[4]) {
        // 格式: "3 days from now", "2 months from today"
        const number = parseInt(match[3]);
        const unit = match[4].toLowerCase();
        
        if (unit.includes('day')) {
          newDate.setDate(newDate.getDate() + number);
        } else if (unit.includes('week')) {
          newDate.setDate(newDate.getDate() + number * 7);
        } else if (unit.includes('month')) {
          newDate.setMonth(newDate.getMonth() + number);
        } else if (unit.includes('year')) {
          newDate.setFullYear(newDate.getFullYear() + number);
        }
        console.log(`设置日期为${match[0]}:`, newDate);
      } else if (match[5] && match[6]) {
        // 格式: "next week", "coming month"
        const period = match[6].toLowerCase();
        
        if (period.includes('day')) {
          newDate.setDate(newDate.getDate() + 1);
        } else if (period.includes('week')) {
          newDate.setDate(newDate.getDate() + 7);
        } else if (period.includes('month')) {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (period.includes('year')) {
          newDate.setFullYear(newDate.getFullYear() + 1);
        } else if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(period)) {
          // 处理"next Monday"这样的表达式
          return validateDateWithWeekday(text, resultDate, true, lang);
        }
        console.log(`设置日期为${match[0]}:`, newDate);
      } else if (match[7] && match[8]) {
        // 格式: "last week", "previous month"
        const period = match[8].toLowerCase();
        
        if (period.includes('day')) {
          newDate.setDate(newDate.getDate() - 1);
        } else if (period.includes('week')) {
          newDate.setDate(newDate.getDate() - 7);
        } else if (period.includes('month')) {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (period.includes('year')) {
          newDate.setFullYear(newDate.getFullYear() - 1);
        } else if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(period)) {
          // 处理"last Monday"这样的表达式
          const dayName = period;
          // Fix: Access the correct language-specific weekday mapping
          const targetDay = weekdayMap['en'][dayName];
          
          if (targetDay !== undefined) {
            const currentDay = newDate.getDay();
            let daysToSubtract = currentDay - targetDay;
            if (daysToSubtract <= 0) {
              daysToSubtract += 7;
            }
            newDate.setDate(newDate.getDate() - daysToSubtract);
          }
        }
        console.log(`设置日期为${match[0]}:`, newDate);
      }
      break;
      
    case 'zh':
      // 处理"下周 X"和"下下周 X"的表达式
      const nextWeekMatch = match[0].match(/下下?周([一二三四五六日])/);
      if (nextWeekMatch) {
        const currentDay = newDate.getDay();
        const targetDay = '日一二三四五六'.indexOf(nextWeekMatch[1]);
        const weeksAhead = match[0].startsWith('下下') ? 2 : 1;
        const daysToAdd = (7 - currentDay + targetDay) % 7 + (weeksAhead - 1) * 7;
        newDate.setDate(newDate.getDate() + daysToAdd);
        console.log(`设置日期为${match[0]}:`, newDate);
      } else if (match[0].match(/下(?:个|個)?月|下(?:一)?个?月/)) {
        newDate.setMonth(newDate.getMonth() + 1);
        console.log('设置日期为下个月:', newDate);
      } else if (match[0].match(/下(?:个|個)?年|明年/)) {
        newDate.setFullYear(newDate.getFullYear() + 1);
        console.log('设置日期为下一年/明年:', newDate);
      } else if (match[0].match(/上(?:个|個)?周|上(?:个|個)?週|上(?:个|個)?星期|上(?:个|個)?礼拜|上(?:个|個)?禮拜|上周|上週/)) {
        newDate.setDate(newDate.getDate() - 7);
        console.log('设置日期为上周:', newDate);
      } else if (match[0].match(/上(?:个|個)?月|上(?:一)?个?月/)) {
        newDate.setMonth(newDate.getMonth() - 1);
        console.log('设置日期为上个月:', newDate);
      } else if (match[0].match(/上(?:个|個)?年|去年/)) {
        newDate.setFullYear(newDate.getFullYear() - 1);
        console.log('设置日期为上一年/去年:', newDate);
      } else if (match[0].match(/(?:这|這)(?:个|個)?周|(?:这|這)(?:个|個)?週|(?:这|這)(?:个|個)?星期|(?:这|這)(?:个|個)?礼拜|(?:这|這)(?:个|個)?禮拜|本周|本週/)) {
        // 当前周，无需调整日期
        console.log('设置日期为本周:', newDate);
      } else if (match[0].match(/(?:这|這)(?:个|個)?月|(?:这|這)(?:一)?个?月|本月/)) {
        // 当前月，无需调整日期
        console.log('设置日期为本月:', newDate);
      } else if (match[0].match(/(?:这|這)(?:个|個)?年|今年/)) {
        // 当前年，无需调整日期
        console.log('设置日期为今年:', newDate);
      } else {
        // 处理"X天/周/月/年后"的格式
        let numReg = /(\d+)个?(?:天|日|周|週|星期|礼拜|禮拜|月|年)(?:后|後|之后|之後|以后|以後)/;
        let numMatch = match[0].match(numReg);
        
        if (numMatch && numMatch[1]) {
          const num = parseInt(numMatch[1]);
          
          if (match[0].includes('天') || match[0].includes('日')) {
            newDate.setDate(newDate.getDate() + num);
            console.log(`设置日期为${num}天后:`, newDate);
          } else if (match[0].includes('周') || match[0].includes('週') || 
                     match[0].includes('星期') || match[0].includes('礼拜') || 
                     match[0].includes('禮拜')) {
            newDate.setDate(newDate.getDate() + num * 7);
            console.log(`设置日期为${num}周后:`, newDate);
          } else if (match[0].includes('月')) {
            newDate.setMonth(newDate.getMonth() + num);
            console.log(`设置日期为${num}个月后:`, newDate);
          } else if (match[0].includes('年')) {
            newDate.setFullYear(newDate.getFullYear() + num);
            console.log(`设置日期为${num}年后:`, newDate);
          } else if (match[0].includes('小时') || match[0].includes('小時')) {
            newDate.setHours(newDate.getHours() + num);
            console.log(`设置时间为${num}小时后:`, newDate);
          }
        }
      }
      break;
      
    case 'ja':
      // 处理日文相对日期表达式
      if (match[0].includes('来週')) {
        newDate.setDate(newDate.getDate() + 7);
        console.log('设置日期为来週 (下周):', newDate);
      } else if (match[0].includes('来月')) {
        newDate.setMonth(newDate.getMonth() + 1);
        console.log('设置日期为来月 (下个月):', newDate);
      } else if (match[0].includes('来年')) {
        newDate.setFullYear(newDate.getFullYear() + 1);
        console.log('设置日期为来年 (明年):', newDate);
      } else if (match[0].includes('先週')) {
        newDate.setDate(newDate.getDate() - 7);
        console.log('设置日期为先週 (上周):', newDate);
      } else if (match[0].includes('先月')) {
        newDate.setMonth(newDate.getMonth() - 1);
        console.log('设置日期为先月 (上个月):', newDate);
      } else if (match[0].includes('先年')) {
        newDate.setFullYear(newDate.getFullYear() - 1);
        console.log('设置日期为先年 (去年):', newDate);
      } else {
        // 处理"X日/週/月/年後"的格式
        let numReg = /(\d+)(?:日|週|月|年)(?:後|以後)/;
        let numMatch = match[0].match(numReg);
        
        if (numMatch && numMatch[1]) {
          const num = parseInt(numMatch[1]);
          
          if (match[0].includes('日')) {
            newDate.setDate(newDate.getDate() + num);
            console.log(`设置日期为${num}日後 (${num}天后):`, newDate);
          } else if (match[0].includes('週')) {
            newDate.setDate(newDate.getDate() + num * 7);
            console.log(`设置日期为${num}週後 (${num}周后):`, newDate);
          } else if (match[0].includes('月')) {
            newDate.setMonth(newDate.getMonth() + num);
            console.log(`设置日期为${num}月後 (${num}个月后):`, newDate);
          } else if (match[0].includes('年')) {
            newDate.setFullYear(newDate.getFullYear() + num);
            console.log(`设置日期为${num}年後 (${num}年后):`, newDate);
          }
        }
      }
      break;
      
    case 'ko':
      // 处理韩文相对日期表达式
      if (match[0].includes('다음 주')) {
        newDate.setDate(newDate.getDate() + 7);
        console.log('设置日期为다음 주 (下周):', newDate);
      } else if (match[0].includes('다음달')) {
        newDate.setMonth(newDate.getMonth() + 1);
        console.log('设置日期为다음달 (下个月):', newDate);
      } else if (match[0].includes('다음 년')) {
        newDate.setFullYear(newDate.getFullYear() + 1);
        console.log('设置日期为다음 년 (明年):', newDate);
      } else if (match[0].includes('지난 주')) {
        newDate.setDate(newDate.getDate() - 7);
        console.log('设置日期为지난 주 (上周):', newDate);
      } else if (match[0].includes('지난달')) {
        newDate.setMonth(newDate.getMonth() - 1);
        console.log('设置日期为지난달 (上个月):', newDate);
      } else if (match[0].includes('지난 년')) {
        newDate.setFullYear(newDate.getFullYear() - 1);
        console.log('设置日期为지난 년 (去年):', newDate);
      } else if (match[0].includes('이번 주')) {
        // 当前周，无需调整日期
        console.log('设置日期为이번 주 (本周):', newDate);
      } else if (match[0].includes('이번달')) {
        // 当前月，无需调整日期
        console.log('设置日期为이번달 (本月):', newDate);
      } else if (match[0].includes('이번 년')) {
        // 当前年，无需调整日期
        console.log('设置日期为이번 년 (今年):', newDate);
      } else {
        // 处理"X일/주/월/년 후"的格式
        let numReg = /(\d+)(?:일|주|월|년)\s*(?:후|이후)/;
        let numMatch = match[0].match(numReg);
        
        if (numMatch && numMatch[1]) {
          const num = parseInt(numMatch[1]);
          
          if (match[0].includes('일')) {
            newDate.setDate(newDate.getDate() + num);
            console.log(`设置日期为${num}일 후 (${num}天后):`, newDate);
          } else if (match[0].includes('주')) {
            newDate.setDate(newDate.getDate() + num * 7);
            console.log(`设置日期为${num}주 후 (${num}周后):`, newDate);
          } else if (match[0].includes('월')) {
            newDate.setMonth(newDate.getMonth() + num);
            console.log(`设置日期为${num}월 후 (${num}个月后):`, newDate);
          } else if (match[0].includes('년')) {
            newDate.setFullYear(newDate.getFullYear() + num);
            console.log(`设置日期为${num}년 후 (${num}年后):`, newDate);
          }
        }
      }
      break;
  }
  
  return newDate;
}

/**
 * 预处理文本，去除特殊字符，规范化空格等
 * @param text 输入文本
 * @returns 处理后的文本
 */
function preprocessText(text: string): string {
  if (!text) return '';
  
  // 规范化空格
  let processed = text.replace(/\s+/g, ' ').trim();
  
  // 确保标点符号前后有空格
  processed = processed.replace(/([.,;:!?])/g, ' $1 ');
  
  // 确保括号前后有空格
  processed = processed.replace(/([()])/g, ' $1 ');
  
  // 移除多余空格
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
}

/**
 * 保护常见词组，避免被错误分割
 * @param text 输入文本
 * @returns 处理后的文本和词组映射
 */
function protectCommonPhrases(text: string): { processedText: string, phraseMap: Map<string, string> } {
  const phraseMap = new Map<string, string>();
  let processedText = text;
  
  // 要保护的常见词组列表
  const commonPhrases = [
    'meet with', 'talk to', 'call with', 'lunch with', 'dinner with',
    'check in', 'follow up', 'catch up', 'get together', 'hang out',
    'meeting with', 'appointment with', 'interview with', 'session with',
    'review with', 'discuss with', 'sync with', 'align with'
  ];
  
  // 为每个常见词组创建一个唯一标记并替换
  commonPhrases.forEach((phrase, index) => {
    const marker = `__PHRASE_${index}__`;
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    
    if (regex.test(processedText)) {
      phraseMap.set(marker, phrase);
      processedText = processedText.replace(regex, marker);
    }
  });
  
  return { processedText, phraseMap };
}

/**
 * 解析字符串形式的数字（包括中文、英文、阿拉伯数字）
 * @param numStr 数字字符串
 * @param lang 语言
 * @returns 数字值
 */
function parseNumberString(numStr: string, lang: 'en' | 'zh' | 'ja' | 'ko'): number {
  if (!numStr) return 0;
  
  console.log(`[parseNumberString] Input: "${numStr}", Language: ${lang}`);
  
  // 如果已经是数字，直接返回
  if (/^\d+$/.test(numStr)) {
    console.log(`[parseNumberString] String is already numeric, returning: ${parseInt(numStr)}`);
    return parseInt(numStr);
  }
  
  // 处理中文数字
  if (lang === 'zh') {
    const chineseNumMap: Record<string, number> = {
      '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    console.log(`[parseNumberString] Chinese numeral string: "${numStr}"`);
    
    // 简单中文数字转换 (一、二、三...)
    if (numStr.length === 1 && chineseNumMap[numStr] !== undefined) {
      const result = chineseNumMap[numStr];
      console.log(`[parseNumberString] Single Chinese digit: ${numStr} -> ${result}`);
      return result;
    }
    
    // 处理"十X"格式 (十一、十二...)
    if (numStr.startsWith('十') && numStr.length === 2) {
      const result = 10 + (chineseNumMap[numStr[1]] || 0);
      console.log(`[parseNumberString] "十" followed by "${numStr[1]}" -> ${result}`);
      return result;
    }
    
    // 处理"X十"格式 (二十、三十...)
    if (numStr.length === 2 && numStr.endsWith('十')) {
      const result = (chineseNumMap[numStr[0]] || 0) * 10;
      console.log(`[parseNumberString] "${numStr[0]}十" -> ${result}`);
      return result;
    }
    
    // 处理"X十Y"格式 (二十一、三十二...)
    if (numStr.length === 3 && numStr[1] === '十') {
      const result = (chineseNumMap[numStr[0]] || 0) * 10 + (chineseNumMap[numStr[2]] || 0);
      console.log(`[parseNumberString] "${numStr[0]}十${numStr[2]}" -> ${result}`);
      return result;
    }
    
    console.log(`[parseNumberString] Could not parse Chinese numeral: "${numStr}"`);
    return 0;
  }
  
  // 处理英文数字单词
  if (lang === 'en') {
    const englishNumMap: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
    };
    
    const lowerNumStr = numStr.toLowerCase();
    if (englishNumMap[lowerNumStr] !== undefined) {
      console.log(`[parseNumberString] English number word: ${lowerNumStr} -> ${englishNumMap[lowerNumStr]}`);
      return englishNumMap[lowerNumStr];
    }
    
    console.log(`[parseNumberString] Could not parse English number word: "${lowerNumStr}"`);
  }
  
  // 如果无法解析，返回0
  console.log(`[parseNumberString] Failed to parse: "${numStr}", returning 0`);
  return 0;
}

/**
 * 提取任务内容
 * @param text 输入文本
 * @returns 任务内容
 */
function extractTaskContent(text: string): string {
  // 检测语言
  const lang = detectLanguage(text);
  
  let content = text;
  
  // 根据不同语言移除日期时间表达式
  if (lang === 'en') {
    // 移除英文日期表达式
    content = removeEnglishDateTimeExpressions(content);
  } else if (lang === 'zh') {
    // 移除中文日期表达式
    content = removeChineseDateTimeExpressions(content);
  } else if (lang === 'ko') {
    // 移除韩文日期表达式
    content = removeKoreanDateTimeExpressions(content);
  } else if (lang === 'ja') {
    // 移除日文日期表达式
    // 这部分可以根据需要添加
  }
  
  // 移除常见日期前缀
  content = content.replace(/\b(at|on|in|by|from|to|until)\s+/gi, '');
  
  // 清理并返回最终内容
  return content.trim();
}

/**
 * 解析快速笔记
 * @param text 输入文本
 * @returns 解析结果，包含日期和内容
 */
const parseQuickNote = (text: string): { date: Date, content: string } | null => {
  try {
    console.log('解析输入:', text);
    
    // 预处理无空格的日期时间表达式
    let processedText = text;
    
    // 修复无空格的日期前缀，如"atmay18th" -> "at may 18th"
    const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
    const datePrepositions = 'at|on|in|by|from|to|until';
    processedText = processedText.replace(new RegExp(`\\b(${datePrepositions})(${monthNames})`, 'gi'), '$1 $2');
    
    // 修复无空格时间格式，如"at2pm" -> "at 2pm"
    processedText = processedText.replace(/\b(at|on|in|by|from|to|until)(\d{1,2})(?:(am|pm|a\.m|p\.m))?/gi, '$1 $2$3');
    
    // 修复无空格日期，如"may18th" -> "may 18th"
    processedText = processedText.replace(new RegExp(`\\b(${monthNames})(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'gi'), '$1 $2$3');
    
    console.log('预处理日期时间后的文本:', processedText);
    
    // 步骤1: 获取当前参考时间和检测语言
    const now = new Date();
    const lang = detectLanguage(processedText) as 'en' | 'zh' | 'ja' | 'ko';
    console.log('检测到语言:', lang);
    
    // 步骤2: 设置解析选项
    const options = getChronoOptions(lang);
    
    // 步骤3: 初始化结果日期为当前日期
    let resultDate = new Date(now);
    resultDate.setHours(0, 0, 0, 0); // 重置时间
    
    // 步骤4: 获取日期时间模式
    const patterns = getDateTimePatterns(lang);
    
    // --- MOVED UP: Global time marker detection BEFORE date parsing ---
    // 先全局检查整个文本是否包含上午/下午/晚上等时间段标记
    // 这样即使日期识别修改了文本，也能正确捕获时间段标记
    let globalIsPM: boolean | null = null; // null means not detected
    let globalTimePrefix = '';
    
    // 下午/晚上/傍晚/黄昏/夜晚等属于PM
    if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(processedText)) {
      globalIsPM = true;
      const pmMatch = processedText.match(/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/);
      if (pmMatch) globalTimePrefix = pmMatch[0];
      console.log(`全局检测到PM时段: ${globalTimePrefix}`);
    } 
    // 早上/上午等属于AM
    else if (/(早上|早晨|凌晨|上午)/.test(processedText)) {
      globalIsPM = false;
      const amMatch = processedText.match(/(早上|早晨|凌晨|上午)/);
      if (amMatch) globalTimePrefix = amMatch[0];
      console.log(`全局检测到AM时段: ${globalTimePrefix}`);
    } else {
      console.log('未检测到全局时间段标记，将使用局部匹配');
    }
    // --- END MOVED SECTION ---
    
    // 新增步骤: 尝试解析复合时间表达式
    const { date: complexDate, processed: complexProcessed } = parseComplexTimeExpression(processedText, resultDate, lang);
    if (complexProcessed) {
      resultDate = complexDate;
      console.log('已使用复合时间表达式解析:', resultDate);
    }
    
    // 步骤5: 根据语言处理特定日期格式
    let dateProcessed = complexProcessed;
    let timeProcessed = complexProcessed;
    
    // 如果复合表达式没有被处理，继续尝试常规模式
    if (!complexProcessed) {
      // 处理中文特殊情况 - 优先识别完整的日期时间表达式
      if (lang === 'zh') {
        // 先处理日期部分
        
        // 处理"今天"
        if (patterns.today.test(processedText)) {
          console.log('匹配到"今天"');
          // 今天已经是默认日期，无需额外处理
          dateProcessed = true;
        }
        
        // 处理"明天"
        else if (patterns.tomorrow.test(processedText)) {
          resultDate.setDate(resultDate.getDate() + 1);
          console.log('设置日期为明天:', resultDate);
          dateProcessed = true;
        }
        
        // 处理"后天/後天"
        else if (patterns.dayAfterTomorrow?.test(processedText)) {
          resultDate.setDate(resultDate.getDate() + 2);
          console.log('设置日期为后天:', resultDate);
          dateProcessed = true;
        }
        
        // 处理下周X
        // 优先匹配下周X的情况，采用专门的下周星期几判断
        else if (patterns.nextWeek?.test(processedText) || /下[个個]?[周週]/.test(processedText)) {
          console.log('[Debug] 匹配到下周模式，原文本:', processedText);
          
          // 针对"下周五"这样的表达式进行特殊处理
          const weekdayMatch = processedText.match(/下[个個]?[周週]([一二三四五六日天])/);
          if (weekdayMatch && weekdayMatch[1]) {
            const weekdayChar = weekdayMatch[1];
            console.log('[Debug] 提取到的星期字符:', weekdayChar);
            const targetDay = zhWeekdayMap[weekdayChar];
            console.log('[Debug] 映射后的目标星期:', targetDay);
            
            if (targetDay !== undefined) {
              // 使用 parseNextWeekdayFromToday 计算日期
              resultDate = parseNextWeekdayFromToday(targetDay);
              console.log('[Debug] 最终计算得到的日期:', resultDate.toISOString());
              dateProcessed = true;
            }
          } else {
            // 如果没有特定匹配，使用通用验证函数，但标记为已处理
            resultDate = validateDateWithWeekday(processedText, resultDate, true, lang);
            dateProcessed = true;
          }
        }
        
        // 处理星期几
        else if (patterns.weekday?.test(processedText)) {
          console.log('匹配到本周星期几模式');
          resultDate = validateDateWithWeekday(processedText, resultDate, false, lang);
          dateProcessed = true;
        }
        
        // 然后处理时间部分
        
        // --- Add Debug Log ---
        // 检查日期解析后的文本是否被修改，这可能影响时间解析
        console.log(`[Debug] 日期解析后的文本: "${processedText}"`);
        console.log(`[Debug] 全局时间段标记信息: globalIsPM=${globalIsPM}, prefix="${globalTimePrefix}"`);
        // --- End Debug Log ---
        
        // 提取小时和分钟
        const timeRegexes = [
          // 下午/晚上X点X分 - 优化正则表达式匹配更多时段词汇
          /(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)[ ]?([\d一二三四五六七八九十]+)[点點时時](?:([\d一二三四五六七八九十半刻]+)[分]?)?/,
          // X点X分
          /([\d一二三四五六七八九十]+)[点點时時](?:([\d一二三四五六七八九十半刻]+)[分]?)?/,
          // X:X
          /(\d{1,2})[:：](\d{1,2})/
        ];
        
        // --- Add Debug Log ---
        console.log(`[Debug] 开始解析时间，当前文本: "${processedText}"`);
        console.log(`[Debug] 全局时间标记: globalIsPM=${globalIsPM}, prefix='${globalTimePrefix}'`);
        // --- End Debug Log ---
        
        let timeFound = false;
        // --- START MODIFICATION (v3) ---
        let parsedHours: number | undefined = undefined;
        let parsedMinutes: number | undefined = undefined;
        let timeMatchedString = ''; // Store the matched string for context
        // --- END MODIFICATION (v3) ---

        for (const regex of timeRegexes) {
          const timeMatch = processedText.match(regex);
          if (timeMatch) {
            console.log('匹配到中文时间格式:', timeMatch[0]);
            console.log(`[Debug] 时间匹配详情: index=${timeMatch.index}, groups=${JSON.stringify(timeMatch.slice(1))}`);
            timeMatchedString = timeMatch[0]; // Store the raw match
            
            // --- START MODIFICATION (v3) ---
            let isPM = false;
            let currentHours: number | undefined = undefined;
            let currentMinutes: number | undefined = undefined;
            let timePrefix = ''; 

            // Determine which regex matched and extract info accordingly
            // --- Add Log ---
            console.log(`[Debug Time Parse] Regex ${timeRegexes.indexOf(regex)} matched:`, timeMatch);
            // --- End Log ---
            if (regex === timeRegexes[0] && timeMatch[1] && timeMatch[2]) { // Matched prefix + hour (e.g., 晚上五点)
                timePrefix = timeMatch[1];
                const hourStr = timeMatch[2];
                const minuteStr = timeMatch[3] || '0';

                if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix)) {
                    isPM = true;
                    console.log(`检测到PM时段: ${timePrefix}`);
                } else if (timePrefix) {
                    console.log(`检测到AM时段: ${timePrefix}`);
                }
                
                console.log(`[Debug] 解析时间字符串: hourStr="${hourStr}", minuteStr="${minuteStr}"`);
                currentHours = /^\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr, 'zh');
                console.log(`[Debug] 解析小时结果: ${hourStr} -> ${currentHours}`);
                
                if (minuteStr === '半') currentMinutes = 30;
                else if (minuteStr === '刻' || minuteStr === '一刻') currentMinutes = 15;
                else if (minuteStr === '两刻' || minuteStr === '二刻') currentMinutes = 30;
                else if (minuteStr === '三刻') currentMinutes = 45;
                else currentMinutes = /^\d+$/.test(minuteStr) ? parseInt(minuteStr) : parseNumberString(minuteStr, 'zh');
                console.log(`[Debug] 解析分钟结果: ${minuteStr} -> ${currentMinutes}`);

            } else if (regex === timeRegexes[1] && timeMatch[1]) { // Matched hour only (e.g., 五点)
                const hourStr = timeMatch[1];
                const minuteStr = timeMatch[2] || '0';

                currentHours = /^\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr, 'zh');

                if (minuteStr === '半') currentMinutes = 30;
                else if (minuteStr === '刻' || minuteStr === '一刻') currentMinutes = 15;
                else if (minuteStr === '两刻' || minuteStr === '二刻') currentMinutes = 30;
                else if (minuteStr === '三刻') currentMinutes = 45;
                else currentMinutes = /^\d+$/.test(minuteStr) ? parseInt(minuteStr) : parseNumberString(minuteStr, 'zh');

                // Check preceding text for time period if no prefix matched directly
                const matchIndex = timeMatch.index;
                if (matchIndex !== undefined && matchIndex > 0) {
                    const textBefore = processedText.substring(0, matchIndex).trim();
                    const wordsBefore = textBefore.split(/[\s,]+/);
                    const lastWord = wordsBefore.length > 0 ? wordsBefore[wordsBefore.length - 1] : '';
                    if (lastWord && /(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(lastWord)) {
                        isPM = true;
                        timePrefix = lastWord;
                        console.log(`根据前置词"${lastWord}"检测到PM时段`);
                    } else if (lastWord && /(早上|早晨|凌晨|上午)/.test(lastWord)) {
                        timePrefix = lastWord;
                        console.log(`根据前置词"${lastWord}"检测到AM时段`);
                    }
                }

            } else if (regex === timeRegexes[2] && timeMatch[1]) { // Matched HH:MM
                const hourStr = timeMatch[1];
                const minuteStr = timeMatch[2] || '0';
                currentHours = parseInt(hourStr);
                currentMinutes = parseInt(minuteStr);

                const matchIndex = timeMatch.index;
                 if (matchIndex !== undefined && matchIndex > 0) {
                    const textBefore = processedText.substring(0, matchIndex).trim();
                    const wordsBefore = textBefore.split(/[\s,]+/);
                    const lastWord = wordsBefore.length > 0 ? wordsBefore[wordsBefore.length - 1] : '';
                     if (lastWord && /(下午|晚上|傍晚)/.test(lastWord)) {
                        if (currentHours > 0 && currentHours < 12) {
                           isPM = true; 
                           console.log(`根据前置词"${lastWord}"检测到 ${timeMatch[0]} 的 PM 时段`);
                        } else if (currentHours === 12) {
                           isPM = true; 
                           console.log(`根据前置词"${lastWord}"确认 ${timeMatch[0]} 为 PM (中午)`);
                        }
                    } else if (lastWord && /(早上|上午|凌晨)/.test(lastWord)) {
                         console.log(`根据前置词"${lastWord}"确认 ${timeMatch[0]} 为 AM 时段`);
                    }
                }
            }

            // Check if current parsing attempt yielded valid numbers
            if (currentHours !== undefined && currentMinutes !== undefined && !isNaN(currentHours) && !isNaN(currentMinutes)) {
                
                // --- Add Log ---
                console.log(`[Debug Time Parse] Parsed Raw: hours=${currentHours}, minutes=${currentMinutes}, isPM=${isPM}, prefix='${timePrefix}'`);
                // If we have a global AM/PM marker, log it
                if (globalIsPM !== null) {
                    console.log(`[Debug Time Parse] Using global time marker: globalIsPM=${globalIsPM}, prefix='${globalTimePrefix}'`);
                }
                // --- End Log ---

                // Adjust for PM (hours 1-11 become 13-23)
                // Use globalIsPM if available, otherwise fall back to local isPM
                const effectiveIsPM = globalIsPM !== null ? globalIsPM : isPM;
                
                if (effectiveIsPM && currentHours > 0 && currentHours < 12) {
                    currentHours += 12;
                    console.log(`使用${globalIsPM !== null ? '全局' : '局部'}PM时段，转换为24小时制: ${currentHours}`);
                } 
                // Adjust for 12 AM (midnight)
                else if (!effectiveIsPM && currentHours === 12) { 
                    const effectivePrefix = globalIsPM !== null ? globalTimePrefix : timePrefix;
                    if (effectivePrefix && /(早上|早晨|凌晨|上午)/.test(effectivePrefix)) {
                        currentHours = 0; 
                        console.log(`使用${globalIsPM !== null ? '全局' : '局部'}AM时段，处理12 AM (midnight): ${currentHours}`);
                    } else {
                        console.log(`无明确${globalIsPM !== null ? '全局' : '局部'}AM上下文，12点保持为: ${currentHours} (可能为中午)`);
                    }
                }
                
                // Check for valid hour/minute range
                if (currentHours >= 0 && currentHours <= 23 && currentMinutes >= 0 && currentMinutes <= 59) {
                    // Assign to the loop-level variables
                    parsedHours = currentHours;
                    parsedMinutes = currentMinutes;
                    timeFound = true; // Mark that we found a valid time
                    console.log(`解析成功，暂存时间: ${parsedHours}:${parsedMinutes < 10 ? '0' + parsedMinutes : parsedMinutes}`);
                    // --- Add Log ---
                    console.log(`[Debug Time Parse] Time Found! Set timeFound = true.`);
                    // --- End Log ---
                    break; // Exit loop once valid time is found and stored
                } else {
                     console.warn(`本次解析结果超出有效范围: 小时=${currentHours}, 分钟=${currentMinutes}`);
                }

            } else {
                console.warn("未能从当前匹配中提取有效的小时或分钟数字:", timeMatchedString);
            }
            // --- END MODIFICATION (v3) ---
          }
        }
        
        // --- Add Debug Log ---
        console.log(`[Debug] 时间解析完成，timeFound=${timeFound}, parsedHours=${parsedHours}, parsedMinutes=${parsedMinutes}`);
        // --- End Debug Log ---
        
        // --- START MODIFICATION (v3) ---
        // Apply the parsed time AFTER the loop if found
        if (timeFound && parsedHours !== undefined && parsedMinutes !== undefined) {
             console.log(`设置最终时间: ${parsedHours}:${parsedMinutes < 10 ? '0' + parsedMinutes : parsedMinutes}`);
             resultDate.setHours(parsedHours, parsedMinutes, 0, 0);
             timeProcessed = true;
        } else {
             // --- Add Log ---
             console.log(`[Debug Time Parse] No valid time found after loop (timeFound=${timeFound}). Time remains default 00:00 unless fallback applies.`);
             // --- End Log ---
         }
         // --- END MODIFICATION (v3) ---

        // 如果没有找到具体时间，查找时间段表示 (Fallback)
        if (!timeFound) {
          // --- Add Debug Log ---
          console.log(`[Debug] 所有日期时间处理后的文本: "${processedText}"`); 
          // --- End Debug Log ---
          
          // 扩展上午、下午、晚上、早上等粗略时间的识别
          const timeWords: Record<string, number> = patterns.timeWords || {
            '早上': 8, '早晨': 8, '凌晨': 5, '上午': 10, 
            '中午': 12, '午饭': 12, '午餐': 12, '正午': 12,
            '下午': 15, '午后': 15, 
            '傍晚': 18, '黄昏': 18, '薄暮': 18, '黄昏时分': 18,
            '晚上': 20, '夜晚': 21, '晚间': 20, '夜里': 21, '夜间': 21,
            '深夜': 23, '半夜': 0, '夜深': 23, '夜深人静': 0
          };
          
          for (const [word, hour] of Object.entries(timeWords)) {
            if (processedText.includes(word)) {
              resultDate.setHours(hour, 0, 0, 0);
              console.log(`根据"${word}"设置时间为${hour}:00`);
              timeProcessed = true;
              break;
            }
          }
        }
      }
    }
    
    // 如果不是中文或者上面的中文处理未成功，执行通用逻辑
    if (!dateProcessed) {
      // 处理"today"/"今天"
      if (patterns.today.test(processedText)) {
        console.log('匹配到"今天"');
        // 今天已经是默认日期，无需额外处理
        dateProcessed = true;
      }
      
      // 处理"tomorrow"/"明天"
      if (patterns.tomorrow.test(processedText)) {
        resultDate.setDate(resultDate.getDate() + 1);
        console.log('设置日期为明天:', resultDate);
        dateProcessed = true;
      }
      
      // 处理"day after tomorrow"/"后天"
      if (patterns.dayAfterTomorrow?.test(processedText)) {
        resultDate.setDate(resultDate.getDate() + 2);
        console.log('设置日期为后天:', resultDate);
        dateProcessed = true;
      }
      
      // 处理下周某天 (next Monday, 下周一)
      if (patterns.nextWeek?.test(processedText)) {
        resultDate = validateDateWithWeekday(processedText, resultDate, true, lang);
        dateProcessed = true;
      }
      
      // 处理本周某天 (Monday, 周一)
      if (patterns.weekday?.test(processedText)) {
        resultDate = validateDateWithWeekday(processedText, resultDate, false, lang);
        dateProcessed = true;
      }
      
      // 处理相对日期表达式 (例如: "下个月", "三天后", "下周", "next month", "in 3 days")
      if (!dateProcessed && patterns.otherRelative?.test(processedText)) {
        resultDate = parseRelativeDateExpression(processedText, resultDate, lang);
        dateProcessed = true;
      }
    }
    
    // 如果时间没有处理，尝试通用处理
    if (!timeProcessed) {
      // 尝试寻找直接的时间表达式，如 "2pm" 或 "at 2pm"
      if (patterns.standard) {
        const timeMatch = processedText.match(patterns.standard);
        if (timeMatch) {
          console.log('匹配到时间格式:', timeMatch[0]);
          const hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          
          let isPM = false;
          // 检查是否有上午/下午标记
          if (patterns.pm && patterns.pm.test(processedText)) {
            isPM = true;
          } else if (processedText.toLowerCase().includes('pm') || 
                    processedText.toLowerCase().includes('p.m') ||
                    processedText.toLowerCase().includes('afternoon') ||
                    processedText.toLowerCase().includes('evening') ||
                    processedText.toLowerCase().includes('night')) {
            isPM = true;
          }
          
          // 设置小时，转换为24小时制
          let hour24 = hours;
          if (isPM && hours < 12) {
            hour24 = hours + 12;
          } else if (!isPM && hours === 12) {
            hour24 = 0;
          }
          
          resultDate.setHours(hour24, minutes, 0, 0);
          console.log(`设置时间为: ${hour24}:${minutes < 10 ? '0' + minutes : minutes}`);
          timeProcessed = true;
        }
      }
    }
    
    // 使用chrono库尝试解析时间（如果上面的方法没有成功解析时间或日期）
    if ((!dateProcessed || !timeProcessed) && lang !== 'zh') {
      try {
        // 尝试使用chrono解析...
        const chronoResults = chrono.parse(text, new Date(), options);
        if (chronoResults && chronoResults.length > 0) {
          console.log('Chrono解析结果:', chronoResults);
          
          const firstResult = chronoResults[0];
          
          // 如果有日期组件，设置日期
          if (!dateProcessed && (firstResult.start.get('year') || firstResult.start.get('month') || firstResult.start.get('day'))) {
            const chronoDate = firstResult.start.date();
            resultDate.setFullYear(chronoDate.getFullYear());
            resultDate.setMonth(chronoDate.getMonth());
            resultDate.setDate(chronoDate.getDate());
            dateProcessed = true;
          }
          
          // 如果有时间组件，设置时间
          if (!timeProcessed && firstResult.start.get('hour') !== undefined) {
            const hour = firstResult.start.get('hour');
            if (hour !== null) {
              resultDate.setHours(hour);
              
              const minute = firstResult.start.get('minute');
              if (minute !== null) {
                resultDate.setMinutes(minute);
              } else {
                resultDate.setMinutes(0);
              }
              
              resultDate.setSeconds(0);
              resultDate.setMilliseconds(0);
              timeProcessed = true;
            }
          }
        }
      } catch (chronoError) {
        console.error('Chrono解析错误:', chronoError);
      }
    }
    
    // 提取任务内容，在处理了日期时间后的文本上提取
    let content = extractTaskContent(processedText);
    
    // 最后清理，确保没有残留的pm/am等
    content = content.replace(/\s+(?:am|pm|a\.m\.|p\.m\.)\s*$/gi, '');
    
    // 清理残留的日期前缀
    content = content.replace(/\s+(at|on|in|by|from|to|until)\s*$/gi, '');
    
    // 清理可能残留的月份名称
    content = content.replace(new RegExp(`\\s+(${monthNames})\\s*$`, 'gi'), '');
    
    console.log('提取的任务内容:', content);
    
    return {
      date: resultDate,
      content: content
    };
  } catch (error) {
    console.error('解析快速笔记时出错:', error);
    return null;
  }
};

/**
 * NLP服务类 - 单例模式
 */
export class NLPService {
  private static instance: NLPService;
  
  private constructor() {
    console.log('NLPService 初始化');
  }
  
  /**
   * 获取NLPService实例
   */
  public static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * 解析自然语言输入
   * @param text 输入文本
   * @returns 解析结果
   */
  public parse(text: string): ParsedResult {
    console.log('NLPService.parse 被调用，输入:', text);
    try {
      // 预处理常见的错误格式
      // 处理"havea"应该是"have a"
      text = text.replace(/\b(have|has)(a|an)\b/gi, '$1 $2');
      
      // 处理无空格的日期前缀，如"atmay18th" -> "at may 18th"
      const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
      const datePrepositions = 'at|on|in|by|from|to|until';
      text = text.replace(new RegExp(`\\b(${datePrepositions})(${monthNames})`, 'gi'), '$1 $2');
      
      // 处理无空格的月份+日期，如"may18th" -> "may 18th"
      text = text.replace(new RegExp(`\\b(${monthNames})(\\d{1,2})(st|nd|rd|th)?\\b`, 'gi'), '$1 $2$3');
      
      const result = parseQuickNote(text);
      console.log('解析结果:', result);
      
      if (!result) {
        return { date: null, content: text };
      }
      
      // 检查内容是否包含"__PHRASE"标记
      if (result.content && result.content.includes('__PHRASE')) {
        console.log('警告: 解析结果中仍包含词组标记，尝试修复');
        
        // 重新尝试提取任务内容
        const fixedContent = extractTaskContent(text);
        if (fixedContent && !fixedContent.includes('__PHRASE')) {
          console.log('修复后的内容:', fixedContent);
          return { date: result.date, content: fixedContent };
        }
      }
      
      // 检查内容是否包含未处理的日期前缀和月份名称残留
      if (result.content) {
        let cleanedContent = result.content;
        // 清理残留的日期前缀
        cleanedContent = cleanedContent.replace(/\s+(at|on|in|by|from|to|until)\s*$/gi, '');
        // 清理可能残留的月份名称
        cleanedContent = cleanedContent.replace(new RegExp(`\\s+(${monthNames})\\s*$`, 'gi'), '');
        
        if (cleanedContent !== result.content) {
          console.log('清理后的内容:', cleanedContent);
          return { date: result.date, content: cleanedContent };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error in NLPService.parse:', error);
      return { date: null, content: text };
    }
  }

  /**
   * 测试指定语言的日期和任务识别
   * @param testCases 测试用例数组
   * @param lang 语言代码
   * @returns 测试结果
   */
  public testLanguage(testCases: string[], lang: SupportedLanguage): {input: string, result: ParsedResult}[] {
    console.log(`[NLP] 测试 ${lang} 语言的日期和任务识别能力`);
    
    return testCases.map(input => {
      console.log(`[NLP] 测试输入: "${input}"`);
      const result = this.parse(input);
      console.log(`[NLP] 识别结果:`, result);
      return { input, result };
    });
  }

  /**
   * 运行所有语言的测试用例
   * @returns 测试结果
   */
  public runTests(): {[lang: string]: {input: string, result: ParsedResult}[]} {
    const testCases = {
      en: [
        'Meet John at 3pm tomorrow',
        'Doctor appointment at 2:30pm on May 18th',
        'Lunch with team next Friday at noon',
        'Review documents by 5pm today',
        'Submit report in 3 days',
        'Team meeting every Monday at 10am',
        'Call mom on her birthday June 15',
        'Vacation starts two weeks from now',
        'Pick up package at 11am tomorrow morning',
        'Dentist appointment next month on the 10th'
      ],
      zh: [
        '明天下午三点见小王',
        '5月18日下午2:30医生预约',
        '下周五中午和团队吃午饭',
        '今天下午5点前审核文件',
        '三天后提交报告',
        '每周一上午10点团队会议',
        '6月15日妈妈生日打电话',
        '两周后开始休假',
        '明天上午11点取包裹',
        '下个月10号牙医预约'
      ],
      ko: [
        '내일 오후 3시에 존을 만나기',
        '5월 18일 오후 2시 30분에 의사 약속',
        '다음 금요일 정오에 팀과 점심',
        '오늘 오후 5시까지 문서 검토',
        '3일 후 보고서 제출',
        '매주 월요일 오전 10시 팀 회의',
        '6월 15일 어머니 생일에 전화하기',
        '지금부터 2주 후 휴가 시작',
        '내일 오전 11시에 소포 수령',
        '다음 달 10일에 치과 예약'
      ],
      ja: [
        '明日の午後3時にジョンに会う',
        '5月18日午後2時30分に医者の予約',
        '来週の金曜日の正午にチームとランチ',
        '今日の午後5時までに書類を確認する',
        '3日後にレポートを提出する',
        '毎週月曜日の午前10時にチーム会議',
        '6月15日の母の誕生日に電話する',
        '今から2週間後に休暇が始まる',
        '明日の午前11時に小包を受け取る',
        '来月の10日に歯医者の予約'
      ]
    };
    
    const results: {[lang: string]: {input: string, result: ParsedResult}[]} = {};
    
    for (const [lang, cases] of Object.entries(testCases)) {
      results[lang] = this.testLanguage(cases, lang as SupportedLanguage);
    }
    
    return results;
  }
  
  /**
   * 测试特定输入的识别结果
   * @param input 输入文本
   * @returns 识别结果
   */
  public testInput(input: string): ParsedResult {
    console.log(`[NLP] 测试单个输入: "${input}"`);
    const result = this.parse(input);
    console.log(`[NLP] 识别结果:`, result);
    
    // 输出识别的语言
    const lang = detectLanguage(input);
    console.log(`[NLP] 检测到语言: ${lang}`);
    
    // 输出最终分离出的任务内容
    const content = extractTaskContent(input);
    console.log(`[NLP] 提取的任务内容: "${content}"`);
    
    return result;
  }
}

/**
 * 导出单例实例
 */
export const nlpService = NLPService.getInstance();

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'en' | 'zh' | 'ja' | 'ko';

// 定义全局星期几映射表
const zhWeekdayMap: Record<string, number> = {
  '日': 0, '天': 0, '週日': 0, '周日': 0, '星期日': 0, '星期天': 0,
  '一': 1, '週一': 1, '周一': 1, '星期一': 1,
  '二': 2, '週二': 2, '周二': 2, '星期二': 2,
  '三': 3, '週三': 3, '周三': 3, '星期三': 3,
  '四': 4, '週四': 4, '周四': 4, '星期四': 4,
  '五': 5, '週五': 5, '周五': 5, '星期五': 5,
  '六': 6, '週六': 6, '周六': 6, '星期六': 6
};

/**
 * 移除英文日期时间表达式
 * @param text 输入文本
 * @returns 处理后的文本
 */
function removeEnglishDateTimeExpressions(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // 移除日期前缀
  result = result.replace(/\b(at|on|in|by|from|to|until)\s+/gi, '');
  
  // 移除星期几
  result = result.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun)\b/gi, '');
  
  // 移除月份
  result = result.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi, '');
  
  // 移除年份
  result = result.replace(/\b(20\d{2})\b/g, '');
  
  // 移除日期数字和后缀
  result = result.replace(/\b\d{1,2}(st|nd|rd|th)?\b/g, '');
  
  // 移除时间表达式
  result = result.replace(/\b\d{1,2}:\d{2}\b/g, '');
  result = result.replace(/\b\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)\b/gi, '');
  
  // 移除相对日期表达
  result = result.replace(/\b(today|tomorrow|yesterday|next day|last day|day after tomorrow)\b/gi, '');
  result = result.replace(/\b(this|next|last|coming|previous)\s+(day|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  result = result.replace(/\b(in|after|within|for)\s+\d+\s+(day|days|week|weeks|month|months|year|years)\b/gi, '');
  result = result.replace(/\b\d+\s+(day|days|week|weeks|month|months|year|years)\s+(from|after|before|ago)\b/gi, '');
  
  // 移除时间段词汇
  result = result.replace(/\b(morning|afternoon|evening|night|noon|midnight)\b/gi, '');
  
  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * 移除中文日期时间表达式
 * @param text 输入文本
 * @returns 处理后的文本
 */
function removeChineseDateTimeExpressions(text: string): string {
  if (!text) return '';
  
  console.log(`[Debug] removeChineseDateTimeExpressions 输入: "${text}"`);
  
  let result = text;
  
  // 使用更精确的模式匹配日期和时间表达式
  
  // 1. 先匹配完整的日期表达式（但不包括时间部分）
  const fullDatePattern = /(下下[个個]?[周週星期]|下[个個]?[周週星期]|[周週星期礼拜禮拜])[一二三四五六日天]|(下[个個]?月|[上个個]?月|本月)(?:\d{1,2}|[一二三四五六七八九十]{1,2})?(?:号|號|日)?/;
  
  // 针对"下个月18号生日"这种情况，先提取并保存整个日期表达式
  const dateMatch = result.match(fullDatePattern);
  if (dateMatch && dateMatch[0]) {
    console.log('匹配到完整日期表达式:', dateMatch[0]);
    // 将整个日期表达式替换为空
    result = result.replace(dateMatch[0], '');
    console.log(`[Debug] 移除日期表达式后的文本: "${result}"`);
  } else {
    // 如果没有匹配到完整表达式，则逐步处理
    
    // 移除星期几表达式，注意保留前面的动词
    const beforeWeekday = result;
    result = result.replace(/[周週星期礼拜禮拜][一二三四五六日天]/g, '');
    if (beforeWeekday !== result) {
      console.log(`[Debug] 移除星期表达式后: "${result}"`);
    }
    
    // 特别处理"下周/下週"等表达式，确保只移除日期前缀
    const beforeNextWeek = result;
    result = result.replace(/下下[个個]?[周週星期]/g, ''); // 先处理"下下周"
    if (beforeNextWeek !== result) {
      console.log(`[Debug] 移除'下下周'后: "${result}"`);
    }
    
    const beforeThisWeek = result;
    result = result.replace(/下[个個]?[周週星期]/g, ''); // 再处理"下周"
    if (beforeThisWeek !== result) {
      console.log(`[Debug] 移除'下周'后: "${result}"`);
    }
    
    // 移除完整的相对日期表达式 - 但保留可能的时间表达式
    const beforeNextWeekday = result;
    result = result.replace(/下下[个個]?[周週星期][一二三四五六日天](?!.*?[点點时時])/g, '');
    if (beforeNextWeekday !== result) {
      console.log(`[Debug] 移除'下下周X'后: "${result}"`);
    }
    
    const beforeThisWeekday = result;
    result = result.replace(/下[个個]?[周週星期][一二三四五六日天](?!.*?[点點时時])/g, '');
    if (beforeThisWeekday !== result) {
      console.log(`[Debug] 移除'下周X'后: "${result}"`);
    }
    
    // 移除月份表达式
    result = result.replace(/(下|下个|下個|上|上个|上個|这|這|本)[个個]?月(?:\d{1,2}|[一二三四五六七八九十]{1,2})?(?:号|號|日)?/g, '');
    
    // 移除相对日期表达式
    result = result.replace(/(今|明|后|昨|前)[天日](?!.*?[点點时時])/g, '');
    result = result.replace(/(下下|下|下个|下個|下一|今|本|这|這)(?:周|週|星期|月|礼拜|禮拜|年)(?!.*?[点點时時])/g, '');
    result = result.replace(/(上|上个|上個|上一|前|前个|前個)(?:周|週|星期|月|礼拜|禮拜|年)(?!.*?[点點时時])/g, '');
  }
  
  // 移除日期表达式
  result = result.replace(/(\d{2,4}年)?(\d{1,2}月)(\d{1,2})(日|号)/g, '');
  result = result.replace(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g, '');
  result = result.replace(/(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/g, '');
  
  // 移除日期数字 - 单独处理以避免误删内容中的数字
  result = result.replace(/(?<=\s)(\d{1,2})(?:号|日)(?=\s|$)/g, '');
  result = result.replace(/(?<=\s)([一二三四五六七八九十]{1,2})(?:号|日)(?=\s|$)/g, '');
  
  // 移除数字+时间单位的表达式
  result = result.replace(/(\d+)个?(?:月|周|星期|週|礼拜|禮拜|小时|小時)(?:后|後|之后|之後|以后|以後)/g, '');
  result = result.replace(/(\d+)[天日](?:后|後|之后|之後|以后|以後)/g, '');
  
  // 注意：不要删除时间表达式，这样parseQuickNote可以处理它们
  // result = result.replace(/(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?\s*(\d+|[一二三四五六七八九十]+)[点點时時](\d+|[一二三四五六七八九十半刻]+)?[分]?/g, '');
  
  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim();
  
  console.log(`[Debug] removeChineseDateTimeExpressions 输出: "${result}"`);
  return result;
}

/**
 * 移除韩文日期时间表达式
 * @param text 输入文本
 * @returns 处理后的文本
 */
function removeKoreanDateTimeExpressions(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // 移除星期几表达式
  result = result.replace(/[월화수목금토일]요일/g, '');
  
  // 移除日期表达式
  result = result.replace(/(\d{2,4})년?\s*(\d{1,2})월\s*(\d{1,2})일/g, '');
  
  // 移除时间表达式
  result = result.replace(/(\d{1,2})시\s*(\d{1,2})?분?/g, '');
  result = result.replace(/(오전|오후)?\s*(\d{1,2})시\s*(\d{1,2})?분?/g, '');
  
  // 移除相对日期表达式
  result = result.replace(/(오늘|내일|모레|어제)/g, '');
  result = result.replace(/(다음|이번|지난)\s*[주월년]/g, '');
  result = result.replace(/(다음달|이번달|지난달)/g, '');
  result = result.replace(/(\d+)[일주월년]\s*(?:후|이후|전)/g, '');
  
  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

// 增强复合时间表达式的处理能力
function parseComplexTimeExpression(text: string, resultDate: Date, lang: 'en' | 'zh' | 'ja' | 'ko'): { date: Date, processed: boolean } {
  console.log('尝试解析复合时间表达式:', text);
  const newDate = new Date(resultDate);
  let dateProcessed = false;
  let timeProcessed = false;

  // 检查是否已经处理过下周X的表达式
  const hasNextWeekExpression = /下[个個]?[周週]([一二三四五六日天])/.test(text);
  
  // 检查是否有"下周三"或"下下周三"这样的表达式以及时间表示
  if (lang === 'zh' && !hasNextWeekExpression && 
      (/下下(?:个|個)?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/.test(text) || 
       /下(?:个|個)?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/.test(text))) {
    
    console.log(`[Debug Complex] 检测到复合日期表达式，原文本: "${text}"`);
    
    // 检查是否包含时间表达式
    const timeMatch = text.match(/(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?\s*(\d+|[一二三四五六七八九十两]+)[点點时時](?:(\d+|[一二三四五六七八九十两半刻]+)[分]?)?/);

    if (timeMatch) {
      // ... existing time processing code ...
    }
  }

  // ... rest of the original function code ...

  return { 
    date: newDate, 
    processed: dateProcessed || timeProcessed 
  };
}

function parseNextWeekdayFromToday(targetWeekday: number): Date {
  const today = new Date(); // 使用当前日期
  today.setHours(0, 0, 0, 0); // 重置时间为0点
  const todayWeekday = today.getDay() || 7; // 周日为 7

  const adjustedToday = todayWeekday === 0 ? 7 : todayWeekday;
  const daysToAdd = targetWeekday + 7 - adjustedToday;

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd);

  return targetDate;
}

// 示例用法
console.log("调用前, targetWeekday=", 1);
const dateResult1 = parseNextWeekdayFromToday(1);
console.log("调用后, dateResult=", dateResult1.toISOString());

console.log("调用前, targetWeekday=", 5);
const dateResult5 = parseNextWeekdayFromToday(5);
console.log("调用后, dateResult=", dateResult5.toISOString());

console.log("调用前, targetWeekday=", 6);
const dateResult6 = parseNextWeekdayFromToday(6);
console.log("调用后, dateResult=", dateResult6.toISOString());