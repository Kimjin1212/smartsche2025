import { nlpService, SupportedLanguage } from '../services/nlpService';

/**
 * NLP测试结果接口
 */
interface NLPTestResult {
  input: string;
  detectedLanguage: SupportedLanguage;
  extractedContent: string;
  date: string | null;
  success: boolean;
}

/**
 * NLP测试工具类
 */
export class NLPTester {
  
  /**
   * 测试单个输入
   * @param input 测试输入文本
   * @returns 测试结果
   */
  public static testInput(input: string): NLPTestResult {
    console.log(`开始测试输入: "${input}"`);
    
    try {
      const result = nlpService.testInput(input);
      
      return {
        input,
        detectedLanguage: result.content ? (nlpService as any).detectLanguage(input) as SupportedLanguage : 'en',
        extractedContent: result.content || '',
        date: result.date ? result.date.toLocaleString() : null,
        success: !!result.date
      };
    } catch (error) {
      console.error(`测试输入 "${input}" 时出错:`, error);
      
      return {
        input,
        detectedLanguage: 'en',
        extractedContent: '',
        date: null,
        success: false
      };
    }
  }
  
  /**
   * 批量测试多个输入
   * @param inputs 测试输入数组
   * @returns 测试结果数组
   */
  public static testMultiple(inputs: string[]): NLPTestResult[] {
    console.log(`开始批量测试 ${inputs.length} 条输入`);
    
    return inputs.map(input => this.testInput(input));
  }
  
  /**
   * 测试所有语言
   * @returns 测试结果
   */
  public static testAllLanguages(): {[lang: string]: NLPTestResult[]} {
    console.log(`开始测试所有语言`);
    
    const testResults = nlpService.runTests();
    const formattedResults: {[lang: string]: NLPTestResult[]} = {};
    
    for (const [lang, results] of Object.entries(testResults)) {
      formattedResults[lang] = results.map(({ input, result }) => ({
        input,
        detectedLanguage: lang as SupportedLanguage,
        extractedContent: result.content || '',
        date: result.date ? result.date.toLocaleString() : null,
        success: !!result.date
      }));
    }
    
    return formattedResults;
  }
  
  /**
   * 将测试结果格式化为人类可读的字符串
   * @param results 测试结果
   * @returns 格式化后的字符串
   */
  public static formatResults(results: NLPTestResult | NLPTestResult[] | {[lang: string]: NLPTestResult[]}): string {
    if (!results) {
      return 'No results to display';
    }
    
    // 单个测试结果
    if (!Array.isArray(results) && typeof results === 'object' && 'input' in results) {
      return this.formatSingleResult(results as NLPTestResult);
    }
    
    // 数组测试结果
    if (Array.isArray(results)) {
      return results.map(result => this.formatSingleResult(result)).join('\n\n');
    }
    
    // 按语言分组的测试结果
    let output = '';
    for (const [lang, langResults] of Object.entries(results)) {
      output += `==== ${lang.toUpperCase()} LANGUAGE TESTS ====\n\n`;
      output += langResults.map(result => this.formatSingleResult(result)).join('\n\n');
      output += '\n\n';
    }
    
    return output;
  }
  
  /**
   * 格式化单个测试结果
   * @param result 测试结果
   * @returns 格式化后的字符串
   */
  private static formatSingleResult(result: NLPTestResult): string {
    return [
      `输入: "${result.input}"`,
      `检测语言: ${result.detectedLanguage}`,
      `提取内容: "${result.extractedContent}"`,
      `日期: ${result.date || 'None'}`,
      `结果: ${result.success ? '✅ 成功' : '❌ 失败'}`
    ].join('\n');
  }
}

// 示例测试用例 - 可以在应用中调用测试
export const runQuickTest = () => {
  // 多语言测试用例
  const testInputs = [
    // 英文测试用例
    "Meet John at 2pm tomorrow",
    "Have dinner with family at 7pm on Friday",
    "Doctor appointment atmay18th 3pm",
    "Submit report in 3 weeks",
    
    // 中文测试用例
    "明天下午2点见小王",
    "周五晚上7点和家人吃饭",
    "5月18日下午3点医生预约",
    "三周后提交报告",
    "下个月10号下午3点开会",
    
    // 韩文测试用例
    "내일 오후 2시에 존 만나기",
    "금요일 저녁 7시에 가족과 저녁식사",
    "5월 18일 오후 3시 의사 약속",
    "3주 후 보고서 제출",
    
    // 日文测试用例
    "明日の午後2時にジョンに会う",
    "金曜日の午後7時に家族と夕食",
    "5月18日午後3時に医者の予約",
    "3週間後にレポートを提出"
  ];
  
  // 执行测试
  const results = NLPTester.testMultiple(testInputs);
  
  // 格式化并返回结果
  return NLPTester.formatResults(results);
};

// 导出默认实例
export default NLPTester; 