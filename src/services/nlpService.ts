import * as chrono from 'chrono-node';
import nlp from 'compromise';

interface ParsedResult {
  date: Date | null;
  content: string;
}

/**
 * 检测输入文本的语言
 * @param text 输入文本
 * @returns 检测到的语言代码 ('en', 'zh', 'ja', 'ko')
 */
function detectLanguage(text: string): 'en' | 'zh' | 'ja' | 'ko' {
  // 检测中文字符
  if (/[\u4e00-\u9fa5]/.test(text)) {
    return 'zh';
  }
  // 检测日文字符
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'ja';
  }
  // 检测韩文字符
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) {
    return 'ko';
  }
  // 默认为英文
  return 'en';
}

/**
 * 时间正则表达式模式
 */
const timePatterns = {
  // 英文时间模式
  en: {
    // 标准时间格式 (1:30pm, 13:30)
    standard: /\b([0-9]{1,2})\s*(?::|：)?\s*([0-9]{0,2})?\s*([aApP][mM])?\b/,
    // 上午/下午标记
    am: /\b[aA][mM]\b|\bmorning\b/,
    pm: /\b[pP][mM]\b|\bafternoon\b|\bevening\b|\bnight\b/,
    // 相对日期
    today: /\btoday\b/,
    tomorrow: /\btomorrow\b/,
    dayAfterTomorrow: /\bday\s+after\s+tomorrow\b/,
  },
  // 中文时间模式
  zh: {
    // 标准时间格式 (1点30分, 13:30)
    standard: /([0-9０-９一二三四五六七八九十]+)[点點时時](?:([0-9０-９]{1,2}|[一二三四五六七八九十]+)[分]?)?/,
    // 上午/下午标记
    am: /上午|早上|早晨|凌晨/,
    pm: /下午|晚上|傍晚|晚间/,
    // 相对日期
    today: /今天|今日/,
    tomorrow: /明天|明日/,
    dayAfterTomorrow: /后天|後天/,
  },
  // 日文时间模式
  ja: {
    // 标准时间格式 (1時30分, 13:30)
    standard: /([0-9０-９一二三四五六七八九十]+)[時时](?:([0-9０-９]{1,2}|[一二三四五六七八九十]+)[分]?)?/,
    // 上午/下午标记
    am: /午前|朝|早朝/,
    pm: /午後|夕方|夜|晩/,
    // 相对日期
    today: /今日|本日/,
    tomorrow: /明日|あした/,
    dayAfterTomorrow: /明後日|あさって/,
  },
  // 韩文时间模式
  ko: {
    // 标准时间格式 (1시 30분, 13:30)
    standard: /([0-9０-９일이삼사오육칠팔구십]+)[시](?:([0-9０-９]{1,2}|[일이삼사오육칠팔구십]+)[분]?)?/,
    // 上午/下午标记
    am: /오전|아침/,
    pm: /오후|저녁|밤/,
    // 相对日期
    today: /오늘/,
    tomorrow: /내일/,
    dayAfterTomorrow: /모레/,
  }
};

/**
 * 数字映射（中日韩文字数字到阿拉伯数字）
 */
const numberMappings: Record<'zh' | 'ja' | 'ko', Record<string, number>> = {
  // 中文数字映射
  zh: {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '０': 0, '１': 1, '２': 2, '３': 3, '４': 4, '５': 5, '６': 6, '７': 7, '８': 8, '９': 9
  },
  // 日文数字映射
  ja: {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '０': 0, '１': 1, '２': 2, '３': 3, '４': 4, '５': 5, '６': 6, '７': 7, '８': 8, '９': 9
  },
  // 韩文数字映射
  ko: {
    '일': 1, '이': 2, '삼': 3, '사': 4, '오': 5, '육': 6, '칠': 7, '팔': 8, '구': 9, '십': 10,
    '０': 0, '１': 1, '２': 2, '３': 3, '４': 4, '５': 5, '６': 6, '７': 7, '８': 8, '９': 9
  }
};

/**
 * 将字符串形式的数字（包括中日韩文字数字）转换为阿拉伯数字
 * @param numStr 数字字符串
 * @param lang 语言
 * @returns 阿拉伯数字
 */
function parseNumberString(numStr: string, lang: 'en' | 'zh' | 'ja' | 'ko'): number {
  if (lang === 'en' || !numStr) {
    return parseInt(numStr) || 0;
  }

  const mapping = numberMappings[lang];
  
  // 如果是单个字符并且在映射表中
  if (numStr.length === 1 && mapping[numStr]) {
    return mapping[numStr];
  }
  
  // 尝试解析十位数
  if (numStr.includes('十') || numStr.includes('십')) {
    if (numStr === '十' || numStr === '십') return 10;
    
    const parts = numStr.split(/十|십/);
    const tens = parts[0] ? parseNumberString(parts[0], lang) : 1;
    const ones = parts[1] ? parseNumberString(parts[1], lang) : 0;
    return tens * 10 + ones;
  }
  
  // 尝试直接解析数字
  try {
    return parseInt(numStr) || 0;
  } catch (error) {
    console.error('Error parsing number:', error);
    return 0;
  }
}

/**
 * 解析快速笔记
 * @param text 输入文本
 * @returns 解析结果，包含日期和内容
 */
const parseQuickNote = (text: string): { date: Date, content: string } | null => {
  try {
    console.log('解析输入:', text);
    
    // 步骤1: 获取当前参考时间和检测语言
    const now = new Date();
    const lang = detectLanguage(text);
    console.log('检测到语言:', lang);
    
    // 步骤2: 解析日期（今天、明天、后天）
    let resultDate = new Date(now);
    const patterns = timePatterns[lang];
    
    // 重置时间部分
    resultDate.setHours(0, 0, 0, 0);
    
    // 检查相对日期
    if (patterns.tomorrow.test(text)) {
      // 明天
      resultDate.setDate(resultDate.getDate() + 1);
      console.log('设置日期为明天:', resultDate);
    } else if (patterns.dayAfterTomorrow.test(text)) {
      // 后天
      resultDate.setDate(resultDate.getDate() + 2);
      console.log('设置日期为后天:', resultDate);
    } else if (patterns.today.test(text)) {
      // 今天 - 已设置为当天，无需操作
      console.log('设置日期为今天:', resultDate);
    }
    
    // 步骤3: 解析时间
    let hours = 0;
    let minutes = 0;
    let isPM = false;
    
    // 检查上午/下午标记
    if (patterns.pm.test(text)) {
      isPM = true;
      console.log('检测到下午标记');
    } else if (patterns.am.test(text)) {
      isPM = false;
      console.log('检测到上午标记');
    }
    
    // 匹配时间格式
    const timeMatch = text.match(patterns.standard);
    if (timeMatch) {
      console.log('匹配到时间:', timeMatch[0]);
      
      // 解析小时
      if (timeMatch[1]) {
        hours = parseNumberString(timeMatch[1], lang);
        console.log('解析的小时:', hours);
      }
      
      // 解析分钟
      if (timeMatch[2]) {
        minutes = parseNumberString(timeMatch[2], lang);
        console.log('解析的分钟:', minutes);
      }
      
      // 根据上下文判断上午/下午
      if (isPM && hours < 12) {
        hours += 12;
        console.log('转换为24小时制:', hours);
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      // 如果没有明确的时间，尝试使用chrono作为备选
      try {
        const chronoResults = chrono.parse(text, now, { forwardDate: true });
        if (chronoResults.length > 0) {
          const chronoDate = chronoResults[0].start.date();
          hours = chronoDate.getHours();
          minutes = chronoDate.getMinutes();
          
          // 保持日期部分不变，只使用chrono解析的时间
          resultDate.setHours(hours, minutes, 0, 0);
          console.log('使用chrono解析的时间:', hours, ':', minutes);
          
          // 如果chrono也解析了日期，使用它来更新resultDate
          if (chronoResults[0].start.isCertain('day')) {
            resultDate = chronoDate;
            console.log('使用chrono解析的日期:', resultDate);
          }
        }
      } catch (e) {
        console.error('Chrono解析失败:', e);
      }
    }
    
    // 设置解析出的时间
    resultDate.setHours(hours, minutes, 0, 0);
    console.log('最终解析的日期时间:', resultDate);
    
    // 步骤4: 提取内容
    let content = text;
    
    // 移除时间表达式
    if (timeMatch) {
      content = content.replace(timeMatch[0], '');
    }
    
    // 移除日期表达式
    content = content
      .replace(patterns.today, '')
      .replace(patterns.tomorrow, '')
      .replace(patterns.dayAfterTomorrow, '')
      .replace(patterns.am, '')
      .replace(patterns.pm, '')
      .trim();
    
    // 如果是英文，使用compromise提取关键词
    if (lang === 'en') {
      try {
        const doc = nlp(content);
        const terms = doc.terms().out('array');
        // 仅当结果不为空时使用
        if (terms.length > 0) {
          content = terms.join(' ');
        }
      } catch (e) {
        console.error('Compromise处理失败:', e);
      }
    }
    
    console.log('提取的内容:', content);
    
    return {
      date: resultDate,
      content: content.trim()
    };
  } catch (error) {
    console.error('Error parsing quick note:', error);
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
      const result = parseQuickNote(text);
      console.log('解析结果:', result);
      
      if (!result) {
        return { date: null, content: text };
      }
      return result;
    } catch (error) {
      console.error('Error in NLPService.parse:', error);
      return { date: null, content: text };
    }
  }
} 