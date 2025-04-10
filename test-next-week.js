// 测试"下周"日期计算逻辑
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 计算下周指定星期几的日期
function getNextWeekday(targetWeekday) {
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

// 测试所有情况
console.log("今天是:", dayNames[new Date().getDay()], new Date().toLocaleDateString());
console.log("----- 下周日期测试 -----");

for (let i = 0; i < 7; i++) {
  const nextDate = getNextWeekday(i);
  console.log(`下周${dayNames[i]}: ${nextDate.toLocaleDateString()} (${daysFromToday(nextDate)}天后)`);
}

// 计算与今天相差的天数
function daysFromToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(date - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

console.log("\n所有计算出的'下周'日期应该在7-13天之间。"); 