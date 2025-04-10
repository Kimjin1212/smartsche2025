import { NLPService } from './services/nlpService';

const testInput = process.argv[2] || "having a Sex with lisa at may18th识别日期不准";

const result = NLPService.getInstance().testInput(testInput);
console.log('Input:', testInput);
console.log('Result:', JSON.stringify(result, null, 2)); 