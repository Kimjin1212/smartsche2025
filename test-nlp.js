// 测试中文日期识别功能
try {
  function removeChineseDateTimeExpressions(text) {
    if (!text) return '';
    
    let result = text;
    
    // 使用更精确的模式匹配日期和时间表达式
    
    // 1. 先匹配完整的时间日期表达式
    const fullDateTimePattern = /(下下[个個]?[周週星期]|下[个個]?[周週星期]|[周週星期礼拜禮拜])[一二三四五六日天]?(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?(\s*)?(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?(\s*)?([一二三四五六七八九十]+)?[点點时時]([一二三四五六七八九十半刻]+)?[分]?/;
    
    // 针对"下周一晚上七点线上会议"这种情况，先提取并保存整个日期时间表达式
    const dateTimeMatch = result.match(fullDateTimePattern);
    if (dateTimeMatch && dateTimeMatch[0]) {
      process.stdout.write('匹配到完整日期时间表达式: ' + dateTimeMatch[0] + '\n');
      // 将整个日期时间表达式替换为空
      result = result.replace(dateTimeMatch[0], '');
    } else {
      // 如果没有匹配到完整表达式，则逐步处理
      process.stdout.write('未匹配到完整表达式，使用逐步处理\n');
      
      // 移除星期几表达式
      result = result.replace(/[周週星期礼拜禮拜][一二三四五六日天]/g, '');
      
      // 特别处理"下周/下週"等表达式
      result = result.replace(/下下[个個]?[周週星期]/g, ''); // 先处理"下下周"
      result = result.replace(/下[个個]?[周週星期]/g, ''); // 再处理"下周"
      
      // 移除完整的相对日期表达式
      result = result.replace(/下下[个個]?[周週星期][一二三四五六日天]/g, '');
      result = result.replace(/下[个個]?[周週星期][一二三四五六日天]/g, '');
      
      // 移除相对日期表达式
      result = result.replace(/(今|明|后|昨|前)[天日]/g, '');
      result = result.replace(/(下下|下|下个|下個|下一|今|本|这|這)(?:周|週|星期|月|礼拜|禮拜|年)/g, '');
      result = result.replace(/(上|上个|上個|上一|前|前个|前個)(?:周|週|星期|月|礼拜|禮拜|年)/g, '');
      
      // 移除时间表达式 - 允许重复的时间词汇（如"晚上晚上七点"）
      result = result.replace(/(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?\s*(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?\s*(\d+|[一二三四五六七八九十]+)[点點时時](\d+|[一二三四五六七八九十半刻]+)?[分]?/g, '');
    }
    
    // 移除日期表达式
    result = result.replace(/(\d{2,4}年)?(\d{1,2}月)(\d{1,2})(日|号)/g, '');
    result = result.replace(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g, '');
    result = result.replace(/(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/g, '');
    
    // 移除数字+时间单位的表达式
    result = result.replace(/(\d+)个?(?:月|周|星期|週|礼拜|禮拜|小时|小時)(?:后|後|之后|之後|以后|以後)/g, '');
    result = result.replace(/(\d+)[天日](?:后|後|之后|之後|以后|以後)/g, '');
    
    // 清理多余空格
    result = result.replace(/\s+/g, ' ').trim();
    
    return result;
  }

  const testCases = [
    '下周六晚上八点回妈妈家吃饭',
    '明天下午三点去超市购物',
    '后天上午十点半看牙医',
    '周五晚上七点参加同学聚会',
    '下个月十五号下午会议',
    '今晚八点看电影',
    '下周一晚上七点会议',
    '下会议',
    '下周一下午开会',
    '下周一晚上晚上七点线上会议',
    '下线上会议',
    '下下周一下午会议',
    '下个月18号生日',
    '下个月十八号生日',
    '5月18号生日',
    '下个月十八号下午三点开会',
    '下周二早上八点考试',
    '下下周二早上考试',
    '下周三晚上七点约会',
    '下下周三晚上约会'
  ];

  process.stdout.write('测试中文日期时间表达式提取：\n');
  process.stdout.write('-----------------------------------------\n');

  testCases.forEach(testCase => {
    process.stdout.write('原始输入: ' + testCase + '\n');
    const processed = removeChineseDateTimeExpressions(testCase);
    process.stdout.write('处理后  : ' + processed + '\n');
    process.stdout.write('-----------------------------------------\n');
  });
} catch (error) {
  process.stderr.write('测试过程中出现错误: ' + error.toString() + '\n');
} 