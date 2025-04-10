// 修复下周几日期计算错误
const fs = require('fs');
const path = require('path');

// 文件路径
const filePath = path.join(__dirname, 'src/services/nlpService.ts');

try {
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 找到需要修改的代码
  const targetCode = `        // 首先计算本周的目标日期要加的天数
        let daysToAdd = targetDay - dayOfWeek;
        
        // 如果是今天或已经过了本周的目标日期，加7天到下周
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        // 再加7天，确保是下周
        daysToAdd += 7;
        
        // 设置日期为下周目标日期`;
  
  // 修改后的代码
  const newCode = `        // 首先计算本周的目标日期要加的天数
        let daysToAdd = targetDay - dayOfWeek;
        
        // 如果是今天或已经过了本周的目标日期，加7天到下周
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        // 设置日期为下周目标日期`;
  
  // 替换代码
  const updatedContent = content.replace(targetCode, newCode);
  
  // 检查是否替换成功
  if (content === updatedContent) {
    console.log('未能找到目标代码块或已经修改过了');
    
    // 尝试简单匹配
    const simpleTarget = `        // 再加7天，确保是下周
        daysToAdd += 7;`;
    const simpleReplacement = `        // 下周日期已经通过上面的计算得到`;
    
    const simpleUpdate = content.replace(simpleTarget, simpleReplacement);
    
    if (content === simpleUpdate) {
      console.log('简单匹配也失败了，可能需要手动修改');
      
      // 最简单的匹配
      const verySimpleTarget = `daysToAdd += 7; // 再加7天，确保是下周`;
      const verySimpleUpdate = content.replace(verySimpleTarget, `// 下周日期已经通过上面的计算得到`);
      
      if (content === verySimpleUpdate) {
        // 最后尝试匹配行
        const lineByLine = content.split('\n');
        let found = false;
        
        for (let i = 0; i < lineByLine.length; i++) {
          if (lineByLine[i].includes('daysToAdd += 7') && 
              (lineByLine[i-1]?.includes('下周') || lineByLine[i+1]?.includes('下周'))) {
            console.log(`在第 ${i+1} 行找到目标代码`);
            lineByLine[i] = '        // 下周日期已经通过上面的计算得到';
            found = true;
            break;
          }
        }
        
        if (found) {
          const finalContent = lineByLine.join('\n');
          fs.writeFileSync(filePath, finalContent, 'utf8');
          console.log('成功修改文件！');
        } else {
          console.log('无法找到目标代码行，请手动修改。');
        }
      } else {
        fs.writeFileSync(filePath, verySimpleUpdate, 'utf8');
        console.log('使用最简单的匹配成功修改文件！');
      }
    } else {
      fs.writeFileSync(filePath, simpleUpdate, 'utf8');
      console.log('使用简单匹配成功修改文件！');
    }
  } else {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('成功修改文件！');
  }
} catch (error) {
  console.error('发生错误:', error);
} 