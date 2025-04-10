import { extractTaskContent } from './nlpService';

// 测试各种英文词组的处理
function testPhraseExtraction() {
  // 定义测试用例 - 包含常见前缀和词组
  const testCases = [
    // 带有前缀的常见词组
    'have a birthday party',
    'have a meeting with John',
    'need to attend job interview',
    'going to business meeting',
    'should schedule a dentist appointment',
    'remember to pick up groceries',
    'have a team lunch tomorrow',
    'need to submit project report',
    'have a coffee break at 3pm',
    'must complete performance review',
    'don\'t forget to call mom',
    'have a doctor appointment at 2pm',
    'have dinner party on Friday',
    'attend yoga class at 7pm',
    
    // 空格缺失的情况
    'havea birthdayparty',
    'havea coffee break',
    'need toattend job interview',
    'goingto business meeting',
    
    // 带有时间的词组
    'have a meeting at 2pm',
    'need to go to doctor appointment tomorrow at 3:30',
    'remember to pick up kids from elementary school at 4pm',
    'attend high school reunion next Saturday',
    
    // 语法变体
    'will have performance review',
    'should have a team building exercise',
    'need to schedule a phone interview',
    'going to have a client meeting',
    
    // 复杂情况
    'need to prepare presentation for board meeting next Tuesday at 10am',
    'have to pick up kids from elementary school and go to grocery shopping',
    'remember to call mom and wish her happy birthday',
    'should schedule dentist appointment for next month',
    
    // 特殊词组组合
    'have lunch meeting with team',
    'attend technical interview at tech company',
    'schedule annual checkup at medical center',
    'prepare quarterly review for department meeting',
  ];
  
  console.log('测试词组提取功能：');
  console.log('---------------------------------------------------');
  
  // 处理每个测试用例
  testCases.forEach(testCase => {
    const result = extractTaskContent(testCase);
    console.log(`输入: "${testCase}"`);
    console.log(`输出: "${result}"`);
    console.log('---------------------------------------------------');
  });
}

// 执行测试
testPhraseExtraction(); 