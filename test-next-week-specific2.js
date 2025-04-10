// 测试"下周几"日期计算的特定场景
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const zhWeekdayMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
};

// 下周星期几算法测试
function testNextWeekdayCalculation(weekdayChar) {
  // 获取当前日期并重置时间
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(`今天是: ${today.toLocaleDateString()}, 星期${dayNames[today.getDay()]}`);
  
  // 中文星期几转换为数字
  const targetDay = zhWeekdayMap[weekdayChar];
  console.log(`目标星期: ${weekdayChar}, 对应数字: ${targetDay}`);
  
  // 计算目标星期几与今天相差的天数
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  console.log(`今天星期几数字: ${dayOfWeek}`);
  
  // 算法1：下周几的计算（加7天，确保是下周）
  let daysToAdd1 = targetDay - dayOfWeek;
  if (daysToAdd1 <= 0) {
    daysToAdd1 += 7;
  }
  daysToAdd1 += 7;
  
  const nextWeekDate1 = new Date(today);
  nextWeekDate1.setDate(today.getDate() + daysToAdd1);
  console.log(`算法1 - 下周${weekdayChar}: ${nextWeekDate1.toLocaleDateString()} (${daysFromToday(nextWeekDate1)}天后)`);
  
  // 算法2：当前算法测试 - 使用(targetDay - dayOfWeek + 7) % 7
  let daysToAdd2 = (targetDay - dayOfWeek + 7) % 7;
  if (daysToAdd2 === 0) {
    daysToAdd2 = 7;
  }
  
  const nextWeekDate2 = new Date(today);
  nextWeekDate2.setDate(today.getDate() + daysToAdd2);
  console.log(`算法2 - 本周${weekdayChar}: ${nextWeekDate2.toLocaleDateString()} (${daysFromToday(nextWeekDate2)}天后)`);
  
  // 测试实际要求的"下周"（本周的下一周）
  let daysToAdd3 = targetDay - dayOfWeek;
  if (daysToAdd3 <= 0) {
    daysToAdd3 += 7;
  }
  
  const nextWeekDate3 = new Date(today);
  nextWeekDate3.setDate(today.getDate() + daysToAdd3 + 7);
  console.log(`算法3 - 正确下周${weekdayChar}: ${nextWeekDate3.toLocaleDateString()} (${daysFromToday(nextWeekDate3)}天后)`);
  
  return {
    algorithm1: nextWeekDate1,
    algorithm2: nextWeekDate2,
    algorithm3: nextWeekDate3
  };
}

// 计算与今天相差的天数
function daysFromToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(date - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 测试所有星期
console.log("===== 测试下周日期计算 =====");
['一', '二', '三', '四', '五', '六', '日'].forEach(weekday => {
  console.log(`\n>>>>> 测试下周${weekday} <<<<<`);
  testNextWeekdayCalculation(weekday);
}); 