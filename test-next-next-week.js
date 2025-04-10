// 测试"下下周"日期计算逻辑
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 计算下下周指定星期几的日期
function getNextNextWeekday(targetWeekday) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算目标星期几与今天相差的天数
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  
  // 首先计算本周的目标日期要加的天数
  let daysToAdd = targetWeekday - dayOfWeek;
  
  // 如果是今天或已经过了本周的目标日期，加7天到下周
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  // 再加14天（两周），确保是下下周
  daysToAdd += 14;
  
  // 设置日期为下下周目标日期
  const nextNextWeekDate = new Date(today);
  nextNextWeekDate.setDate(today.getDate() + daysToAdd);
  
  return nextNextWeekDate;
}

// 问题：当前代码中下下周的实现
function currentImplementation(targetWeekday) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算目标星期几与今天相差的天数
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  
  // 首先计算本周的目标日期要加的天数
  let daysToAdd = targetWeekday - dayOfWeek;
  
  // 如果是今天或已经过了本周的目标日期，加7天到下周
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  // 再加7天，确保是下周
  daysToAdd += 7;
  
  // 设置日期为下周目标日期
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + daysToAdd);
  
  return nextWeekDate;
}

// 修复后的计算逻辑
function correctImplementation(targetWeekday) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算目标星期几与今天相差的天数
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  
  // 首先计算本周的目标日期要加的天数
  let daysToAdd = targetWeekday - dayOfWeek;
  
  // 如果是今天或已经过了本周的目标日期，加7天到下周
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }
  
  // 再加14天（两周），确保是下下周
  daysToAdd += 14;
  
  // 设置日期为下下周目标日期
  const nextNextWeekDate = new Date(today);
  nextNextWeekDate.setDate(today.getDate() + daysToAdd);
  
  return nextNextWeekDate;
}

// 测试所有情况
console.log("今天是:", dayNames[new Date().getDay()], new Date().toLocaleDateString());
console.log("----- 下下周日期测试 -----");

for (let i = 0; i < 7; i++) {
  const currentDate = currentImplementation(i);
  const correctDate = correctImplementation(i);
  const diffDays = Math.round((correctDate - currentDate) / (1000 * 60 * 60 * 24));
  
  console.log(`下下周${dayNames[i]}: 
  当前实现: ${currentDate.toLocaleDateString()} (${getDaysFromToday(currentDate)}天后)
  正确实现: ${correctDate.toLocaleDateString()} (${getDaysFromToday(correctDate)}天后)
  差异: ${diffDays}天`);
}

// 计算与今天相差的天数
function getDaysFromToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(date - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
} 