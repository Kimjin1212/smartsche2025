// 修复下下周几日期计算错误
const fs = require('fs');
const path = require('path');

// 文件路径
const filePath = path.join(__dirname, 'src/services/nlpService.ts');

try {
  // 读取文件
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 找到下下周计算代码
  const targetCode = `        // 再加7天，确保是下周
        daysToAdd += 7;`;
  
  // 修改后的代码
  const newCode = `        // 再加14天，确保是下下周
        daysToAdd += 14;`;
  
  // 查找特定上下文来确保替换正确的代码
  const contextBefore = `    // 1. 处理"下下周/下下个星期"类表达式
    if (/下下(?:个|個)?(?:周|週|星期|礼拜|禮拜)/.test(text)) {
      // 2. 处理"下下周x/下下週x/下下星期x"表达式`;
  
  // 获取带上下文的目标文本
  const targetWithContext = content.indexOf(contextBefore);
  if (targetWithContext === -1) {
    console.log("未找到下下周处理代码块的上下文");
    return;
  }
  
  // 找到这个上下文后的代码段
  const afterContext = content.substring(targetWithContext);
  
  // 在这个代码段中查找目标代码
  const targetInContext = afterContext.indexOf(targetCode);
  if (targetInContext === -1) {
    console.log("在下下周处理代码块中未找到目标代码");
    
    // 尝试另一种方式定位 - 行匹配
    const lines = content.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      // 查找可能的标记
      if (lines[i].includes('下下周') && (i + 30) < lines.length) {
        // 查找这个区域附近的 "daysToAdd += 7"
        for (let j = i; j < i + 30; j++) {
          if (lines[j].includes('daysToAdd += 7')) {
            console.log(`在第 ${j+1} 行找到了下下周计算中的 "daysToAdd += 7"`);
            lines[j] = lines[j].replace('daysToAdd += 7', 'daysToAdd += 14');
            found = true;
            break;
          }
        }
        
        if (found) {
          // 保存修改后的内容
          const updatedContent = lines.join('\n');
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          console.log("成功修复下下周计算！");
          break;
        }
      }
    }
    
    if (!found) {
      console.log("无法找到需要修改的代码");
    }
    
    return;
  }
  
  // 计算需要修改的位置
  const replacePosition = targetWithContext + targetInContext;
  
  // 替换目标代码
  const updatedContent = 
    content.substring(0, replacePosition) + 
    newCode + 
    content.substring(replacePosition + targetCode.length);
  
  // 保存修改
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log("成功修复下下周计算！");
  
} catch (error) {
  console.error('发生错误:', error);
} 