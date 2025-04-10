// 脚本用于修复日期计算，特别是"下周"相关的计算逻辑
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/nlpService.ts');

try {
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 查找目标代码块 - 下周计算逻辑
  const targetPattern = /const dayOfWeek = today\.getDay\(\); \/\/ 0-6, 周日为0\s+let daysToAdd = \(targetDay - dayOfWeek \+ 7\) % 7;\s+\/\/ 如果差值为0，说明是同一天，我们需要加7天\s+if \(daysToAdd === 0\) {\s+daysToAdd = 7;\s+}/;
  
  // 替换为新的逻辑
  const newCode = `const dayOfWeek = today.getDay(); // 0-6, 周日为0
        
        // 首先计算本周的目标日期要加的天数
        let daysToAdd = targetDay - dayOfWeek;
        
        // 如果是今天或已经过了本周的目标日期，加7天到下周
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        // 再加7天，确保是下周
        daysToAdd += 7;`;
  
  // 执行替换
  const modifiedContent = content.replace(targetPattern, newCode);
  
  // 检查是否替换成功
  if (content === modifiedContent) {
    console.log('未找到目标代码块或替换失败，请手动修改。');
    // 尝试使用更简单的匹配模式
    const simplePattern = /let daysToAdd = \(targetDay - dayOfWeek \+ 7\) % 7;/;
    const updatedContent = content.replace(simplePattern, `// 首先计算本周的目标日期要加的天数
        let daysToAdd = targetDay - dayOfWeek;
        
        // 如果是今天或已经过了本周的目标日期，加7天到下周
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        // 再加7天，确保是下周
        daysToAdd += 7;`);
    
    if (content === updatedContent) {
      console.log('简化匹配也失败了，请检查文件结构是否有变化。');
    } else {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log('使用简化匹配成功更新文件！');
    }
  } else {
    // 保存修改后的文件
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    console.log('成功更新文件！');
  }
  
  console.log('脚本完成执行。');
} catch (error) {
  console.error('错误:', error);
} 