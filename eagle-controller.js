/* RP Eagle Operational Brain v9.13.0
   Role-aware orchestration across the RP application.
   Eagle routes to existing workflows and never bypasses RP permissions.
*/
(function(){
  'use strict';

  const VERSION='9.13.0';
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-zA-Z0-9#\-]+/g,' ').toLowerCase().replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayISO=()=>new Date().toISOString().slice(0,10);
  const ctxKey=()=>`rp-eagle-context-${currentUser?.username||'anonymous'}`;
  const getCtx=()=>{try{return JSON.parse(sessionStorage.getItem(ctxKey()))||{}}catch{return{}}};
  const setCtx=x=>{try{sessionStorage.setItem(ctxKey(),JSON.stringify(x||{}))}catch{}};
  const activePeople=()=>Array.isArray(state?.personnel)?state.personnel.filter(p=>p&&p.employeeNumber&&p.name&&p.status==='Active'):[];
  const currentPerson=()=>activePeople().find(p=>String(p.employeeNumber)===String(currentUser?.employeeNumber||''))||null;
  const taskRows=()=>Array.isArray(state?.tasks)?state.tasks.filter(t=>t&&t.status==='Active'):[];
  const subtaskRows=()=>Array.isArray(state?.subtasks)?state.subtasks.filter(s=>s&&s.status==='Active'):[];
  const isAdmin=()=>currentUser?.role==='admin';
  const isEvaluator=()=>currentUser?.role==='admin'||currentUser?.role==='evaluator';

  function personScore(p,q){
    const nq=norm(q),name=norm(p.name),emp=norm(p.employeeNumber);
    if(!nq)return 0;
    let score=0;
    if(new RegExp(`(^| )#?${emp}( |$)`).test(nq))score+=160;
    if(nq.includes(name))score+=150;
    for(const part of name.split(' ').filter(Boolean))if(part.length>2&&nq.split(' ').includes(part))score+=35;
    return score;
  }
  function resolvePerson(q,{useSelf=true}={}){
    const rows=activePeople().map(p=>({p,score:personScore(p,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(rows[0]?.score)return rows[0].p;
    const ctx=getCtx();
    if(ctx.employeeNumber){
      const p=activePeople().find(x=>String(x.employeeNumber)===String(ctx.employeeNumber));
      if(p)return p;
    }
    return useSelf?currentPerson():null;
  }
  function resolveTask(q){
    const nq=norm(q),ctx=getCtx();let best=null,score=0;
    for(const t of taskRows()){
      const id=norm(t.id),name=norm(t.name);let s=0;
      if(id&&new RegExp(`(^| )${id}( |$)`).test(nq))s+=160;
      if(name&&nq.includes(name))s+=130;
      for(const part of name.split(' ').filter(x=>x.length>4))if(nq.includes(part))s+=10;
      if(s>score){score=s;best=t}
    }
    for(const st of subtaskRows()){
      const id=norm(st.id),name=norm(st.name);let s=0;
      if(id&&new RegExp(`(^| )${id}( |$)`).test(nq))s+=180;
      if(name&&nq.includes(name))s+=140;
      if(s>score){score=s;best=taskRows().find(t=>String(t.id)===String(st.taskId))||best}
    }
    if(best)return best;
    return ctx.taskId?taskRows().find(t=>String(t.id)===String(ctx.taskId))||null:null;
  }
  function resolveSubtask(q){
    const nq=norm(q);let best=null,score=0;
    for(const st of subtaskRows()){
      const id=norm(st.id),name=norm(st.name);let s=0;
      if(id&&new RegExp(`(^| )${id}( |$)`).test(nq))s+=180;
      if(name&&nq.includes(name))s+=140;
      for(const part of name.split(' ').filter(x=>x.length>4))if(nq.includes(part))s+=10;
      if(s>score){score=s;best=st}
    }
    return best;
  }
  function resolveEvaluator(q){
    const nq=norm(q);let best=null,score=0;
    for(const u of (authUsers||[]).filter(u=>u&&!u.disabled&&(u.role==='admin'||u.role==='evaluator'))){
      const name=norm(u.name||u.username),user=norm(u.username);let s=0;
      if(name&&nq.includes(name))s+=150;
      if(user&&new RegExp(`(^| )${user}( |$)`).test(nq))s+=110;
      for(const part of name.split(' ').filter(x=>x.length>2))if(nq.split(' ').includes(part))s+=30;
      if(s>score){score=s;best=u}
    }
    return best;
  }

  function classify(q){
    const s=norm(q);
    if(/\b(assign|schedule|create|new|give|set up|setup)\b/.test(s)&&/\b(assessment|evaluation|training|assignment)\b/.test(s))return'assign_create';
    if(/\b(add|create|new)\b/.test(s)&&/\b(employee|associate|personnel|worker)\b/.test(s))return'person_create';
    if(/\b(add|create|new)\b/.test(s)&&/\b(metl|task|subtask)\b/.test(s))return'task_create';
    if(/\b(assigned to me|need to evaluate|waiting for me|my evaluations|my assessments to evaluate)\b/.test(s))return'assign_evaluator';
    if(/\b(my|mine|me)\b/.test(s)&&/\b(assigned|assignment|assessment|evaluation)\b/.test(s))return'assign_my';
    if(/\b(overdue|late|past due)\b/.test(s)&&/\b(assign|assessment|evaluation)\b/.test(s))return'assign_overdue';
    if(/\b(assign|assigned|assignment)\b/.test(s))return'assign_list';
    if(/\b(start|conduct|perform|do|open)\b/.test(s)&&/\b(assessment|evaluation)\b/.test(s))return'assessment_start';
    if(/\b(assessment history|evaluation history|past assessments|previous assessments|history)\b/.test(s))return'assessment_history';
    if(/\b(advance|advancement|promotion|next level|move up|improve|what do i need|what am i missing|gap|gaps)\b/.test(s))return'advancement';
    if(/\b(readiness|ready|preparation)\b/.test(s)&&/\b(shift|a shift|b shift|c shift|d shift|department|plant|overall)\b/.test(s))return'readiness_group';
    if(/\b(readiness|ready|preparation)\b/.test(s))return'readiness_person';
    if(/\b(critical gate|critical gates|critical failure|safety gate)\b/.test(s))return'critical';
    if(/\b(corrective|corrective action|corrective actions|reassessment|reassessments|overdue action|open action)\b/.test(s))return'corrective';
    if(/\b(who can evaluate|who is authorized to evaluate|which evaluator|authorized evaluator)\b/.test(s))return'evaluator_authority';
    if(/\b(who can|qualified|qualification|independent|independently|authorized to perform)\b/.test(s))return'qualified';
    if(/\b(how do|how to|procedure|instruction|instructions|standard work|approved procedure|knowledge|wiki)\b/.test(s))return'knowledge';
    if(/\b(task|subtask|metl)\b/.test(s))return'task_info';
    if(/\b(backup|restore|data integrity)\b/.test(s))return'backup';
    if(/\b(notification|notifications|alerts)\b/.test(s))return'notifications';
    if(/\b(audit|audit trail|history of changes|who changed)\b/.test(s))return'audit';
    if(/\b(department|departments)\b/.test(s))return'departments';
    if(/\b(user|users|account|accounts|password|permissions|permission|role|roles)\b/.test(s))return'user_admin';
    if(/\b(profile|my profile)\b/.test(s))return'profile';
    if(/\b(dashboard|home)\b/.test(s))return'dashboard';
    if(/\b(personnel|employees|associates|people)\b/.test(s))return'personnel';
    if(/\b(matrix|readiness matrix)\b/.test(s))return'matrix';
    if(/\b(engine|engines|diagnostic|enterprise)\b/.test(s))return'enterprise';
    if(resolvePerson(q,{useSelf:false}))return'person';
    return'general';
  }

  function statusOfAssignment(a){
    if(typeof window.assignmentStatus==='function')return window.assignmentStatus(a);
    if(a.status==='Completed'||a.status==='Cancelled')return a.status;
    if(a.dueDate&&a.dueDate<todayISO())return'Overdue';
    if(a.dueDate===todayISO())return'Due Today';
    return a.status||'Assigned';
  }
  function visibleAssignments(){
    const all=(state.assessmentAssignments||[]).filter(Boolean);
    if(currentUser?.role==='viewer')return all.filter(a=>String(a.employeeNumber)===String(currentUser.employeeNumber||''));
    if(currentUser?.role==='evaluator')return all.filter(a=>String(a.evaluatorUsername||'').toLowerCase()===String(currentUser.username||'').toLowerCase());
    return all;
  }
  function assignmentCard(a){
    const p=activePeople().find(x=>String(x.employeeNumber)===String(a.employeeNumber))||{};
    const t=taskRows().find(x=>String(x.id)===String(a.taskId))||{};
    const st=statusOfAssignment(a);
    const canOpen=isAdmin()||(currentUser?.role==='evaluator'&&String(a.evaluatorUsername||'').toLowerCase()===String(currentUser.username||'').toLowerCase());
    return `<div class="eagle-result-card"><b>${esc(p.name||a.employeeName||a.employeeNumber)} — ${esc(t.id||a.taskId)}</b><small>${esc(t.name||a.taskName||'')} · Evaluator: ${esc(a.evaluatorName||'—')} · Due ${esc(a.dueDate||'—')} · ${esc(st)}</small>${canOpen&&!['Completed','Cancelled'].includes(st)?`<button class="secondary eagle-open-assignment" data-id="${esc(a.id)}">Open assessment</button>`:''}</div>`;
  }

  function advancement(person){
    if(!person)return '<p>I need an associate to answer that. Try a name or employee number.</p>';
    const m=RulesEngine.qualificationSummary(state,person),levels=['-10','-20','-30','-40'],idx=levels.indexOf(person.assignedLevel||'-10'),next=idx>=0&&idx<levels.length-1?levels[idx+1]:null;
    const latest=latestResults(person.employeeNumber),req=next?state.subtasks.filter(s=>s.status==='Active'&&levelRank[s.requiredLevel]<=levelRank[next]):[],gaps=req.filter(s=>latest.get(`${person.employeeNumber}|${s.id}`)?.result!=='GO');
    const actions=(state.actions||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&a.status!=='Closed');
    const assigned=(state.assessmentAssignments||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&!['Completed','Cancelled'].includes(a.status));
    if(!next)return `<h3>${esc(person.name)}</h3><p>This associate is already assigned to the highest level (${esc(person.assignedLevel)}).</p><button class="secondary eagle-person" data-emp="${esc(person.employeeNumber)}">Open profile</button>`;
    return `<h3>${esc(person.name)} → ${esc(next)}</h3><p><b>Current readiness:</b> ${m.pct}% · <b>${gaps.length}</b> requirement${gaps.length===1?'':'s'} still not recorded GO for the next level.</p>${actions.length?`<p><b>${actions.length} open corrective action${actions.length===1?'':'s'}</b> should be resolved.</p>`:''}${assigned.length?`<p><b>${assigned.length} assigned assessment${assigned.length===1?'':'s'}</b> already scheduled.</p>`:''}${gaps.length?`<div class="eagle-mini-list">${gaps.slice(0,6).map(s=>`<div><b>${esc(s.id)}</b><span>${esc(s.name)}</span></div>`).join('')}</div>`:'<p>No missing GO requirements are visible for the next level.</p>'}<button class="secondary eagle-person" data-emp="${esc(person.employeeNumber)}">Open ${esc(person.name)}'s profile</button>`;
  }
  function personReadiness(person){
    if(!person)return '<p>Tell me which associate you want to review.</p>';
    const m=RulesEngine.qualificationSummary(state,person),acts=(state.actions||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&a.status!=='Closed'),asn=(state.assessmentAssignments||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&!['Completed','Cancelled'].includes(a.status));
    return `<h3>${esc(person.name)}</h3><p><b>Assigned level:</b> ${esc(person.assignedLevel)} · <b>Readiness:</b> ${m.pct}% · <b>Highest fully qualified:</b> ${esc(m.highestFullyQualified)}</p><p><b>Open actions:</b> ${acts.length} · <b>Assigned assessments:</b> ${asn.length}</p><button class="secondary eagle-person" data-emp="${esc(person.employeeNumber)}">Open employee profile</button>`;
  }
  function groupReadiness(q){
    const s=norm(q),m=s.match(/\b([abcd]) shift\b/),shifts=m?[m[1].toUpperCase()]:['A','B','C','D'];
    const rows=shifts.map(sh=>{const ps=activePeople().filter(p=>p.shift===sh),pct=ps.length?Math.round(ps.reduce((n,p)=>n+RulesEngine.qualificationSummary(state,p).pct,0)/ps.length):0;return{sh,pct,count:ps.length}});
    return `<h3>Readiness</h3>${rows.map(x=>`<button class="list-link eagle-open-shift" data-shift="${x.sh}"><span><b>${x.sh} Shift</b><small>${x.count} active associates</small></span><strong>${x.pct}%</strong></button>`).join('')}`;
  }
  function correctiveAnswer(q,person){
    let rows=window.correctiveActionRepository?correctiveActionRepository():[...(state.actions||[])];rows=rows.filter(a=>a.status!=='Closed');
    if(person)rows=rows.filter(a=>String(a.employeeNumber)===String(person.employeeNumber));
    if(/\b(overdue|late|past due|vencid)\b/.test(norm(q)))rows=rows.filter(a=>a.targetDate&&a.targetDate<todayISO());
    return `<h3>${rows.length} open corrective/reassessment record${rows.length===1?'':'s'}</h3>${rows.slice(0,10).map(a=>`<button class="list-link eagle-action" data-id="${esc(a.id)}"><span><b>${esc(a.employee||a.employeeNumber)}</b><small>${esc(a.taskId||'')} / ${esc(a.subtaskId||'')} · Due ${esc(a.targetDate||'—')}</small></span><span>${esc(a.status||'Open')}</span></button>`).join('')||'<p>No matching open records.</p>'}<button class="secondary eagle-nav" data-view="actions">Open Corrective Actions</button>`;
  }
  function criticalAnswer(person){
    let rows=(state.results||[]).filter(r=>r.criticality==='Critical Gate'&&r.result!=='GO'&&r.result!=='NOT EVALUATED');if(person)rows=rows.filter(r=>String(r.employeeNumber)===String(person.employeeNumber));
    return `<h3>${rows.length} Critical Gate issue${rows.length===1?'':'s'}</h3>${rows.slice(0,10).map(r=>`<p><b>${esc(r.associateName||r.employeeNumber)}</b> — ${esc(r.subtaskId)} · ${esc(r.result)}</p>`).join('')||'<p>No matching Critical Gate failures are currently recorded.</p>'}<button class="secondary eagle-nav" data-view="actions">Open corrective actions</button>`;
  }
  function evaluatorAuthority(task){
    if(!task)return '<p>Tell me which METL task you want an evaluator for, for example “Who can evaluate M03?”</p>';
    const rows=typeof authorizedEvaluatorUsers==='function'?authorizedEvaluatorUsers(task.id):(authUsers||[]).filter(u=>u.role==='admin'||u.role==='evaluator');
    return `<h3>Authorized evaluators for ${esc(task.id)}</h3><p>${esc(task.name)}</p>${rows.map(u=>`<div class="eagle-result-card"><b>${esc(u.name||u.username)}</b><small>${u.role==='admin'?'Administrator':`Evaluator ${esc(u.maxLevel||'')}`}</small></div>`).join('')||'<p>No authorized evaluator is configured for this task.</p>'}`;
  }
  function qualifiedAnswer(q){
    const sub=resolveSubtask(q),task=resolveTask(q);if(!sub&&!task)return '<p>Tell me the task or subtask. Example: “Who can perform M03-09 independently?”</p>';
    const req=sub?[sub]:subtaskRows().filter(s=>String(s.taskId)===String(task.id));
    const people=activePeople().filter(p=>{const latest=latestResults(p.employeeNumber);return req.length&&req.every(s=>latest.get(`${p.employeeNumber}|${s.id}`)?.result==='GO')});
    return `<h3>${esc(sub?`${sub.id} — ${sub.name}`:`${task.id} — ${task.name}`)}</h3><p>${people.length} associate${people.length===1?' is':'s are'} currently recorded GO for the applicable requirement${req.length===1?'':'s'}.</p>${people.slice(0,15).map(p=>`<button class="list-link eagle-person" data-emp="${esc(p.employeeNumber)}"><span><b>${esc(p.name)}</b><small>${esc(p.shift)} Shift · ${esc(p.assignedLevel)}</small></span></button>`).join('')||'<p>No matching qualified associates were found.</p>'}`;
  }
  function taskInfo(q){
    const task=resolveTask(q),sub=resolveSubtask(q);
    if(sub)return `<h3>${esc(sub.id)} — ${esc(sub.name)}</h3><p><b>Task:</b> ${esc(sub.taskId)} · <b>Level:</b> ${esc(sub.requiredLevel)} · <b>Criticality:</b> ${esc(sub.criticality||'Supporting')}</p><p><b>Standard:</b> ${esc(sub.standard||'')}</p><p><b>Evidence:</b> ${esc(sub.evidence||'')}</p><button class="secondary eagle-nav" data-view="tasks">Open METL library</button>`;
    if(task){const subs=subtaskRows().filter(s=>String(s.taskId)===String(task.id));return `<h3>${esc(task.id)} — ${esc(task.name)}</h3><p><b>Required level:</b> ${esc(task.requiredLevel)} · <b>${subs.length}</b> active subtasks</p><p>${esc(task.description||task.trainedStandard||'')}</p><button class="secondary eagle-nav" data-view="tasks">Open METL library</button>`}
    return '<p>Tell me a METL task or subtask ID/name.</p><button class="secondary eagle-nav" data-view="tasks">Open METL library</button>';
  }
  function knowledge(q){
    const k=KnowledgeEngine.answer(state,q);if(k.found)return `<h3>${esc(k.article.title)}</h3><p>${esc(k.text)}</p><button class="secondary eagle-knowledge" data-id="${esc(k.article.id)}">Open approved article</button>`;
    return `<p>${esc(k.text)}</p><button class="secondary eagle-nav" data-view="knowledge">Search Knowledge Center</button>`;
  }
  function assessmentHistory(person){
    if(!person)return '<p>Tell me which associate, or ask “show my assessment history.”</p>';
    const rows=(state.sessions||[]).filter(s=>String(s.employeeNumber)===String(person.employeeNumber)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    return `<h3>${esc(person.name)} — Assessment History</h3>${rows.slice(0,8).map(s=>`<button class="list-link eagle-session" data-id="${esc(s.id)}"><span><b>${esc(s.taskId)} · ${esc(s.date||'')}</b><small>${esc(s.finalStatus||s.status||'')} · Evaluator ${esc(s.evaluatorName||'')}</small></span></button>`).join('')||'<p>No assessment sessions are recorded.</p>'}`;
  }
  function assignmentsAnswer(q,intent){
    let rows=visibleAssignments();if(intent==='assign_overdue')rows=rows.filter(a=>statusOfAssignment(a)==='Overdue');
    const person=resolvePerson(q,{useSelf:false});if(person)rows=rows.filter(a=>String(a.employeeNumber)===String(person.employeeNumber));
    const task=resolveTask(q);if(task)rows=rows.filter(a=>String(a.taskId)===String(task.id));
    return `<h3>${rows.length} assigned assessment${rows.length===1?'':'s'}</h3>${rows.slice(0,10).map(assignmentCard).join('')||'<p>No matching assessment assignments.</p>'}<div class="actions">${isAdmin()?'<button class="primary eagle-create-assignment">Assign Assessment</button>':''}<button class="secondary eagle-nav" data-view="assignments">Open Assigned Assessments</button></div>`;
  }
  function parseDate(q){
    const s=norm(q);if(/\btoday\b/.test(s))return todayISO();if(/\btomorrow\b/.test(s)){const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)}
    const m=s.match(/\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:'';
  }
  function openAssignmentPrefill(q){
    if(!isAdmin())return toast('Only an administrator can create assessment assignments');
    const p=resolvePerson(q,{useSelf:false}),t=resolveTask(q),ev=resolveEvaluator(q),due=parseDate(q);createAssessmentAssignment();
    setTimeout(()=>{if(p){const x=document.querySelector('#assignPersonSearch');if(x){x.value=p.name;x.dispatchEvent(new Event('input',{bubbles:true}))}const s=document.querySelector('#assignPerson');if(s)s.value=String(p.employeeNumber)}if(t){const x=document.querySelector('#assignTask');if(x){x.value=String(t.id);x.dispatchEvent(new Event('change',{bubbles:true}))}}if(ev){const x=document.querySelector('#assignEvaluator');if(x)x.value=String(ev.username)}if(due){const x=document.querySelector('#assignDueDate');if(x)x.value=due}},90);
  }
  function openAssessmentPrefill(q){
    if(!isEvaluator())return toast('You are not authorized to conduct assessments');
    const p=resolvePerson(q,{useSelf:false}),t=resolveTask(q);assess();
    setTimeout(()=>{if(p){const x=document.querySelector('#aPersonSearch');if(x){x.value=p.name;x.dispatchEvent(new Event('input',{bubbles:true}))}const s=document.querySelector('#aPerson');if(s){s.value=String(p.employeeNumber);s.dispatchEvent(new Event('change',{bubbles:true}))}}if(t){const x=document.querySelector('#aTask');if(x){x.value=String(t.id);x.dispatchEvent(new Event('change',{bubbles:true}))}}},90);
  }

  const sources={
    assign_create:['Natural Language Engine','Permission Assurance Engine','Workflow Engine','Rules Engine','Audit Engine'],
    assign_list:['Natural Language Engine','Search Engine','Workflow Engine','Permission Assurance Engine'],
    assign_my:['Natural Language Engine','Workflow Engine','Permission Assurance Engine'],
    assign_evaluator:['Natural Language Engine','Workflow Engine','Permission Assurance Engine'],
    assign_overdue:['Natural Language Engine','Workflow Engine','Predictive Engine'],
    assessment_start:['Natural Language Engine','Rules Engine','Permission Assurance Engine','Evidence Engine'],
    assessment_history:['Natural Language Engine','Search Engine','Audit Engine'],
    advancement:['Natural Language Engine','Competency Coach Engine','Rules Engine','Readiness Integrity Engine','Workflow Engine'],
    readiness_person:['Natural Language Engine','Rules Engine','Readiness Integrity Engine'],
    readiness_group:['Natural Language Engine','Predictive Engine','Coverage Resilience Engine','Readiness Integrity Engine'],
    corrective:['Natural Language Engine','Workflow Engine','Rules Engine','Audit Engine'],
    critical:['Natural Language Engine','Rules Engine','Workflow Engine','Evidence Engine'],
    evaluator_authority:['Natural Language Engine','Permission Assurance Engine','Rules Engine'],
    qualified:['Natural Language Engine','Search Engine','Rules Engine','Coverage Resilience Engine'],
    knowledge:['Natural Language Engine','Knowledge Engine'],
    task_info:['Natural Language Engine','Search Engine','Knowledge Engine','Rules Engine'],
    backup:['Natural Language Engine','Data Quality Engine','Audit Engine'],
    notifications:['Natural Language Engine','Workflow Engine'],
    audit:['Natural Language Engine','Audit Engine'],
    departments:['Natural Language Engine','Dependency & Impact Engine','Data Quality Engine'],
    user_admin:['Natural Language Engine','Permission Assurance Engine','Audit Engine'],
    person:['Natural Language Engine','Search Engine','Rules Engine'],
    personnel:['Natural Language Engine','Search Engine'],
    matrix:['Natural Language Engine','Readiness Integrity Engine'],
    enterprise:['Natural Language Engine','Data Quality Engine','Permission Assurance Engine'],
    general:['Natural Language Engine','Search Engine','Knowledge Engine']
  };

  function answer(q){
    const intent=classify(q);
    const person=resolvePerson(q,{useSelf:['advancement','readiness_person','corrective','critical','assessment_history','assign_my'].includes(intent)});
    const task=resolveTask(q),ctx=getCtx();if(person)ctx.employeeNumber=person.employeeNumber;if(task)ctx.taskId=task.id;ctx.lastIntent=intent;setCtx(ctx);
    let html='';
    switch(intent){
      case'assign_create':html=isAdmin()?`<h3>Assign Assessment</h3><p>I can open the assignment workflow${person?` for <b>${esc(person.name)}</b>`:''}${task?` and <b>${esc(task.id)}</b>`:''}.</p><button class="primary eagle-create-assignment">Create assignment</button>`:`<p>You do not have permission to create assessment assignments.</p><button class="secondary eagle-nav" data-view="assignments">Open Assigned Assessments</button>`;break;
      case'assign_list':case'assign_my':case'assign_evaluator':case'assign_overdue':html=assignmentsAnswer(q,intent);break;
      case'assessment_start':html=isEvaluator()?`<h3>Start Assessment</h3><p>${person?`Associate: <b>${esc(person.name)}</b>. `:''}${task?`Task: <b>${esc(task.id)} — ${esc(task.name)}</b>.`:''}</p><button class="primary eagle-start-assessment">Open Assessment Session</button>`:'<p>Your account is read-only and cannot conduct assessments.</p>';break;
      case'assessment_history':html=assessmentHistory(person);break;
      case'advancement':html=advancement(person);break;
      case'readiness_person':html=personReadiness(person);break;
      case'readiness_group':html=groupReadiness(q);break;
      case'corrective':html=correctiveAnswer(q,person);break;
      case'critical':html=criticalAnswer(person);break;
      case'evaluator_authority':html=evaluatorAuthority(task);break;
      case'qualified':html=qualifiedAnswer(q);break;
      case'knowledge':html=knowledge(q);break;
      case'task_info':html=taskInfo(q);break;
      case'person':html=personReadiness(person);break;
      case'person_create':html=isAdmin()?'<p>I can open the Personnel workflow to add a new associate.</p><button class="primary eagle-add-person">Add personnel</button>':'<p>You do not have permission to add personnel.</p>';break;
      case'task_create':html=(typeof canManageMetl==='function'&&canManageMetl())?'<p>I can open the METL library to create a task.</p><button class="primary eagle-add-task">Add METL task</button>':'<p>You do not have permission to create METL tasks.</p>';break;
      case'backup':html=isAdmin()?'<h3>Backup & Restore</h3><p>Open the protected backup area to create, verify, or restore a data package.</p><button class="primary eagle-nav" data-view="backup">Open Backup & Restore</button>':'<p>Backup & Restore is restricted to administrators.</p>';break;
      case'notifications':html='<p>I can open your current notifications and due work.</p><button class="primary eagle-nav" data-view="notifications">Open Notifications</button>';break;
      case'audit':html=(currentUser?.role==='admin'||currentUser?.role==='evaluator')?'<p>I can open the Audit Trail.</p><button class="primary eagle-nav" data-view="audit">Open Audit Trail</button>':'<p>Your account is not authorized to view the Audit Trail.</p>';break;
      case'departments':html=isAdmin()?'<p>Departments are managed in Administration.</p><button class="primary eagle-nav" data-view="settings">Open Administration</button>':'<p>Department management is restricted to administrators.</p>';break;
      case'user_admin':html=isAdmin()?'<p>User accounts, roles, evaluator authority, and departments are managed in Administration.</p><button class="primary eagle-nav" data-view="settings">Open Administration</button>':'<p>Your account cannot manage users or permissions.</p>';break;
      case'profile':html='<p>I can open your profile and account preferences.</p><button class="primary eagle-nav" data-view="profile">Open My Profile</button>';break;
      case'dashboard':html='<button class="primary eagle-nav" data-view="dashboard">Open Dashboard</button>';break;
      case'personnel':html='<button class="primary eagle-nav" data-view="personnel">Open Personnel</button>';break;
      case'matrix':html='<button class="primary eagle-nav" data-view="matrix">Open Readiness Matrix</button>';break;
      case'enterprise':html=isAdmin()?'<p>Enterprise tools contain server configuration and diagnostics.</p><button class="primary eagle-nav" data-view="enterprise">Open Enterprise Tools</button>':'<p>Enterprise tools are restricted to administrators.</p>';break;
      default:{
        const hits=SearchEngine.searchAll(state,q),k=KnowledgeEngine.answer(state,q);
        if(k.found)html=knowledge(q);
        else if(hits.length)html=`<h3>${hits.length} matching record${hits.length===1?'':'s'}</h3>${hits.slice(0,8).map(x=>`<div class="eagle-result-card"><b>${esc(x.title)}</b><small>${esc(x.meta||x.type)}</small></div>`).join('')}<p>Try asking me to <b>open</b>, <b>assign</b>, <b>evaluate</b>, or <b>explain</b> one of these records.</p>`;
        else html='<p>I could not map that request to an RP workflow yet.</p><p>Try <b>“Assign Luis M03 to Amy”</b>, <b>“What do I need to advance?”</b>, <b>“Show overdue corrective actions”</b>, <b>“Who can evaluate M03?”</b>, or <b>“Open Backup & Restore.”</b></p>';
      }
    }
    return{html,intent,sources:sources[intent]||sources.general,person,task};
  }

  function closeAssistant(){try{window.closeEaglePanel?.()}catch{}}
  function bind(container=document,lastQuestion=''){
    container.querySelectorAll('.eagle-nav').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>navigate(b.dataset.view),30)});
    container.querySelectorAll('.eagle-person').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>window.openEmployeeProfile?openEmployeeProfile(b.dataset.emp):personDetail(b.dataset.emp),30)});
    container.querySelectorAll('.eagle-action').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>actionDetail(b.dataset.id),30)});
    container.querySelectorAll('.eagle-session').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>sessionDetail(b.dataset.id),30)});
    container.querySelectorAll('.eagle-knowledge').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>knowledgeArticleDetail(b.dataset.id),30)});
    container.querySelectorAll('.eagle-open-assignment').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>openAssignedAssessment(b.dataset.id),30)});
    container.querySelectorAll('.eagle-open-shift').forEach(b=>b.onclick=()=>{const sh=b.dataset.shift;closeAssistant();navigate('matrix');setTimeout(()=>{const s=document.querySelector('#mxShift');if(s){s.value=sh;s.dispatchEvent(new Event('change',{bubbles:true}))}},60)});
    container.querySelectorAll('.eagle-create-assignment').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>openAssignmentPrefill(lastQuestion),40)});
    container.querySelectorAll('.eagle-start-assessment').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>openAssessmentPrefill(lastQuestion),40)});
    container.querySelectorAll('.eagle-add-person').forEach(b=>b.onclick=()=>{closeAssistant();setTimeout(()=>personEdit(),40)});
    container.querySelectorAll('.eagle-add-task').forEach(b=>b.onclick=()=>{closeAssistant();navigate('tasks');setTimeout(()=>document.querySelector('#addTask')?.click(),80)});
  }

  window.RPBrainLegacy=window.RPBrainEnterprise;
  window.RPBrainEnterprise={
    answer(q){const r=answer(q);window.__lastEagleQuestion=String(q||'');window.__lastEagleResult=r;return r},
    bind(container=document){bind(container,window.__lastEagleQuestion||'')}
  };

  const priorReasoning=window.ReasoningEngine;
  window.ReasoningEngine={
    ...(priorReasoning||{}),
    explain(question,result){
      const r=result?.sources?result:(window.__lastEagleResult||answer(question));
      return{intent:r.intent||'general',sources:r.sources||sources.general,summary:`Eagle interpreted this as “${r.intent||'general'}” and coordinated ${(r.sources||sources.general).join(', ')}.`};
    }
  };

  window.EagleOrchestrator={
    version:VERSION,classify,resolvePerson,resolveTask,resolveSubtask,resolveEvaluator,answer,
    engineCoverage(){
      const defs=window.RPIAPlatform?.engineDefinitions||[];
      const map={
        'Eagle':()=>!!window.RPBrainEnterprise,
        'Natural Language Engine':()=>true,
        'Reasoning Engine':()=>!!window.ReasoningEngine,
        'Workflow Engine':()=>!!window.WorkflowEngine,
        'Rules Engine':()=>!!window.RulesEngine,
        'Knowledge Engine':()=>!!window.KnowledgeEngine,
        'Search Engine':()=>!!window.SearchEngine,
        'Predictive Engine':()=>!!window.PredictiveEngine,
        'Audit Engine':()=>!!window.AuditEngine,
        'Competency Coach Engine':()=>!!window.CompetencyCoachEngine,
        'Experience Engine':()=>!!window.ExperienceEngine,
        'Evidence Engine':()=>!!window.EvidenceEngine,
        'Certification Engine':()=>!!window.CertificationEngine,
        'Readiness Integrity Engine':()=>!!window.ReadinessIntegrityEngine,
        'Data Quality Engine':()=>!!window.DataQualityEngine,
        'Training Effectiveness Engine':()=>!!window.TrainingEffectivenessEngine,
        'Coverage Resilience Engine':()=>!!window.CoverageResilienceEngine,
        'Recertification Engine':()=>!!window.RecertificationEngine,
        'Permission Assurance Engine':()=>!!window.PermissionAssuranceEngine,
        'Dependency & Impact Engine':()=>!!window.DependencyImpactEngine
      };
      return defs.map(([name,description])=>({name,description,connected:map[name]?map[name]():false}));
    }
  };

  console.info(`Eagle Operational Brain ${VERSION} loaded`);
})();
