import * as chrono from 'chrono-node';

interface ParsedResult {
  content: string;
  dateTime: Date | null;
  location: string | null;
  language: 'zh' | 'en' | 'ja' | 'ko';
}

export class NLPService {
  private static instance: NLPService;
  
  private constructor() {}
  
  public static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  private detectLanguage(text: string): 'zh' | 'en' | 'ja' | 'ko' {
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

  private convertKoreanToChinese(text: string): string {
    // 韩语时间转换词典
    const timeDict: { [key: string]: string } = {
      '내일': '明天',
      '오후': '下午',
      '오전': '上午',
      '아침': '早上',
      '저녁': '晚上',
      '밤': '晚上',
      '시': '点',
      '분': '分',
      '병원': '医院',
      '가기': '去',
      '만나기': '见面',
      '수업': '上课',
      '식사': '吃饭',
      '미팅': '会议'
    };

    let convertedText = text;
    for (const [ko, zh] of Object.entries(timeDict)) {
      convertedText = convertedText.replace(new RegExp(ko, 'g'), zh);
    }
    return convertedText;
  }

  public parse(text: string): ParsedResult {
    try {
      const language = this.detectLanguage(text);
      let processedText = text;

      // 如果是韩语，先转换为中文
      if (language === 'ko') {
        processedText = this.convertKoreanToChinese(text);
      }

      // 使用 chrono-node 解析时间
      const parsedDate = chrono.parseDate(processedText);
      
      // 提取内容
      let content = processedText;
      if (parsedDate) {
        // 移除时间相关文本
        const timeText = chrono.parse(processedText)[0]?.text || '';
        content = content.replace(timeText, '').trim();
      }

      // 提取地点
      let location = null;
      const locationPatterns = [
        /在(.+?)(?:开会|见面|上课|吃饭|见面)/,
        /到(.+?)(?:去|来|见)/,
        /在(.+?)(?:等|见)/
      ];
      
      for (const pattern of locationPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          location = match[1].trim();
          content = content.replace(match[0], '').trim();
          break;
        }
      }

      return {
        content,
        dateTime: parsedDate,
        location,
        language
      };
    } catch (error) {
      console.error('Error parsing text:', error);
      return {
        content: text,
        dateTime: null,
        location: null,
        language: this.detectLanguage(text)
      };
    }
  }
} 