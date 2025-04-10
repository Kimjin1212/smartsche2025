// 测试特定输入"下周一晚上八点会议"的日期计算
const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const zhWeekdayMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
};

// 输入句子
const inputText = "下周一晚上八点会议";

// 解析星期几
const weekdayMatch = inputText.match(/下[个個]?(?:周|週|星期|礼拜|禮拜)([一二三四五六日天])/);
let weekdayChar = null;
let targetDay = null;

if (weekdayMatch && weekdayMatch[1]) {
  weekdayChar = weekdayMatch[1];
  targetDay = zhWeekdayMap[weekdayChar];
  console.log(`匹配到星期: ${weekdayChar}, 对应数字: ${targetDay}`);
} else {
  console.log("未匹配到星期几");
}

// 获取当前日期
const today = new Date();
today.setHours(0, 0, 0, 0);
console.log(`今天是: ${today.toLocaleDateString()}, 星期${dayNames[today.getDay()]}`);

// 计算不同方法的下周一日期
if (targetDay !== null) {
  // 当前使用的算法
  const dayOfWeek = today.getDay(); // 0-6, 周日为0
  
  // 方法1：使用 target - current + 7，确保下一周
  let days1 = targetDay - dayOfWeek;
  if (days1 <= 0) {
    days1 += 7;
  }
  days1 += 7; // 再加7天，确保是下周
  
  const date1 = new Date(today);
  date1.setDate(today.getDate() + days1);
  console.log(`方法1 (target - current + 7, 确保下一周): ${date1.toLocaleDateString()}`);
  
  // 方法2：先计算本周对应日期，然后再加7天
  let days2 = targetDay - dayOfWeek;
  if (days2 <= 0) {
    days2 += 7; // 如果已过本周目标日，调整到下周
  }
  const thisWeekDate = new Date(today);
  thisWeekDate.setDate(today.getDate() + days2);
  
  const date2 = new Date(thisWeekDate);
  console.log(`本周${weekdayChar}: ${thisWeekDate.toLocaleDateString()}`);
  
  // 再加7天到下周
  const nextWeekDate = new Date(thisWeekDate);
  nextWeekDate.setDate(thisWeekDate.getDate() + 7);
  console.log(`下周${weekdayChar} (本周对应日期+7): ${nextWeekDate.toLocaleDateString()}`);
  
  // 方法3：直接通过日期计算
  const currentMonday = new Date(today);
  const diff = today.getDay() - 1; // 计算到本周一的差距（周日=0）
  if (diff === -1) { // 如果今天是周日
    currentMonday.setDate(today.getDate() - 6); // 退到上周一
  } else {
    currentMonday.setDate(today.getDate() - diff); // 计算本周一
  }
  console.log(`本周一: ${currentMonday.toLocaleDateString()}`);
  
  // 下周一就是本周一加7天
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  console.log(`下周一: ${nextMonday.toLocaleDateString()}`);
  
  // 通过当前年月设置为特定日期
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // 14号和21号哪个是下周一？
  const date14 = new Date(currentYear, currentMonth, 14);
  const date21 = new Date(currentYear, currentMonth, 21);
  
  console.log(`4月14日是星期${dayNames[date14.getDay()]}`);
  console.log(`4月21日是星期${dayNames[date21.getDay()]}`);
}

// 完整的正确方法：计算下周一的日期
function getCorrectNextMonday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 找到本周一
  const thisMonday = new Date(today);
  const daysSinceMonday = (today.getDay() + 6) % 7; // 将周日=0改为周一=0的体系
  thisMonday.setDate(today.getDate() - daysSinceMonday);
  
  // 下周一就是本周一+7
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);
  
  return nextMonday;
}

const correctNextMonday = getCorrectNextMonday();
console.log(`\n正确的下周一计算结果: ${correctNextMonday.toLocaleDateString()}`);

// 测试所有计算方法
function testAllMethods() {
  console.log("\n===== 测试所有下周一计算方法 =====");
  
  // 方法1：调整dayOfWeek对周日的处理
  function method1() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 修正的targetDay和dayOfWeek
    const targetDay = 1; // 周一
    const dayOfWeek = today.getDay(); // 0-6, 周日为0
    
    let daysToAdd = targetDay - dayOfWeek;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // 如果是周一或已过周一，则取下周一
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return nextDate;
  }
  
  // 方法2：本周一+7天
  function method2() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 找到本周一
    const thisMonday = new Date(today);
    let daysSinceMonday = today.getDay() - 1; // 周一=0, 周二=1, ...
    if (daysSinceMonday < 0) daysSinceMonday = 6; // 周日特殊处理
    
    thisMonday.setDate(today.getDate() - daysSinceMonday);
    
    // 下周一
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);
    
    return nextMonday;
  }
  
  const result1 = method1();
  const result2 = method2();
  
  console.log(`方法1 (差值计算): ${result1.toLocaleDateString()}`);
  console.log(`方法2 (本周一+7): ${result2.toLocaleDateString()}`);
}

testAllMethods(); 