import { SmartTimeSlot } from '../types/schedule';
import { Language } from '../i18n/translations';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export class SmartScheduler {
  getSmartTimeSlots(
    duration: number,
    existingSlots: TimeSlot[],
    preferredTime?: string,
    language: Language = 'zh'
  ): SmartTimeSlot[] {
    const workingHourStart = 9;
    const workingHourEnd = 18;
    const lunchBreakStart = 12;
    const lunchBreakEnd = 13;

    const slots: SmartTimeSlot[] = [];
    const today = new Date();
    today.setHours(workingHourStart, 0, 0, 0);

    // Convert duration from minutes to hours
    const durationHours = duration / 60;

    // Check each hour slot
    for (let hour = workingHourStart; hour <= workingHourEnd - durationHours; hour++) {
      // Skip lunch break
      if (hour >= lunchBreakStart && hour < lunchBreakEnd) continue;

      const startTime = new Date(today);
      startTime.setHours(hour);
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + duration);

      // Check if this slot conflicts with existing tasks
      const hasConflict = existingSlots.some(slot => {
        const existingStart = new Date(slot.startTime);
        const existingEnd = new Date(slot.endTime);
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      });

      if (!hasConflict) {
        const explanation = this.getExplanation(hour, language);
        slots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          explanation
        });
      }
    }

    return slots;
  }

  private getExplanation(hour: number, language: Language): string {
    const explanations = {
      en: {
        morning: 'Best time for focused work in the morning',
        afternoon: 'Good time for meetings and collaborative work',
        evening: 'Quiet time for wrapping up the day'
      },
      zh: {
        morning: '早上是专注工作的最佳时间',
        afternoon: '下午适合会议和协作工作',
        evening: '傍晚是总结一天工作的安静时间'
      },
      ja: {
        morning: '朝は集中力の高い時間帯です',
        afternoon: '午後は会議や共同作業に適しています',
        evening: '夕方は一日の仕事をまとめる静かな時間です'
      },
      ko: {
        morning: '아침은 집중력이 높은 시간입니다',
        afternoon: '오후는 회의와 협업에 적합합니다',
        evening: '저녁은 하루 일과를 마무리하는 조용한 시간입니다'
      }
    };

    if (hour < 12) {
      return explanations[language].morning;
    } else if (hour < 15) {
      return explanations[language].afternoon;
    } else {
      return explanations[language].evening;
    }
  }
} 