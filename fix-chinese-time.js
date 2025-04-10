const fs = require('fs');
const path = require('path');

// 创建一个测试函数，将在应用启动时测试"下周六晚上八点"的解析
const testCode = `
// 测试时间解析
console.log('开始测试时间解析...');
console.log('测试输入: 下周六晚上八点数学');

// 使用NLP服务解析
setTimeout(function() {
  const nlp = NLPService.getInstance();
  const result = nlp.parse('下周六晚上八点数学');
  console.log('解析结果:', result);
  console.log('日期:', result.date.toString());
  console.log('小时:', result.date.getHours());
  console.log('分钟:', result.date.getMinutes());
  console.log('内容:', result.content);
}, 1000);
`;

// 创建一个直接修复的函数
console.log('开始创建修复文件...');

const fixCode = `
// 此文件包含修复NLPService中时间解析问题的代码

// 1. 修复中文数字映射，确保包含所有中文数字
const chineseNumMap = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

// 2. 创建一个直接替换的parseNumberString函数
function parseNumberString(numStr) {
  if (!numStr) return 0;
  
  // 如果已经是数字，直接返回
  if (/^\\d+$/.test(numStr)) {
    return parseInt(numStr);
  }
  
  // 简单中文数字转换 (一、二、三...)
  if (numStr.length === 1 && chineseNumMap[numStr] !== undefined) {
    return chineseNumMap[numStr];
  }
  
  // 处理"十X"格式 (十一、十二...)
  if (numStr.startsWith('十') && numStr.length === 2) {
    return 10 + chineseNumMap[numStr[1]];
  }
  
  // 处理"X十"格式 (二十、三十...)
  if (numStr.length === 2 && numStr.endsWith('十')) {
    return chineseNumMap[numStr[0]] * 10;
  }
  
  // 处理"X十Y"格式 (二十一、三十二...)
  if (numStr.length === 3 && numStr[1] === '十') {
    return chineseNumMap[numStr[0]] * 10 + chineseNumMap[numStr[2]];
  }
  
  // 如果无法解析，返回0
  return 0;
}

// 3. 创建一个函数来解析中文时间
function parseChineseTime(text) {
  console.log('解析中文时间:', text);
  
  // 提取时间部分的正则表达式
  const timeRegex = /(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?[ ]?(\\d+|[一二三四五六七八九十]+)[点點时時](?:(\\d+|[一二三四五六七八九十半刻]+)[分]?)?/;
  
  const match = text.match(timeRegex);
  if (!match) {
    console.log('未匹配到时间表达式');
    return { hours: 0, minutes: 0 };
  }
  
  console.log('匹配到时间表达式:', match[0]);
  
  // 检查是否是包含时段的格式
  let isPM = false;
  const timePrefix = match[1] || '';
  
  // 更全面的时段判断
  if (timePrefix) {
    if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix)) {
      isPM = true;
      console.log('检测到PM时段:', timePrefix);
    } else {
      console.log('检测到AM时段:', timePrefix);
    }
  }
  
  // 提取小时和分钟
  const hourStr = match[2];
  const minuteStr = match[3] || '0';
  
  // 转换中文数字到阿拉伯数字
  let hours = /^\\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr);
  console.log('解析小时结果:', hourStr, '->', hours);
  
  let minutes = 0;
  if (minuteStr === '半') {
    minutes = 30;
  } else if (minuteStr === '刻' || minuteStr === '一刻') {
    minutes = 15;
  } else if (minuteStr === '两刻' || minuteStr === '二刻') {
    minutes = 30;
  } else if (minuteStr === '三刻') {
    minutes = 45;
  } else {
    minutes = /^\\d+$/.test(minuteStr) ? parseInt(minuteStr) : parseNumberString(minuteStr);
  }
  
  // 处理12小时制到24小时制的转换
  if (isPM && hours < 12) {
    hours += 12;
    console.log('转换为24小时制:', hours + ':' + minutes);
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

// 4. 测试解析函数
const testCases = [
  '晚上八点',
  '下午三点',
  '早上九点',
  '中午十二点',
  '晚上八点半',
  '下午5点15分'
];

console.log('测试时间解析函数:');
for (const testCase of testCases) {
  const result = parseChineseTime(testCase);
  console.log('输入:', testCase);
  console.log('结果:', result.hours + ':' + (result.minutes < 10 ? '0' + result.minutes : result.minutes));
  console.log('------');
}

// 5. 指导如何修复NLPService.ts文件
console.log('\\n如何修复NLPService.ts文件:');
console.log('1. 确保中文数字映射包含所有数字：');
console.log(JSON.stringify(chineseNumMap, null, 2));
console.log('');
console.log('2. 确保isPM判断逻辑包含"晚上"关键词：');
console.log('if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix)) {');
console.log('');
console.log('3. 确保24小时转换逻辑正确：');
console.log('if (isPM && hours < 12) {');
console.log('  hours += 12;');
console.log('  console.log(`转换为24小时制: ${hours}:${minutes}`);');
console.log('}');
console.log('');
console.log('4. 确保小时解析逻辑调用parseNumberString函数：');
console.log('let hours = /^\\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr, "zh");');
`;

// 保存修复代码到文件
const fixFilePath = path.join(__dirname, 'fix-chinese-time-solution.js');
fs.writeFileSync(fixFilePath, fixCode, 'utf8');
console.log('已创建修复指南:', fixFilePath);

// 将测试代码附加到NLPService.ts文件
try {
  const nlpServiceFile = path.join(__dirname, 'src/services/nlpService.ts');
  
  // 检查文件是否存在
  if (fs.existsSync(nlpServiceFile)) {
    // 创建备份
    const backupFile = nlpServiceFile + '.bak';
    fs.copyFileSync(nlpServiceFile, backupFile);
    console.log('已备份原始文件:', backupFile);
    
    // 读取内容
    let content = fs.readFileSync(nlpServiceFile, 'utf8');
    
    // 添加测试代码到文件末尾
    content += '\n' + testCode;
    
    // 保存修改后的文件
    fs.writeFileSync(nlpServiceFile, content, 'utf8');
    console.log('已添加测试代码到NLPService.ts文件');
    
    console.log('\n请重新启动应用以测试时间解析功能');
  } else {
    console.error('无法找到NLPService.ts文件:', nlpServiceFile);
  }
} catch (error) {
  console.error('修改NLPService.ts文件时出错:', error);
}

// 创建直接的修复文件
const directFixCode = `
// 这个文件包含修复"晚上八点"解析为00:00的直接解决方案

const fs = require('fs');
const path = require('path');

// 文件路径
const filePath = path.join(__dirname, 'src/services/nlpService.ts');

try {
  // 读取文件
  console.log('正在读取文件:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 备份原文件
  const backupFile = filePath + '.bak2';
  fs.writeFileSync(backupFile, content, 'utf8');
  console.log('已备份原文件到:', backupFile);
  
  // 修复时间解析部分
  
  // 1. 查找小时解析代码
  const hourParseRegex = /let hours = \\/\\^\\\\d\\+\\$\\/\\.test\\(hourStr\\) \\? parseInt\\(hourStr\\) : parseNumberString\\(hourStr,[^;]+;/;
  const hourParseMatch = content.match(hourParseRegex);
  
  if (hourParseMatch) {
    console.log('找到小时解析代码:', hourParseMatch[0]);
    
    // 确保代码使用正确的parseNumberString函数调用
    const fixedHourParse = 'let hours = /^\\\\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr, "zh");';
    content = content.replace(hourParseRegex, fixedHourParse);
    console.log('已修复小时解析代码');
  } else {
    console.log('未找到小时解析代码');
  }
  
  // 2. 查找isPM判断逻辑
  const isPMRegex = /if\\s*\\(\\s*\\/\\([^)]*\\)\\/\\.test\\(timePrefix\\)\\s*\\)\\s*{[^}]*isPM\\s*=\\s*true/;
  const isPMMatch = content.match(isPMRegex);
  
  if (isPMMatch) {
    console.log('找到isPM判断逻辑');
    
    // 确保包含"晚上"关键词
    const fixedIsPMLogic = 'if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix)) {\\n              isPM = true;';
    content = content.replace(isPMRegex, fixedIsPMLogic);
    console.log('已修复isPM判断逻辑');
  } else {
    console.log('未找到isPM判断逻辑');
  }
  
  // 3. 查找24小时转换逻辑
  const hour24Regex = /if\\s*\\(\\s*isPM\\s*&&\\s*hours\\s*<\\s*12\\s*\\)\\s*{[^}]*hours\\s*\\+=\\s*12/;
  const hour24Match = content.match(hour24Regex);
  
  if (hour24Match) {
    console.log('找到24小时转换逻辑');
    
    // 确保正确转换12小时制到24小时制
    const fixed24HourLogic = 'if (isPM && hours < 12) {\\n              hours += 12;\\n              console.log(`转换为24小时制: ${hours}:${minutes < 10 ? \\'0\\' + minutes : minutes}`);';
    content = content.replace(hour24Regex, fixed24HourLogic);
    console.log('已修复24小时转换逻辑');
  } else {
    console.log('未找到24小时转换逻辑');
  }
  
  // 写回文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('已保存修改后的文件');
  
  console.log('\\n修复完成!');
  console.log('请重新启动应用以验证时间解析是否正确工作。');
  
} catch (error) {
  console.error('修复过程中发生错误:', error);
}
`;

// 保存直接修复代码
const directFixPath = path.join(__dirname, 'direct-fix-chinese-time.js');
fs.writeFileSync(directFixPath, directFixCode, 'utf8');
console.log('已创建直接修复脚本:', directFixPath);
console.log('\n请运行 node direct-fix-chinese-time.js 来直接修复NLPService.ts文件中的时间解析问题');
`; 