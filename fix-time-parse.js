const fs = require('fs');
const path = require('path');

// 测试输入文本
const testInput = "下周六晚上八点数学";
console.log('测试输入:', testInput);

// 提取时间部分的正则表达式
const timeRegex = /(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)[ ]?([\d一二三四五六七八九十]+)[点點时時](?:([\d一二三四五六七八九十半刻]+)[分]?)?/;

// 中文数字映射
const chineseNumMap = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
};

// 解析中文数字
function parseNumberString(numStr) {
  if (!numStr) return 0;
  
  // 如果已经是数字，直接返回
  if (/^\d+$/.test(numStr)) {
    return parseInt(numStr);
  }
  
  // 简单中文数字转换 (一、二、三...)
  if (numStr.length === 1 && chineseNumMap[numStr]) {
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

// 测试正则匹配
const timeMatch = testInput.match(timeRegex);
if (timeMatch) {
  console.log('匹配到时间表达式:', timeMatch[0]);
  
  // 检查是否是包含时段的格式
  let isPM = false;
  const timePrefix = timeMatch[1] || '';
  
  // 更全面的时段判断
  if (timePrefix) {
    if (/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix)) {
      isPM = true;
      console.log(`检测到PM时段: ${timePrefix}`);
    } else {
      console.log(`检测到AM时段: ${timePrefix}`);
    }
  }
  
  // 提取小时和分钟
  const hourStr = timeMatch[2];
  const minuteStr = timeMatch[3] || '0';
  
  // 转换中文数字到阿拉伯数字
  const hours = parseNumberString(hourStr);
  console.log(`解析小时结果: ${hourStr} -> ${hours}`);
  
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
    minutes = parseNumberString(minuteStr);
  }
  
  // 处理12小时制到24小时制的转换
  let hour24 = hours;
  if (isPM && hours < 12) {
    hour24 = hours + 12;
  } else if (!isPM && hours === 12) {
    hour24 = 0;
  }
  
  console.log(`转换为24小时制: ${hour24}:${minutes < 10 ? '0' + minutes : minutes}`);
  
  // 构造日期对象测试
  const testDate = new Date();
  testDate.setHours(hour24, minutes, 0, 0);
  console.log('最终日期时间:', testDate.toString());
  console.log('格式化时间:', testDate.getHours() + ':' + 
    (testDate.getMinutes() < 10 ? '0' + testDate.getMinutes() : testDate.getMinutes()));
  
  // 创建修复代码展示
  console.log('\n以下是解决"晚上八点"等中文时间表达式的修复方案:');
  console.log('----------------------------------------------------');
  console.log(`在nlpService.ts文件中找到时间解析部分，添加明确的调试日志：

1. 在小时解析后添加:
   console.log(\`解析小时结果: \${hourStr} -> \${hours}\`);

2. 在时间设置前添加:
   console.log(\`完整时间设置: \${hour24}:\${minutes < 10 ? '0' + minutes : minutes}\`);

3. 如果你发现"八"没有被正确识别为8，可能是parseNumberString函数的问题，
   请检查这个函数对"八"的处理，确保chineseNumMap中包含所有中文数字映射。

4. 确保小时转换为24小时制的逻辑正确:
   isPM的判断应当包括"晚上"，并且在isPM为true且hours<12时正确+12。

5. 确保resultDate.setHours()被正确调用:
   resultDate.setHours(hour24, minutes, 0, 0);`);
  console.log('----------------------------------------------------');
  
  // 显示时间处理相关函数的调试建议
  console.log('\n调试建议:');
  console.log(`1. 添加临时日志，打印出解析时间过程中每一步的值:
   - 输入文本
   - 正则匹配结果
   - 提取的小时和分钟字符串
   - 转换后的数字
   - 最终设置的小时和分钟
   - 生成的日期对象

2. 运行具体输入测试，例如:
   const result = nlpService.parse("下周六晚上八点数学");
   console.log(JSON.stringify(result, null, 2));

3. 确保nlpService.getInstance()返回的实例正确
   然后在QuickNoteInput组件中验证返回的结果日期和内容。`);
} else {
  console.log('未匹配到时间表达式');
}

console.log('\n测试完成，您可以按照以上建议进行修复。'); 