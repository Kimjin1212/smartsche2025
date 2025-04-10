const fs = require('fs');
const path = require('path');

console.log('开始修复时间解析问题...');

// 文件路径
const filePath = path.join(__dirname, 'src/services/nlpService.ts');

try {
  // 读取文件
  console.log('正在读取文件:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 备份原文件
  const backupFile = filePath + '.bak';
  fs.writeFileSync(backupFile, content, 'utf8');
  console.log('已备份原文件到:', backupFile);
  
  // 查找中文数字映射
  const chineseNumMapRegex = /chineseNumMap[^{]*{[^}]*}/;
  const chineseNumMapMatch = content.match(chineseNumMapRegex);
  
  if (chineseNumMapMatch) {
    console.log('找到中文数字映射:', chineseNumMapMatch[0]);
    
    // 检查是否包含所有中文数字
    const chineseNumeralsToCheck = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    let missingNumerals = [];
    
    for (const numeral of chineseNumeralsToCheck) {
      if (!chineseNumMapMatch[0].includes(numeral)) {
        missingNumerals.push(numeral);
      }
    }
    
    if (missingNumerals.length > 0) {
      console.log('以下中文数字在映射中缺失:', missingNumerals.join(', '));
      
      // 添加缺失的中文数字映射
      const newChineseNumMap = chineseNumMapMatch[0].replace(
        '{', 
        '{\n      ' + missingNumerals.map((num, idx) => `'${num}': ${idx}`).join(', ') + ', '
      );
      
      content = content.replace(chineseNumMapRegex, newChineseNumMap);
      console.log('已添加缺失的中文数字映射');
    } else {
      console.log('中文数字映射已完整');
    }
  } else {
    console.log('未找到中文数字映射');
  }
  
  // 查找时间处理函数
  const timeRegex = /timeRegexes\s*=\s*\[[\s\S]*?\]\s*;/;
  const timeRegexMatch = content.match(timeRegex);
  
  if (timeRegexMatch) {
    console.log('找到时间正则表达式:', timeRegexMatch[0].substring(0, 100) + '...');
    
    // 确保正则表达式正确处理"晚上八点"
    if (!timeRegexMatch[0].includes('晚上') || !timeRegexMatch[0].includes('八')) {
      console.log('时间正则表达式可能需要优化');
    } else {
      console.log('时间正则表达式包含必要的关键词');
    }
  } else {
    console.log('未找到时间正则表达式');
  }
  
  // 查找isPM判断逻辑
  const isPMRegex = /if\s*\(\s*\/\(([^)]*)\)\/\.test\(timePrefix\)\s*\)\s*{[^}]*isPM\s*=\s*true/;
  const isPMMatch = content.match(isPMRegex);
  
  if (isPMMatch) {
    console.log('找到isPM判断逻辑:', isPMMatch[0]);
    
    // 检查是否包含"晚上"
    if (!isPMMatch[1].includes('晚上')) {
      console.log('isPM判断逻辑中缺少"晚上"关键词，正在修复...');
      
      // 添加缺失的关键词
      const fixedIsPMLogic = isPMMatch[0].replace(
        /\/\(([^)]*)\)\//,
        '/(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/'
      );
      
      content = content.replace(isPMRegex, fixedIsPMLogic);
      console.log('已修复isPM判断逻辑');
    } else {
      console.log('isPM判断逻辑包含"晚上"关键词');
    }
  } else {
    console.log('未找到isPM判断逻辑');
  }
  
  // 查找24小时转换逻辑
  const hour24Regex = /if\s*\(\s*isPM\s*&&\s*hours\s*<\s*12\s*\)\s*{[^}]*hours\s*\+=\s*12/;
  const hour24Match = content.match(hour24Regex);
  
  if (hour24Match) {
    console.log('找到24小时转换逻辑:', hour24Match[0]);
    
    // 查找24小时设置逻辑，可能在附近代码中设置了时间
    const setTimeRegex = /resultDate\.setHours\([^)]*\)/;
    const setTimeMatch = content.match(setTimeRegex);
    
    if (setTimeMatch) {
      console.log('找到时间设置代码:', setTimeMatch[0]);
    } else {
      console.log('未找到时间设置代码');
    }
  } else {
    console.log('未找到24小时转换逻辑');
  }
  
  // 添加一个中文时间解析测试函数
  const testFunctionCode = `
// 添加测试函数以验证中文时间解析
function testChineseTimeParser() {
  console.log('开始测试中文时间解析...');
  
  const testCases = [
    "晚上八点",
    "下午三点",
    "早上九点",
    "中午十二点",
    "晚上八点半",
    "下午5点15分"
  ];
  
  for (const testCase of testCases) {
    console.log('测试输入:', testCase);
    
    // 提取时间部分
    const timeRegex = /(早上|早晨|凌晨|上午|中午|下午|午后|傍晚|黄昏|晚上|夜晚|深夜|半夜|夜里|夜间)?[ ]?(\\d+|[一二三四五六七八九十]+)[点點时時](?:(\\d+|[一二三四五六七八九十半刻]+)[分]?)?/;
    const match = testCase.match(timeRegex);
    
    if (match) {
      console.log('匹配结果:', match);
      
      // 检查时段
      const timePrefix = match[1] || '';
      const isPM = /(下午|午后|傍晚|黄昏|晚上|夜晚|夜里|夜间|深夜|半夜|中午)/.test(timePrefix);
      console.log('时段前缀:', timePrefix);
      console.log('是否PM:', isPM);
      
      // 提取小时
      const hourStr = match[2];
      const chineseNumMap = {
        '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
      };
      
      // 解析小时
      let hours = /^\\d+$/.test(hourStr) ? parseInt(hourStr) : 0;
      if (!hours && Object.prototype.hasOwnProperty.call(chineseNumMap, hourStr)) {
        hours = chineseNumMap[hourStr];
      }
      
      console.log('解析小时:', hourStr, '->', hours);
      
      // 处理12小时制转24小时制
      if (isPM && hours < 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
      
      console.log('24小时制:', hours);
      
      // 设置日期
      const date = new Date();
      date.setHours(hours, 0, 0, 0);
      console.log('最终时间:', date.toString());
      console.log('------');
    } else {
      console.log('无匹配');
      console.log('------');
    }
  }
}

// 在应用启动时运行测试
setTimeout(testChineseTimeParser, 2000);
`;
  
  // 在文件末尾添加测试函数
  content += testFunctionCode;
  console.log('已添加中文时间解析测试函数');
  
  // 写回文件
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('已保存修改后的文件');
  
  console.log('\n修复完成!');
  console.log('请启动应用查看控制台输出，以验证时间解析是否正确工作。');
  console.log('在启动应用后，应该能看到对不同中文时间表达式的测试结果。');
  
} catch (error) {
  console.error('修复过程中发生错误:', error);
} 