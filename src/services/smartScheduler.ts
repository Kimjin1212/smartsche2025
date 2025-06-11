import { SmartTimeSlot } from '../types/schedule';
import { Language } from '../i18n/translations';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface TaskPreferences {
  taskType?: 'work' | 'study' | 'exercise' | 'meeting' | 'other';
  priority?: 1 | 2 | 3 | 4 | 5;
}

export class SmartScheduler {
  getSmartTimeSlots(
    duration: number,
    existingSlots: TimeSlot[],
    date?: Date,
    language: Language = 'zh',
    taskPreferences?: TaskPreferences
  ): SmartTimeSlot[] {
    // 新的推荐时间范围
    const workingHourStart = 6;
    const workingHourEnd = 22;
    const slots: SmartTimeSlot[] = [];
    // 以传入日期为基准，否则用今天
    const baseDate = date ? new Date(date) : new Date();
    baseDate.setHours(workingHourStart, 0, 0, 0);
    const workStart = new Date(baseDate);
    workStart.setHours(workingHourStart, 0, 0, 0);
    const workEnd = new Date(baseDate);
    workEnd.setHours(workingHourEnd, 0, 0, 0);

    // 合并已占用时间段，按开始时间排序
    const sortedSlots = existingSlots
      .map(slot => ({
        start: new Date(slot.startTime),
        end: new Date(slot.endTime)
      }))
      .filter(slot => slot.end > workStart && slot.start < workEnd)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // 找出所有空闲区间
    const freeSlots: { start: Date; end: Date }[] = [];
    let lastEnd = new Date(workStart);
    for (const slot of sortedSlots) {
      if (slot.start > lastEnd) {
        freeSlots.push({ start: new Date(lastEnd), end: new Date(slot.start) });
      }
      if (slot.end > lastEnd) {
        lastEnd = new Date(slot.end);
      }
    }
    if (lastEnd < workEnd) {
      freeSlots.push({ start: new Date(lastEnd), end: new Date(workEnd) });
    }

    // 定义推荐时间段和每段推荐数量
    const ranges = [
      { label: 'morning', start: 6, end: 8, count: 1 },
      { label: 'forenoon', start: 8, end: 12, count: 2 },
      { label: 'afternoon', start: 12, end: 18, count: 2 },
      { label: 'evening', start: 18, end: 22, count: 2 },
    ];

    // 每个时间段推荐指定数量的可用时间
    for (const range of ranges) {
      let foundCount = 0;
      for (const free of freeSlots) {
        // 取当前空闲区间和推荐区间的交集
        const rangeStart = new Date(free.start);
        rangeStart.setHours(range.start, 0, 0, 0);
        const rangeEnd = new Date(free.start);
        rangeEnd.setHours(range.end, 0, 0, 0);
        const slotStart = new Date(Math.max(free.start.getTime(), rangeStart.getTime()));
        const slotEnd = new Date(Math.min(free.end.getTime(), rangeEnd.getTime()));
        let startTime = new Date(slotStart);
        let latestStart = new Date(slotEnd.getTime() - duration * 60000);
        while (startTime <= latestStart && foundCount < range.count) {
          const endTime = new Date(startTime.getTime() + duration * 60000);
          if (endTime > slotEnd) break;
          const explanation = this.getExplanation(startTime.getHours(), language, taskPreferences);
          slots.push({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            explanation
          });
          foundCount++;
          // 跳到下一个可用时间段（避免重叠）
          startTime = new Date(endTime.getTime());
        }
        if (foundCount >= range.count) break;
      }
    }
    return slots;
  }

  private getExplanation(hour: number, language: Language, taskPreferences?: TaskPreferences): string {
    const explanations = {
      en: {
        morning: {
          work: 'Best time for focused work in the morning',
          study: 'Optimal time for morning study sessions',
          exercise: 'Great time for morning exercise',
          meeting: 'Good time for morning meetings',
          other: 'Recommended morning time slot'
        },
        afternoon: {
          work: 'Good time for meetings and collaborative work',
          study: 'Productive time for afternoon study',
          exercise: 'Suitable time for afternoon workout',
          meeting: 'Ideal time for team meetings',
          other: 'Recommended afternoon time slot'
        },
        evening: {
          work: 'Quiet time for wrapping up the day',
          study: 'Good time for evening study',
          exercise: 'Perfect time for evening exercise',
          meeting: 'Suitable for evening meetings',
          other: 'Recommended evening time slot'
        }
      },
      zh: {
        morning: {
          work: '早上是专注工作的最佳时间',
          study: '早上是学习的最佳时间',
          exercise: '早上是锻炼的好时机',
          meeting: '早上适合开会',
          other: '推荐的早上时间段'
        },
        afternoon: {
          work: '下午适合会议和协作工作',
          study: '下午是学习的好时间',
          exercise: '下午适合运动',
          meeting: '下午是团队会议的理想时间',
          other: '推荐的下午时间段'
        },
        evening: {
          work: '傍晚是总结一天工作的安静时间',
          study: '晚上是学习的好时间',
          exercise: '晚上是锻炼的好时机',
          meeting: '晚上适合开会',
          other: '推荐的晚上时间段'
        }
      },
      ja: {
        morning: {
          work: '朝は集中力の高い時間帯です',
          study: '朝は学習に最適な時間です',
          exercise: '朝は運動に良い時間です',
          meeting: '朝は会議に適しています',
          other: '推奨される朝の時間帯'
        },
        afternoon: {
          work: '午後は会議や共同作業に適しています',
          study: '午後は学習に適した時間です',
          exercise: '午後は運動に適しています',
          meeting: '午後はチームミーティングに最適です',
          other: '推奨される午後の時間帯'
        },
        evening: {
          work: '夕方は一日の仕事をまとめる静かな時間です',
          study: '夜は学習に良い時間です',
          exercise: '夜は運動に適した時間です',
          meeting: '夜は会議に適しています',
          other: '推奨される夜の時間帯'
        }
      },
      ko: {
        morning: {
          work: '아침은 집중력이 높은 시간입니다',
          study: '아침은 학습에 최적의 시간입니다',
          exercise: '아침은 운동하기 좋은 시간입니다',
          meeting: '아침은 회의에 적합합니다',
          other: '추천 아침 시간대'
        },
        afternoon: {
          work: '오후는 회의와 협업에 적합합니다',
          study: '오후는 학습하기 좋은 시간입니다',
          exercise: '오후는 운동하기 적합합니다',
          meeting: '오후는 팀 회의에 이상적입니다',
          other: '추천 오후 시간대'
        },
        evening: {
          work: '저녁은 하루 일과를 마무리하는 조용한 시간입니다',
          study: '저녁은 학습하기 좋은 시간입니다',
          exercise: '저녁은 운동하기 좋은 시간입니다',
          meeting: '저녁은 회의에 적합합니다',
          other: '추천 저녁 시간대'
        }
      }
    };

    const timeOfDay = hour < 12 ? 'morning' : hour < 15 ? 'afternoon' : 'evening';
    const taskType = taskPreferences?.taskType || 'other';
    return explanations[language][timeOfDay][taskType];
  }
} 