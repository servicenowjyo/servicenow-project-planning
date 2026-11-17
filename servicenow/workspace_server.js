/* Jelly server code. Reads live persisted ServiceNow results; no fixture results embedded. */
var out='';
if(!gs.hasRole('admin')) out='<p>Administrator role required.</p>';
else {
 function esc(x){return GlideStringUtil.escapeHTML(String(x === null || typeof x === 'undefined' ? '' : x));}
 function money(x){return 'INR '+(Number(x)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
 var selected="planning";
 var tables={"planning":"u_ppc_planning"};
 if(!tables[selected])selected='finance';
 var titles={finance:'Project Financial Management',governance:'Project Governance',planning:'Project Planning'};
 var subtitles={finance:'Catch forecast overruns and explain cost performance before the next review.',governance:'Make missing approvals, stale evidence and unmanaged risk visible at each gate.',planning:'Calculate critical activities, float, deadline exposure and resource conflicts.'};
 var gr=new GlideRecord(tables[selected]);gr.addQuery('u_key','STARTSWITH','PPC-');gr.orderBy('u_key');gr.query();
 var records=[],flagged=0,rows='',firstPlan=null;
 while(gr.next()){
  var resultText=gr.getValue('u_result'),r=resultText?JSON.parse(resultText):null;
  var record={id:gr.getValue('u_key'),name:gr.getValue('u_name'),sysid:gr.getUniqueValue(),status:gr.getValue('u_status'),r:r};records.push(record);
  if(!r || record.status==='REVIEW' || record.status==='HOLD')flagged++;
  var link='<a href="'+tables[selected]+'.do?sys_id='+esc(record.sysid)+'">'+esc(record.id)+'</a>';
  rows+='<tr><td>'+link+'<small>'+esc(record.name)+'</small></td>';
  if(!r)rows+='<td colspan="6"><span class="warn">NEEDS REVIEW</span> Source edited. Use the record review button.</td>';
  else if(selected==='finance')rows+='<td>'+money(r.forecast_paise)+'</td><td class="'+(r.variance_at_completion_paise<0?'negative':'positive')+'">'+money(r.variance_at_completion_paise)+'</td><td>'+(r.cpi===null?'N/A':esc(r.cpi))+'</td><td>'+(r.spi===null?'N/A':esc(r.spi))+'</td><td><span class="pill '+(r.status==='REVIEW'?'warn':'good')+'">'+esc(r.status)+'</span><small>'+esc(r.actions.join(' | ') || 'No review flags')+'</small></td>';
  else if(selected==='governance')rows+='<td>'+esc(gr.getValue('u_owner') || 'Unassigned')+'</td><td>'+r.risk_score+' / 25</td><td>'+r.evidence_age_days+' days</td><td><span class="pill '+(r.gate_decision==='HOLD'?'warn':'good')+'">'+esc(r.gate_decision)+'</span></td><td>'+esc(r.actions.join(' | ') || 'Evidence ready for human decision')+'</td>';
  else {rows+='<td>'+r.duration_days+' days</td><td>'+esc(r.finish_date)+'</td><td>'+esc(r.critical_task_ids.join(' → '))+'</td><td>'+r.deadline_slip_days+' days</td><td>'+r.overloaded_resource_days+'</td><td>'+esc(r.ready_task_ids.join(', '))+'</td>';if(!firstPlan)firstPlan=r;}
  rows+='</tr>';
 }
 out='<header><div><div class="eyebrow">SERVICENOWJYO / WORKING SERVICENOW APPLICATION</div><h1>Project Planning</h1><p>Independent working ServiceNow project</p></div><span class="instance">'+GlideStringUtil.escapeHTML(gs.getProperty('instance_name'))+'</span></header><main><nav>';
 for(var k in tables)out+='<a class="'+(k===selected?'selected':'')+'" href="u_project_planning.do?sysparm_module='+k+'">'+titles[k]+'</a>';
 out+='</nav><div class="banner">SYNTHETIC INDUSTRIAL PROJECT DATA · Fixed assessment: 17 Nov 2026 · Custom implementation; independent of licensed SPM modules</div><h2>'+titles[selected]+'</h2><p class="lead">'+subtitles[selected]+'</p><div class="cards"><article><span>Persisted assessments</span><b>'+records.length+'</b></article><article><span>Require attention</span><b class="amber">'+flagged+'</b></article><article><span>'+(selected==='planning'?'Activities in all plans':'Ready / on track')+'</span><b>'+(selected==='planning'?'36':records.length-flagged)+'</b></article><article><span>Workflow</span><strong>Edit → Save → Review</strong><small>Results written back to the record</small></article></div><section><h3>Live record results</h3><p>Open a record to edit its source fields and run its Review button. Source edits invalidate old advice.</p><div class="scroll"><table><thead><tr><th>Assessment / project</th>';
 out+=selected==='finance'?'<th>Forecast at completion</th><th>Budget minus forecast</th><th>CPI</th><th>SPI</th><th>Review advice</th>':selected==='governance'?'<th>Accountable owner</th><th>Risk score</th><th>Evidence age</th><th>Gate readiness</th><th>Required action</th>':'<th>Duration</th><th>Finish (exclusive)</th><th>Critical activities</th><th>Deadline slip</th><th>Overloaded resource-days</th><th>Ready activities</th>';
 out+='</tr></thead><tbody>'+rows+'</tbody></table></div></section>';
 if(firstPlan){
  out+='<section><h3>Critical path and float · '+esc(firstPlan.id)+'</h3><p>Calendar-day offsets from plan start. Baseline earliest-start schedule; capacity conflicts are flagged, not automatically levelled.</p><div class="gantt">';
  for(var i=0;i<firstPlan.schedule.length;i++){var t=firstPlan.schedule[i];out+='<div class="gantt-row"><b>'+esc(t.id)+'</b><div class="track"><span class="bar '+(t.float_days===0?'critical':'')+'" style="margin-left:'+(t.es/firstPlan.duration_days*100)+'%;width:'+((t.ef-t.es)/firstPlan.duration_days*100)+'%">'+t.es+'–'+t.ef+'</span></div><span>Float: '+t.float_days+'d</span></div>';}
  out+='</div></section>';
 }
 var notes={finance:'Forecast = actual + estimate to complete (ETC). Remaining commitments are already included in ETC. CPI = earned value / actual; SPI = earned value / planned value. N/A means a zero denominator. Assessments are separate snapshots; do not sum them as distinct projects.',
 governance:'HOLD means one or more evidence checks failed. READY_FOR_REVIEW means ready for an accountable human decision; it is not an approval. Risk = likelihood × impact. Evidence becomes stale after 30 days.',
 planning:'Finish-to-start dependencies, zero lag, calendar days and finish-exclusive intervals. Critical means zero float. Each resource has 100% daily capacity; resource-day counts are not a monetary benefit. No work is automatically assigned.'};
 out+='<section class="method"><h3>How the control works</h3><p>'+notes[selected]+'</p><p><b>Application components:</b> 1 project table · Dedicated JavaScript policy · Service layer · Form review actions · Stale-advice invalidation rules</p></section><footer>Working developer-instance implementation · Synthetic inputs · Human decisions retained · github.com/servicenowjyo</footer></main>';
}
out;
