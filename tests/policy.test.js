const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../servicenow/ProjectPlanningPolicy');
const p = new P();
const finance = () => ({id:'F',budget_paise:10000,actual_paise:4000,etc_paise:7000,remaining_commitments_paise:2000,earned_value_paise:3000,planned_value_paise:5000});
const gov = () => ({id:'G',as_of:'2026-11-17',evidence_date:'2026-11-01',decision_due:'2026-11-20',owner:'Synthetic sponsor',likelihood:3,impact:5,risk_response_agreed:true,sponsor_approval:'approved',business_case_complete:true});
const plan = () => ({id:'P',start_date:'2026-11-01',deadline:'2026-11-10',tasks:[
 {id:'A',duration_days:2,depends_on:[],resource:'r1',allocation_pct:100,done:true},
 {id:'B',duration_days:4,depends_on:['A'],resource:'r2',allocation_pct:100,done:false},
 {id:'C',duration_days:3,depends_on:['A'],resource:'r2',allocation_pct:100,done:false},
 {id:'D',duration_days:2,depends_on:['B'],resource:'r3',allocation_pct:100,done:false},
 {id:'E',duration_days:1,depends_on:['C'],resource:'r4',allocation_pct:100,done:false},
 {id:'F',duration_days:2,depends_on:['D','E'],resource:'r5',allocation_pct:100,done:false}]});
test('planning: hand-calculated longest path and deadline',()=>{const r=p.planning(plan());assert.equal(r.duration_days,10);assert.equal(r.finish_date,'2026-11-11');assert.equal(r.deadline_slip_days,0);assert.deepEqual(r.critical_task_ids,['A','B','D','F'])});
test('planning: backward pass computes noncritical float',()=>{const r=p.planning(plan());assert.equal(r.schedule.find(t=>t.id==='C').float_days,2);assert.equal(r.schedule.find(t=>t.id==='E').float_days,2)});
test('planning: only tasks with completed dependencies are ready',()=>assert.deepEqual(p.planning(plan()).ready_task_ids,['B','C']));
test('planning: catches three days of 200% allocation',()=>{const r=p.planning(plan());assert.equal(r.overloaded_resource_days,3);assert.equal(r.conflicts[0].allocation_pct,200)});
test('planning: finish-exclusive intervals avoid false conflict',()=>{const d=plan();d.tasks[3].resource='r2';assert.equal(p.planning(d).overloaded_resource_days,3)});
test('planning: exactly 100% combined allocation is fine',()=>{const d=plan();d.tasks[1].allocation_pct=50;d.tasks[2].allocation_pct=50;assert.equal(p.planning(d).overloaded_resource_days,0)});
test('planning: source order does not change schedule',()=>{const d=plan();d.tasks.reverse();assert.deepEqual(p.planning(d),p.planning(plan()))});
test('planning: cycle rejected',()=>{const d=plan();d.tasks[0].depends_on=['F'];assert.throws(()=>p.planning(d),/cycle/)});
test('planning: unknown predecessor rejected',()=>{const d=plan();d.tasks[1].depends_on=['Z'];assert.throws(()=>p.planning(d),/Unknown/)});
test('planning: duplicate task rejected',()=>{const d=plan();d.tasks[1].id='A';assert.throws(()=>p.planning(d))});
test('planning: duplicate dependency rejected',()=>{const d=plan();d.tasks[1].depends_on=['A','A'];assert.throws(()=>p.planning(d))});
test('planning: completed successor cannot precede unfinished predecessor',()=>{const d=plan();d.tasks[3].done=true;assert.throws(()=>p.planning(d))});
test('planning: zero duration rejected',()=>{const d=plan();d.tasks[1].duration_days=0;assert.throws(()=>p.planning(d))});
test('planning: over-100% task rejected',()=>{const d=plan();d.tasks[1].allocation_pct=101;assert.throws(()=>p.planning(d))});
test('planning: empty network rejected',()=>{const d=plan();d.tasks=[];assert.throws(()=>p.planning(d))});
test('deterministic policy leaves source unchanged',()=>{const d=plan();const before=JSON.stringify(d);assert.deepEqual(p.planning(d),p.planning(d));assert.equal(JSON.stringify(d),before)});
test('planning: deadline is the last allowed working day (inclusive)',()=>{const d=plan();d.deadline='2026-11-09';assert.equal(p.planning(d).deadline_slip_days,1);d.deadline='2026-11-10';assert.equal(p.planning(d).deadline_slip_days,0);d.deadline='2026-11-11';assert.equal(p.planning(d).deadline_slip_days,0)});
