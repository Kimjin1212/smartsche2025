// 测试"下周六七点上课"这样的表达式
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parseDate(text) {
  console.log(`解析文本: "${text}"`);
  
  // 检测下周几的表达式
  const weekdayMatch = text.match(/下[个個]?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/);
  if (weekdayMatch && weekdayMatch[1]) {
    console.log(`匹配到下周星期: ${weekdayMatch[1]}`);
    
    // 中文星期几映射到数字
    const zhWeekdayMap = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
    };
    
    const targetDay = zhWeekdayMap[weekdayMatch[1]];
    console.log(`目标星期几: ${targetDay}`);
    
    // 获取当前日期并重置时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`今天: ${today.toLocaleDateString()}, 星期${dayNames[today.getDay()]}`);
    
    // 方法1: 当前算法 (有问题)
    const dayOfWeek = today.getDay();
    let daysToAdd1 = (targetDay - dayOfWeek + 7) % 7;
    if (daysToAdd1 === 0) {
      daysToAdd1 = 7;
    }
    const nextWeekDate1 = new Date(today);
    nextWeekDate1.setDate(today.getDate() + daysToAdd1);
    console.log(`方法1结果 (当前算法): ${nextWeekDate1.toLocaleDateString()}, 星期${dayNames[nextWeekDate1.getDay()]}`);
    
    // 方法2: 修正算法
    let daysToAdd2 = targetDay - dayOfWeek;
    if (daysToAdd2 <= 0) {
      daysToAdd2 += 7;
    }
    daysToAdd2 += 7; // 再加7天，确保是下周
    const nextWeekDate2 = new Date(today);
    nextWeekDate2.setDate(today.getDate() + daysToAdd2);
    console.log(`方法2结果 (修正算法): ${nextWeekDate2.toLocaleDateString()}, 星期${dayNames[nextWeekDate2.getDay()]}`);
    
    return {
      method1: nextWeekDate1,
      method2: nextWeekDate2
    };
  } else {
    console.log("没有匹配到下周星期表达式");
    return null;
  }
}

// 测试各种表达式
const testCases = [
  "下周六七点上课",
  "下周日晚上八点回妈妈家吃饭",
  "下周一开会",
  "下星期二去医院",
  "下个星期三参加活动",
  "下礼拜四考试",
  "下个礼拜五提交报告"
];

testCases.forEach((testCase, index) => {
  console.log(`\n测试 #${index + 1}: ${testCase}`);
  parseDate(testCase);
});

// 显示差异
console.log("\n\n== 方法比较 ==");
testCases.forEach((testCase, index) => {
  const result = parseDate(testCase);
  if (result) {
    const diff = Math.round((result.method2 - result.method1) / (1000 * 60 * 60 * 24));
    console.log(`测试 #${index + 1}: 方法2比方法1晚 ${diff} 天`);
  }
}); 