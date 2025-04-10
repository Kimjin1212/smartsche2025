const fs = require('fs');
const path = require('path');

// 添加调试代码到nlpService.ts文件
const filePath = path.join(__dirname, 'src/services/nlpService.ts');

// 确保文件存在
try {
  fs.accessSync(filePath, fs.constants.F_OK);
  console.log('已找到目标文件:', filePath);
} catch (err) {
  console.error('无法访问文件:', filePath);
  console.error('当前工作目录:', process.cwd());
  process.exit(1);
}

// 创建备份
try {
  const backupPath = path.join(__dirname, 'src/services/nlpService.ts.bak');
  fs.copyFileSync(filePath, backupPath);
  console.log('已创建备份:', backupPath);
} catch (err) {
  console.error('创建备份失败:', err);
  process.exit(1);
}

// 读取文件内容
let content = '';
try {
  content = fs.readFileSync(filePath, 'utf8');
  console.log('已读取文件内容');
} catch (err) {
  console.error('读取文件失败:', err);
  process.exit(1);
}

// 分析文件行
const lines = content.split('\n');

// 查找小时处理相关代码
let hoursParseLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('let hours = /^\\d+$/.test(hourStr) ? parseInt(hourStr) : parseNumberString(hourStr,')) {
    hoursParseLine = i;
    console.log(`找到小时解析代码: 第${i+1}行`);
    break;
  }
}

if (hoursParseLine === -1) {
  console.error('无法找到小时解析代码');
  process.exit(1);
}

// 添加调试日志到小时解析后
if (!lines[hoursParseLine + 1].includes('console.log(`解析小时结果:')) {
  lines.splice(hoursParseLine + 1, 0, 
    '            console.log(`解析小时结果: ${hourStr} -> ${hours}`);');
  console.log('已添加小时解析调试日志');
}

// 查找24小时转换逻辑
let hourConversionLine = -1;
for (let i = hoursParseLine; i < hoursParseLine + 20; i++) {
  if (lines[i].includes('if (isPM && hours < 12)')) {
    hourConversionLine = i;
    console.log(`找到24小时转换代码: 第${i+1}行`);
    break;
  }
}

if (hourConversionLine === -1) {
  console.error('无法找到24小时转换代码');
  process.exit(1);
}

// 在24小时转换之前添加isPM状态日志
const isPMLogLine = hourConversionLine - 1;
if (!lines[isPMLogLine].includes('console.log(`isPM状态:')) {
  lines.splice(isPMLogLine, 0, 
    '            console.log(`isPM状态: ${isPM}, 原始小时: ${hours}`);');
  console.log('已添加isPM状态调试日志');
}

// 在转换后添加24小时制日志
const hourConversionLogLine = hourConversionLine + 3;
if (!lines[hourConversionLogLine].includes('console.log(`24小时制转换:')) {
  lines.splice(hourConversionLogLine, 0, 
    '            console.log(`24小时制转换结果: ${hours} -> ${isPM && hours < 12 ? hours + 12 : hours}`);');
  console.log('已添加24小时制转换结果调试日志');
}

// 查找setHours调用
let setHoursLine = -1;
for (let i = hourConversionLine; i < hourConversionLine + 20; i++) {
  if (lines[i].includes('resultDate.setHours(') || lines[i].includes('.setHours(')) {
    setHoursLine = i;
    console.log(`找到setHours调用: 第${i+1}行`);
    break;
  }
}

if (setHoursLine === -1) {
  console.error('无法找到setHours调用');
  process.exit(1);
}

// 在setHours之前添加调试日志
if (!lines[setHoursLine - 1].includes('console.log(`设置时间前状态:')) {
  lines.splice(setHoursLine, 0, 
    '            console.log(`设置时间前状态: ${resultDate.toString()}`);');
  console.log('已添加setHours前状态调试日志');
}

// 在setHours之后添加调试日志
if (!lines[setHoursLine + 2].includes('console.log(`设置时间后状态:')) {
  lines.splice(setHoursLine + 2, 0, 
    '            console.log(`设置时间后状态: ${resultDate.toString()}`);');
  console.log('已添加setHours后状态调试日志');
}

// 在parseQuickNote函数结尾添加返回值日志
const returnRegex = /return\s*{[^}]*date:\s*resultDate/;
let returnLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (returnRegex.test(lines[i])) {
    returnLine = i;
    console.log(`找到返回值语句: 第${i+1}行`);
    break;
  }
}

if (returnLine !== -1) {
  // 在return语句前添加日志
  lines.splice(returnLine, 0, 
    '  console.log(`最终返回日期: ${resultDate.toString()}`);');
  console.log('已添加返回值日志');
}

// 添加顶级测试代码，便于直接调试
const nlpServiceExportLine = lines.findIndex(line => line.includes('export const nlpService = NLPService.getInstance()'));
if (nlpServiceExportLine !== -1) {
  lines.splice(nlpServiceExportLine + 1, 0, 
    '\n// 测试特定输入\n' +
    'console.log("开始测试特定输入...");\n' +
    'setTimeout(() => {\n' +
    '  const testResult = nlpService.parse("下周六晚上八点数学");\n' +
    '  console.log("测试输入解析结果:", JSON.stringify({\n' +
    '    date: testResult.date?.toString(),\n' +
    '    content: testResult.content,\n' +
    '    hours: testResult.date?.getHours(),\n' +
    '    minutes: testResult.date?.getMinutes()\n' +
    '  }, null, 2));\n' +
    '}, 1000);');
  console.log('已添加测试代码');
}

// 写回文件
try {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('已成功写入修改后的文件');
} catch (err) {
  console.error('写入文件失败:', err);
  process.exit(1);
}

console.log('\n调试代码已添加完成。现在可以运行应用程序并检查控制台输出，查看时间解析的详细过程。');
console.log('在调试完成后，请记得还原备份文件。'); 