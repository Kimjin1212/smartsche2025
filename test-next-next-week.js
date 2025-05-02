// 测试"下下周"日期计算逻辑
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 设置测试日期为2025-04-11（周五）
const TEST_DATE = new Date('2025-04-11T00:00:00.000Z');

// 计算下下周指定星期几的日期
function parseNextNextWeekdayFromToday(targetWeekday) {
  // 使用测试日期
  const today = new Date(TEST_DATE);
  
  // 重置时间为凌晨0点
  today.setHours(0, 0, 0, 0);
  // 得到今天的星期数，若为0（周日）则按7处理
  const todayWeekday = today.getDay() || 7;
  
  console.log('\n[Debug] 计算过程:');
  console.log('- 当前日期:', today.toLocaleDateString());
  console.log('- 当前星期:', todayWeekday);
  console.log('- 目标星期:', targetWeekday);
  
  // 使用新公式计算：daysToAdd = targetWeekday + 14 - todayWeekday
  const daysToAdd = targetWeekday + 14 - todayWeekday;
  
  console.log('[Debug] 计算步骤:');
  console.log('- 使用公式: daysToAdd = targetWeekday + 14 - todayWeekday');
  console.log('- 计算: daysToAdd =', targetWeekday, '+ 14 -', todayWeekday, '=', daysToAdd);
  
  // 设置日期为下下周目标日期
  const nextNextWeekDate = new Date(today);
  nextNextWeekDate.setDate(today.getDate() + daysToAdd);
  
  console.log('[Debug] 最终结果:');
  console.log('- 目标日期:', nextNextWeekDate.toLocaleDateString());
  console.log('- 目标日期的星期:', nextNextWeekDate.getDay() || 7);
  
  return nextNextWeekDate;
}

// 测试用例
console.log('测试用例 1: 下下周一 (targetWeekday = 1)');
const nextNextMonday = parseNextNextWeekdayFromToday(1);
console.log('预期结果: 2025-04-21 (周一)');
console.log('实际结果:', nextNextMonday.toLocaleDateString(), `(${dayNames[nextNextMonday.getDay()]})`);

console.log('\n测试用例 2: 下下周日 (targetWeekday = 7)');
const nextNextSunday = parseNextNextWeekdayFromToday(7);
console.log('预期结果: 2025-04-27 (周日)');
console.log('实际结果:', nextNextSunday.toLocaleDateString(), `(${dayNames[nextNextSunday.getDay()]})`); 