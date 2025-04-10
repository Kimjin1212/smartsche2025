// 日期计算测试脚本

// 辅助函数：格式化日期为YYYY-MM-DD格式
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 返回指定日期所在星期几的名称
function getDayName(date) {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return dayNames[date.getDay()];
}

// 计算下周指定星期几的日期
function getNextWeekday(targetWeekday) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 计算目标星期几与今天相差的天数
  // 例如：今天是周四(4)，目标是下周一(1)，相差的天数是 (1-4+7) % 7 = 4天
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  let daysToAdd = (targetWeekday - dayOfWeek + 7) % 7;
  
  // 如果差值为0，说明是同一天，我们需要加7天
  if (daysToAdd === 0) {
    daysToAdd = 7;
  }
  
  // 设置日期为下周目标日期
  const nextWeekDate = new Date(today);
  nextWeekDate.setDate(today.getDate() + daysToAdd);
  
  return nextWeekDate;
}

// 计算下下周指定星期几的日期
function getNextNextWeekday(targetWeekday) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 获取本周的目标日期
  const currentWeekTargetDay = new Date(today);
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  
  // 计算到本周目标日期的天数差值
  let daysToTargetDay = targetWeekday - dayOfWeek;
  
  // 如果已经过了本周的目标日期或是今天，调整到下周
  if (daysToTargetDay <= 0) {
    daysToTargetDay += 7;
  }
  
  // 本周目标日期 + 14天 = 下下周目标日期
  currentWeekTargetDay.setDate(today.getDate() + daysToTargetDay + 14);
  
  return currentWeekTargetDay;
}

// 测试各种日期计算
console.log("日期计算测试：");
console.log("-----------------------------------------");

// 输出当前日期信息
const today = new Date();
console.log(`今天是: ${formatDate(today)} ${getDayName(today)}`);
console.log("-----------------------------------------");

// 测试下周日期
const weekdays = [
  { name: "周一", index: 1 },
  { name: "周二", index: 2 },
  { name: "周三", index: 3 },
  { name: "周四", index: 4 },
  { name: "周五", index: 5 },
  { name: "周六", index: 6 },
  { name: "周日", index: 0 }
];

// 测试下周日期
console.log("下周日期计算结果：");
weekdays.forEach(weekday => {
  const nextWeekDate = getNextWeekday(weekday.index);
  console.log(`下${weekday.name}: ${formatDate(nextWeekDate)} ${getDayName(nextWeekDate)}`);
});
console.log("-----------------------------------------");

// 测试下下周日期
console.log("下下周日期计算结果：");
weekdays.forEach(weekday => {
  const nextNextWeekDate = getNextNextWeekday(weekday.index);
  console.log(`下下${weekday.name}: ${formatDate(nextNextWeekDate)} ${getDayName(nextNextWeekDate)}`);
});
console.log("-----------------------------------------"); 