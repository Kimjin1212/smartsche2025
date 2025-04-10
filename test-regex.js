// 测试nlpService.ts中的正则表达式
const testCases = [
  "下周六七点上课",
  "下周日晚上八点回妈妈家吃饭",
  "下周一开会",
  "下星期二去医院",
  "下个星期三参加活动",
  "下礼拜四考试",
  "下个礼拜五提交报告",
  "周六七点上课", // 应该不匹配
  "下下周日晚上八点",
  "睡觉" // 应该不匹配
];

console.log("===== 测试下周正则表达式 =====");

// 下周几的正则表达式
const nextWeekRegex = /下[个個]?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/;

// 测试每个案例
testCases.forEach((text, index) => {
  process.stdout.write(`[${index+1}] 测试文本: "${text}" -> `);
  const match = text.match(nextWeekRegex);
  if (match) {
    console.log(`匹配成功! 星期${match[1]}`);
  } else {
    console.log(`未匹配!`);
  }
});

// 也测试更宽松的正则表达式
console.log("\n===== 测试宽松正则表达式 =====");
const looseRegex = /下[个個]?[周週]/;
testCases.forEach((text, index) => {
  process.stdout.write(`[${index+1}] 测试文本: "${text}" -> `);
  const match = looseRegex.test(text);
  if (match) {
    console.log(`匹配成功!`);
  } else {
    console.log(`未匹配!`);
  }
});

// 测试有空格的匹配情况
console.log("\n===== 测试有空格的匹配情况 =====");
const testCasesWithSpace = [
  "下周 六七点上课",
  "下周 日晚上八点回妈妈家吃饭"
];
testCasesWithSpace.forEach((text, index) => {
  process.stdout.write(`[${index+1}] 测试文本: "${text}" -> `);
  const match = text.match(nextWeekRegex);
  if (match) {
    console.log(`匹配成功! 星期${match[1]}`);
  } else {
    console.log(`未匹配!`);
  }
});

// 测试更多的正则表达式变体
console.log("\n===== 测试更多的正则表达式变体 =====");
const variationRegexes = {
  '标准': /下[个個]?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/,
  '允许空格': /下[个個]?(?:周|週|星期|礼拜|禮拜)\s*([一二三四五六日天])/,
  '简化版': /下[个個]?(?:周|週|星期)([一二三四五六日天])/
};

const combinedTestCases = [...testCases, ...testCasesWithSpace];
Object.entries(variationRegexes).forEach(([name, regex]) => {
  console.log(`\n> 测试 ${name} 正则表达式:`);
  combinedTestCases.forEach((text, index) => {
    process.stdout.write(`[${index+1}] 测试文本: "${text}" -> `);
    const match = text.match(regex);
    if (match) {
      console.log(`匹配成功! 星期${match[1]}`);
    } else {
      console.log(`未匹配!`);
    }
  });
}); 