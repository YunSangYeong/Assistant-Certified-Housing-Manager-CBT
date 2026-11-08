import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BASE_BANK as bank, SUBJECTS, PROFILE, createExam, grade, emptyStore, answerExam, submitExam, restoreStore, remainingSeconds, startPractice, checkPractice, nextPractice, validateQuestion, fingerprint, importQuestions, parseCsv } from '../src/model';
const version='housing-main' as const;
describe('등록·중복·출처·수치 변형 감사',()=>{
 it('1000개, 과목 480/480/40, 독립 유형56개, 조건변형960개',()=>{
  expect(bank).toHaveLength(1000); expect(new Set(bank.map(q=>q.id)).size).toBe(1000);
  expect(new Set(bank.map(fingerprint)).size).toBe(1000);
  expect(SUBJECTS.map(s=>bank.filter(q=>q.subject===s).length)).toEqual([480,480,40]);
  expect(bank.filter(q=>!q.family)).toHaveLength(40);
  const families=new Set(bank.filter(q=>q.family).map(q=>q.family)); expect(families.size).toBe(16);
  for(const family of families){const qs=bank.filter(q=>q.family===family);expect(qs).toHaveLength(60);expect(new Set(qs.map(q=>JSON.stringify(q.calculation?.values))).size).toBe(60);}
  for(const q of bank){expect(()=>validateQuestion(q)).not.toThrow();expect(q.year).toBeNull();expect(q.session).toBeNull();expect(q.type).toBe('original');expect(q.reviewNote).toContain('外部'.replace('外部','외부'));}
 });
 // Independent algebra / unit route. No generated result is used to derive expected answers.
 const equations:Record<string,(v:number[])=>number>={
 '회계등식':v=>v[0]-v[1], '매출총이익':v=>v[0]-v[1], '정액법':v=>(v[0]-v[1])/v[2],
 '유동비율':v=>100/(v[1]/v[0]), '재고자산':v=>v[0]-v[2]+v[1], '손익분기점':v=>v[2]/(v[0]-v[1]),
 '단리 이자':v=>v[0]*(v[1]*v[2]), '당기순이익':v=>v[0]-v[1],
 '열전도':v=>v[2]/(v[3]/(v[0]*v[1])), '유량':v=>v.reduce((a,b)=>a*b,1),
 '정수압':v=>(v[0]/1000)*v[1]*v[2], '물의 가열':v=>v[1]*(v[2]*v[0]),
 '응력':v=>(v[0]*1e3)/(v[1]*1e-6)/1e6, '환기횟수':v=>v[0]/v[1],
 '열저항':v=>v[0]*(1/v[1]), '펌프 수동력':v=>v.reduce((a,b)=>a*b,1)
 };
 for(const q of bank.filter(q=>q.calculation)) it(`${q.id} 독립 재계산·단위·답안·동치보기`,()=>{
  const c=q.calculation!;const expected=equations[c.kind](c.values);
  expect(c.result).toBeCloseTo(expected,8);
  const values=q.choices.map(x=>Number(x.split(' ')[0]));
  expect(values[q.answer-1]).toBeCloseTo(expected,8);expect(new Set(values).size).toBe(5);
  expect(values.filter(x=>Math.abs(x-expected)<1e-8)).toHaveLength(1);
  expect(q.choices.every(x=>x.endsWith(' '+c.unit))).toBe(true);
  expect(q.explanation).toContain(c.unit);expect(q.explanation.length).toBeGreaterThan(25);
 });
 it('생성 결과와 기본 JSON·CSV 양식 검증',()=>{
  const templates=JSON.parse(readFileSync('public/templates/questions.json','utf8'));
  expect(importQuestions(templates,bank).added).toHaveLength(1);
  expect(importQuestions(parseCsv(readFileSync('public/templates/questions.csv','utf8')),bank).added).toHaveLength(1);
 });
});
describe('1차 학습용 시험·과락·저장·연습',()=>{
 it('정확한 과목 수, 5지선다, pending 제외·순서·기한',()=>{
  const e=createExam(bank,version,100);expect(e.questions).toHaveLength(120);
  expect(new Set(e.questions.map(q=>q.id)).size).toBe(120);
  expect(SUBJECTS.map(s=>e.questions.filter(q=>q.subject===s).length)).toEqual([40,40,40]);
  expect(e.questions.slice(0,40).every(q=>q.subject===SUBJECTS[0])).toBe(true);
  expect(e.deadline).toBe(100+9000000);
  expect(()=>createExam(bank.map(q=>({...q,verificationStatus:'pending'})),version)).toThrow();
 });
 for(const [counts,passed] of [[[24,24,24],true],[[23,24,24],false],[[15,40,40],false],[[16,28,28],true]] as const){
  it(`채점 경계 ${counts}`,()=>{
   const e=createExam(bank,version); SUBJECTS.forEach((s,i)=>e.questions.filter(q=>q.subject===s).slice(0,counts[i]).forEach(q=>e.answers[q.id]=q.answer));
   expect(grade(e).passed).toBe(passed);
  });
 }
 it('답안 변경·기한 초과 동결·자동 제출·중복 방지·복원',()=>{
  let s={...emptyStore(),exam:createExam(bank,version,100)};const q=s.exam.questions[0];
  s=answerExam(s,q.id,5,200) as typeof s; expect(s.exam.answers[q.id]).toBe(5);
  s=answerExam(s,q.id,2,201) as typeof s; expect(s.exam.answers[q.id]).toBe(2);
  expect(restoreStore(JSON.stringify(s))).toEqual(s);
  const done=answerExam(s,q.id,3,s.exam.deadline);expect(done.exam).toBeNull();expect(done.results[0].answers[q.id]).toBe(2);
  expect(submitExam(done)).toEqual(done);expect(done.attempts).toHaveLength(120);
 });
 it('미응답·시간 경계·손상 기록 거부',()=>{
  expect(grade(createExam(bank,version)).unanswered).toBe(120);
  expect(remainingSeconds(1000,999)).toBe(1);expect(remainingSeconds(1000,1000)).toBe(0);
  expect(()=>restoreStore('{')).toThrow();expect(()=>restoreStore(JSON.stringify({...emptyStore(),exam:{deadline:1}}))).toThrow();
 });
 it('랜덤 전체 순회 중복 없음·채점 1회·오답 정답 해제',()=>{
  const subset=bank.slice(0,4);let s={...emptyStore(),practice:startPractice(subset,version)};
  const seen=new Set<string>();
  for(let i=0;i<4;i++){const q=subset.find(q=>q.id===s.practice.currentId)!;expect(seen.has(q.id)).toBe(false);seen.add(q.id);
   s.practice.selected=q.answer;s=checkPractice(s,subset) as typeof s;const n=s.attempts.length;s=checkPractice(s,subset) as typeof s;expect(s.attempts).toHaveLength(n);
   s.practice=nextPractice(s.practice,subset);
  }
  expect(s.practice.correct).toBe(4);
 });
 it('ID·보기 재배치 중복 제거·원자적 가져오기·5번째 보기 필수',()=>{
  const q=bank[0];expect(importQuestions([{...q,id:'duplicate',choices:[...q.choices].reverse()}],bank).duplicates).toBe(1);
  expect(()=>importQuestions([{...q,id:'good',question:'독립 문제'},{}],bank)).toThrow();
  expect(()=>validateQuestion({...q,choices:q.choices.slice(0,4)})).toThrow();
  const imported=importQuestions([{...q,id:'new',question:'독립 문제'}],bank).added[0];expect(imported.verificationStatus).toBe('pending');
 });
 it('규칙을 공식 검증 완료로 표시하지 않는다',()=>{expect(PROFILE.rulesVerificationStatus).toBe('pending-official-access');});
});
