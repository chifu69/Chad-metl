/* RP Eagle Brain Rebuild v9.20.0
   Architecture:
   USER -> EAGLE -> Intent + Entities + Conversation Context
        -> Permission Gate -> Engine Plan -> Existing RP Workflow / Answer

   This file deliberately replaces the previous incremental classifier.
   It is the final orchestration layer and never bypasses RP's existing permissions.
*/
(function(){
  'use strict';

  const VERSION='9.20.0';
  const $one=(sel,root=document)=>root.querySelector(sel);
  const $all=(sel,root=document)=>[...root.querySelectorAll(sel)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘]/g,"'")
    .replace(/[^a-zA-Z0-9#\-]+/g,' ')
    .toLowerCase().replace(/\s+/g,' ').trim();
  const words=v=>norm(v).split(' ').filter(Boolean);
  const todayISO=()=>new Date().toISOString().slice(0,10);

  const ACTION_PATTERNS={
    assign:/\b(assign|assigned|schedule|give|delegate|set up|setup)\b/,
    create:/\b(create|add|new|make|build)\b/,
    start:/\b(start|begin|conduct|perform|launch|do)\b/,
    open:/\b(open|show|view|display|go to|take me to|see)\b/,
    edit:/\b(edit|change|update|modify|revise|correct)\b/,
    close:/\b(close|complete|finish|resolve)\b/,
    cancel:/\b(cancel|unassign|remove assignment)\b/,
    find:/\b(find|search|locate|look for|who|which)\b/,
    explain:/\b(explain|what is|what are|tell me about|how does|how do|how to)\b/,
    list:/\b(list|all|show|view|which|who|what)\b/
  };

  const OBJECT_PATTERNS={
    subtask:/\b(subtask|subtasks)\b|\bm\d{2}[- ]\d{2}\b/,
    assignment:/\b(assigned assessment|assigned assessments|assessment assignment|assessment assignments|assignment|assignments|assigned work)\b/,
    assessment:/\b(assessment|assessments|evaluation|evaluations)\b/,
    task:/\b(metl task|metl tasks|task|tasks)\b/,
    corrective:/\b(corrective action|corrective actions|corrective|reassessment|reassessments)\b/,
    critical:/\b(critical gate|critical gates|critical failure|safety gate)\b/,
    readiness:/\b(readiness|ready|preparation)\b/,
    matrix:/\b(readiness matrix|matrix)\b/,
    qualification:/\b(qualification|qualified|independent authorization|independently|authorized to perform)\b/,
    evaluator:/\b(evaluator|evaluators)\b/,
    personnel:/\b(employee|employees|associate|associates|personnel|worker|workers|people)\b/,
    knowledge:/\b(knowledge|procedure|procedures|instruction|instructions|standard work|approved procedure|wiki)\b/,
    backup:/\b(backup|restore|data integrity)\b/,
    notification:/\b(notification|notifications|alert|alerts)\b/,
    audit:/\b(audit|audit trail|history of changes|who changed)\b/,
    department:/\b(department|departments)\b/,
    user:/\b(user|users|account|accounts|password|permissions|permission|role|roles)\b/,
    profile:/\b(profile|my profile)\b/,
    dashboard:/\b(dashboard|home)\b/,
    enterprise:/\b(engine|engines|diagnostic|enterprise)\b/
  };

  const ENGINE_PLAN={
    assignment:['Natural Language Engine','Workflow Engine','Permission Assurance Engine','Rules Engine','Audit Engine'],
    assessment:['Natural Language Engine','Workflow Engine','Rules Engine','Permission Assurance Engine','Evidence Engine','Audit Engine'],
    metl:['Natural Language Engine','Search Engine','Knowledge Engine','Rules Engine','Permission Assurance Engine','Audit Engine'],
    personnel:['Natural Language Engine','Search Engine','Permission Assurance Engine','Audit Engine'],
    readiness:['Natural Language Engine','Rules Engine','Readiness Integrity Engine','Coverage Resilience Engine','Predictive Engine'],
    advancement:['Natural Language Engine','Competency Coach Engine','Rules Engine','Readiness Integrity Engine','Workflow Engine'],
    corrective:['Natural Language Engine','Workflow Engine','Rules Engine','Evidence Engine','Audit Engine'],
    qualification:['Natural Language Engine','Search Engine','Rules Engine','Coverage Resilience Engine','Permission Assurance Engine'],
    knowledge:['Natural Language Engine','Knowledge Engine','Search Engine'],
    admin:['Natural Language Engine','Permission Assurance Engine','Data Quality Engine','Audit Engine'],
    system:['Natural Language Engine','Workflow Engine','Data Quality Engine','Audit Engine'],
    search:['Natural Language Engine','Search Engine','Knowledge Engine']
  };

  function activePeople(){
    return Array.isArray(state?.personnel)
      ?state.personnel.filter(p=>p&&p.name&&p.employeeNumber&&p.status==='Active')
      :[];
  }
  function activeTasks(){return Array.isArray(state?.tasks)?state.tasks.filter(t=>t&&t.status==='Active'):[]}
  function activeSubtasks(){return Array.isArray(state?.subtasks)?state.subtasks.filter(s=>s&&s.status==='Active'):[]}
  function currentPerson(){return activePeople().find(p=>String(p.employeeNumber)===String(currentUser?.employeeNumber||''))||null}
  function isAdmin(){return currentUser?.role==='admin'}
  function isEvaluator(){return currentUser?.role==='admin'||currentUser?.role==='evaluator'}
  function mayManageMetl(){return typeof canManageMetl==='function'&&canManageMetl()}
  function mayManagePersonnel(){return typeof canManagePersonnel==='function'&&canManagePersonnel()}
  function mayEvaluate(){return typeof canEvaluate==='function'&&canEvaluate()}

  const ctxKey=()=>`rp-eagle-v920-context-${currentUser?.username||'anonymous'}`;
  function loadContext(){try{return JSON.parse(sessionStorage.getItem(ctxKey()))||{}}catch{return{}}}
  function saveContext(c){try{sessionStorage.setItem(ctxKey(),JSON.stringify(c||{}))}catch{}}
  function clearDraft(c){delete c.draft;return c}

  function findNameMatches(q,rows,nameFn){
    const nq=norm(q),out=[];
    rows.forEach(row=>{
      const full=norm(nameFn(row));
      if(!full)return;
      let pos=nq.indexOf(full),score=0;
      if(pos>=0)score=200+full.length;
      else{
        const parts=full.split(' ').filter(x=>x.length>2);
        let matches=0,first=9999;
        parts.forEach(part=>{
          const p=nq.split(' ').indexOf(part);
          if(p>=0){matches++;first=Math.min(first,p)}
        });
        if(matches)score=matches*45+(matches===parts.length?70:0),pos=first;
      }
      if(score)out.push({row,score,pos:pos<0?9999:pos});
    });
    return out.sort((a,b)=>b.score-a.score||a.pos-b.pos);
  }

  function resolvePeople(q){
    return findNameMatches(q,activePeople(),p=>p.name);
  }
  function resolveEvaluators(q){
    return findNameMatches(q,(authUsers||[]).filter(u=>u&&!u.disabled&&(u.role==='admin'||u.role==='evaluator')),u=>u.name||u.username);
  }
  function resolveTasks(q){
    const nq=norm(q),hits=[];
    activeTasks().forEach(t=>{
      const id=norm(t.id),name=norm(t.name);let score=0,pos=9999;
      const idm=nq.match(new RegExp(`(^| )${id}( |$)`));
      if(idm){score+=240;pos=nq.indexOf(id)}
      if(name&&nq.includes(name)){score+=180;pos=Math.min(pos,nq.indexOf(name))}
      for(const part of name.split(' ').filter(x=>x.length>5))if(nq.includes(part))score+=12;
      if(score)hits.push({row:t,score,pos});
    });
    return hits.sort((a,b)=>b.score-a.score||a.pos-b.pos);
  }
  function resolveSubtasks(q){
    const nq=norm(q),hits=[];
    activeSubtasks().forEach(s=>{
      const id=norm(s.id),name=norm(s.name);let score=0,pos=9999;
      const idm=nq.match(new RegExp(`(^| )${id}( |$)`));
      if(idm){score+=260;pos=nq.indexOf(id)}
      if(name&&nq.includes(name)){score+=185;pos=Math.min(pos,nq.indexOf(name))}
      for(const part of name.split(' ').filter(x=>x.length>5))if(nq.includes(part))score+=12;
      if(score)hits.push({row:s,score,pos});
    });
    return hits.sort((a,b)=>b.score-a.score||a.pos-b.pos);
  }

  function parseDatePhrase(q){
    const s=norm(q);
    const iso=s.match(/\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/);
    if(iso)return`${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
    const now=new Date();
    if(/\btoday\b/.test(s))return now.toISOString().slice(0,10);
    if(/\btomorrow\b/.test(s)){now.setDate(now.getDate()+1);return now.toISOString().slice(0,10)}
    if(/\bthis week\b/.test(s)){
      const day=now.getDay(),delta=(5-day+7)%7;now.setDate(now.getDate()+delta);return now.toISOString().slice(0,10)
    }
    if(/\bnext week\b/.test(s)){
      const day=now.getDay(),delta=((5-day+7)%7)+7;now.setDate(now.getDate()+delta);return now.toISOString().slice(0,10)
    }
    return'';
  }

  function parse(q){
    const text=norm(q);
    const actions={};
    Object.entries(ACTION_PATTERNS).forEach(([k,re])=>actions[k]=re.test(text));

    const objects={};
    Object.entries(OBJECT_PATTERNS).forEach(([k,re])=>objects[k]=re.test(text));

    // Specific-object precedence: a subtask ID is never treated as a generic task.
    if(objects.subtask)objects.task=false;
    // An explicit assignment phrase is distinct from a generic assessment.
    if(objects.assignment)objects.assessment=false;
    // Matrix is more specific than readiness.
    if(objects.matrix)objects.readiness=false;

    const people=resolvePeople(q);
    const evaluators=resolveEvaluators(q);
    const tasks=resolveTasks(q);
    const subtasks=resolveSubtasks(q);

    let person=people[0]?.row||null;
    let evaluator=null;

    // If two names occur, the earliest associate is the trainee; a later evaluator/auth-user is evaluator.
    if(people.length>1){
      person=people.slice().sort((a,b)=>a.pos-b.pos)[0].row;
    }
    const personPos=people.find(x=>x.row===person)?.pos??9999;
    const evaluatorCandidates=evaluators.filter(x=>!person||norm(x.row.name||x.row.username)!==norm(person.name));
    if(evaluatorCandidates.length){
      const explicit=/\b(evaluator|evaluated by|evaluate by|by)\b/.test(text);
      evaluator=(explicit?evaluatorCandidates:evaluatorCandidates.filter(x=>x.pos>personPos))[0]?.row||null;
    }

    // Named task may be implied by a subtask.
    let subtask=subtasks[0]?.row||null;
    let task=tasks[0]?.row||null;
    if(subtask&&!task)task=activeTasks().find(t=>String(t.id)===String(subtask.taskId))||null;

    const self=/\b(my|mine|me|i|myself)\b/.test(text);
    const group=/\b([abcd]) shift\b/.test(text)||/\b(all shifts|plant|overall|department)\b/.test(text);
    const shift=(text.match(/\b([abcd]) shift\b/)||[])[1]?.toUpperCase()||'';
    const overdue=/\b(overdue|late|past due)\b/.test(text);
    const history=/\b(history|past|previous|completed)\b/.test(text);
    const advancement=/\b(advance|advancement|promotion|next level|move up|improve|what do i need|what am i missing|gap|gaps)\b/.test(text);
    const evaluatorSelf=/\b(assigned to me|need to evaluate|waiting for me|my evaluations|what do i need to evaluate)\b/.test(text);

    return{
      raw:String(q||''),text,actions,objects,people,evaluators,tasks,subtasks,
      person,evaluator,task,subtask,self,group,shift,overdue,history,advancement,evaluatorSelf,
      dueDate:parseDatePhrase(q)
    };
  }

  // Registry-based scoring: no single regex chain decides everything.
  const INTENTS=[
    {
      id:'assignment.create',family:'assignment',specificity:100,
      score:p=>{
        let s=0;
        if(p.actions.assign)s+=140;
        if(p.objects.assignment)s+=110;
        if(p.objects.assessment)s+=75;
        if(p.objects.task||p.task)s+=55; // "assign task to Jose"
        if(p.objects.subtask||p.subtask)s+=55;
        if(p.person)s+=70;
        if(p.evaluator)s+=25;
        if(p.actions.create&&p.objects.assignment)s+=80;
        if(p.actions.create&&p.objects.task&&!p.actions.assign)s-=150; // "create task" is not assignment
        return s;
      }
    },
    {id:'metl.subtask.create',family:'metl',specificity:100,score:p=>(p.actions.create&&p.objects.subtask?250:0)+(p.task?20:0)-(p.actions.assign?200:0)},
    {id:'metl.subtask.edit',family:'metl',specificity:100,score:p=>(p.actions.edit&&p.objects.subtask?250:0)+(p.subtask?60:0)},
    {id:'metl.subtask.open',family:'metl',specificity:95,score:p=>(p.actions.open&&p.objects.subtask?210:0)+(p.subtask?70:0)},
    {id:'metl.task.create',family:'metl',specificity:90,score:p=>(p.actions.create&&p.objects.task?230:0)-(p.actions.assign?220:0)},
    {id:'metl.task.edit',family:'metl',specificity:90,score:p=>(p.actions.edit&&p.objects.task?220:0)+(p.task?60:0)},
    {id:'metl.task.open',family:'metl',specificity:85,score:p=>(p.actions.open&&p.objects.task?190:0)+(p.task?70:0)},
    {id:'person.create',family:'personnel',specificity:90,score:p=>(p.actions.create&&p.objects.personnel?220:0)},
    {id:'person.edit',family:'personnel',specificity:90,score:p=>(p.actions.edit&&p.objects.personnel?210:0)+(p.person?50:0)},
    {id:'assessment.start',family:'assessment',specificity:90,score:p=>(p.actions.start&&p.objects.assessment?230:0)+(p.person?40:0)+(p.task?40:0)},
    {id:'assessment.history',family:'assessment',specificity:80,score:p=>(p.objects.assessment&&p.history?210:0)+(p.person||p.self?40:0)},
    {id:'assignment.evaluator',family:'assignment',specificity:85,score:p=>(p.evaluatorSelf?240:0)},
    {id:'assignment.overdue',family:'assignment',specificity:80,score:p=>((p.objects.assignment||p.objects.assessment)&&p.overdue?210:0)},
    {id:'assignment.mine',family:'assignment',specificity:75,score:p=>((p.objects.assignment||p.objects.assessment)&&p.self?170:0)},
    {id:'assignment.list',family:'assignment',specificity:65,score:p=>(p.objects.assignment?145:0)+(p.actions.open||p.actions.list?30:0)},
    {id:'development.advancement',family:'advancement',specificity:90,score:p=>(p.advancement?240:0)+(p.person||p.self?30:0)},
    {id:'readiness.group',family:'readiness',specificity:80,score:p=>(p.objects.readiness&&p.group?210:0)},
    {id:'readiness.person',family:'readiness',specificity:70,score:p=>(p.objects.readiness?155:0)+(p.person||p.self?35:0)},
    {id:'corrective.list',family:'corrective',specificity:80,score:p=>(p.objects.corrective?210:0)+(p.overdue?30:0)+(p.person||p.self?20:0)},
    {id:'critical.list',family:'corrective',specificity:85,score:p=>(p.objects.critical?230:0)+(p.person||p.self?20:0)},
    {id:'evaluator.authority',family:'qualification',specificity:90,score:p=>(p.objects.evaluator&&(p.actions.find||/\b(can|authorized)\b/.test(p.text))?225:0)+(p.task?50:0)},
    {id:'qualification.people',family:'qualification',specificity:85,score:p=>(p.objects.qualification?210:0)+(p.task||p.subtask?40:0)},
    {id:'knowledge.answer',family:'knowledge',specificity:75,score:p=>(p.objects.knowledge?180:0)+(p.actions.explain?20:0)},
    {id:'metl.subtask.info',family:'metl',specificity:70,score:p=>(p.objects.subtask?135:0)+(p.subtask?80:0)},
    {id:'metl.task.info',family:'metl',specificity:65,score:p=>(p.objects.task?120:0)+(p.task?70:0)},
    {id:'system.backup',family:'system',specificity:80,score:p=>(p.objects.backup?220:0)},
    {id:'system.notifications',family:'system',specificity:75,score:p=>(p.objects.notification?190:0)},
    {id:'system.audit',family:'system',specificity:75,score:p=>(p.objects.audit?190:0)},
    {id:'admin.departments',family:'admin',specificity:75,score:p=>(p.objects.department?185:0)},
    {id:'admin.users',family:'admin',specificity:75,score:p=>(p.objects.user?185:0)},
    {id:'system.profile',family:'system',specificity:65,score:p=>(p.objects.profile?170:0)},
    {id:'system.dashboard',family:'system',specificity:60,score:p=>(p.objects.dashboard?160:0)},
    {id:'system.matrix',family:'system',specificity:65,score:p=>(p.objects.matrix?180:0)},
    {id:'system.enterprise',family:'system',specificity:65,score:p=>(p.objects.enterprise?170:0)},
    {id:'person.summary',family:'personnel',specificity:55,score:p=>(p.person?120:0)},
    {id:'system.personnel',family:'system',specificity:50,score:p=>(p.objects.personnel?115:0)}
  ];

  function classify(parsed){
    const ranked=INTENTS
      .map(rule=>({id:rule.id,family:rule.family,specificity:rule.specificity,score:Number(rule.score(parsed)||0)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||b.specificity-a.specificity||a.id.localeCompare(b.id));
    const winner=ranked[0]||{id:'general.search',family:'search',score:0,specificity:0};
    return{...winner,ranked};
  }

  function applyConversationContext(parsed,intent){
    const c=loadContext();

    // Follow-up context is used only when the current sentence does not provide an entity.
    if(!parsed.person&&c.employeeNumber){
      parsed.person=activePeople().find(p=>String(p.employeeNumber)===String(c.employeeNumber))||null;
    }
    if(!parsed.task&&c.taskId){
      parsed.task=activeTasks().find(t=>String(t.id)===String(c.taskId))||null;
    }
    if(!parsed.subtask&&c.subtaskId){
      parsed.subtask=activeSubtasks().find(s=>String(s.id)===String(c.subtaskId))||null;
    }

    // Self-referential development/readiness/history defaults to signed-in associate.
    if(!parsed.person&&parsed.self&&['development.advancement','readiness.person','assessment.history','corrective.list'].includes(intent.id)){
      parsed.person=currentPerson();
    }
    if(!parsed.person&&['development.advancement','readiness.person'].includes(intent.id)){
      parsed.person=currentPerson();
    }

    if(parsed.person)c.employeeNumber=parsed.person.employeeNumber;
    if(parsed.task)c.taskId=parsed.task.id;
    if(parsed.subtask)c.subtaskId=parsed.subtask.id;
    c.lastIntent=intent.id;
    saveContext(c);
    return parsed;
  }

  function assignmentRows(){
    const all=(state.assessmentAssignments||[]).filter(Boolean);
    if(currentUser?.role==='viewer')return all.filter(a=>String(a.employeeNumber)===String(currentUser.employeeNumber||''));
    if(currentUser?.role==='evaluator')return all.filter(a=>String(a.evaluatorUsername||'').toLowerCase()===String(currentUser.username||'').toLowerCase());
    return all;
  }
  function assignmentStatusLocal(a){
    if(typeof window.assignmentStatus==='function')return window.assignmentStatus(a);
    if(a.status==='Completed'||a.status==='Cancelled')return a.status;
    if(a.dueDate&&a.dueDate<todayISO())return'Overdue';
    if(a.dueDate===todayISO())return'Due Today';
    return a.status||'Assigned';
  }

  function assignmentCard(a){
    const p=activePeople().find(x=>String(x.employeeNumber)===String(a.employeeNumber))||{};
    const t=activeTasks().find(x=>String(x.id)===String(a.taskId))||{};
    const st=assignmentStatusLocal(a);
    const canOpen=isAdmin()||(currentUser?.role==='evaluator'&&String(a.evaluatorUsername||'').toLowerCase()===String(currentUser.username||'').toLowerCase());
    return `<div class="eagle-result-card">
      <b>${esc(p.name||a.employeeName||a.employeeNumber)} — ${esc(t.id||a.taskId)}</b>
      <small>${esc(t.name||a.taskName||'')} · Evaluator: ${esc(a.evaluatorName||'—')} · Due ${esc(a.dueDate||'—')} · ${esc(st)}</small>
      ${canOpen&&!['Completed','Cancelled'].includes(st)?`<button class="secondary eagle-action-btn" data-action="open-assignment" data-id="${esc(a.id)}">Open assessment</button>`:''}
    </div>`;
  }

  function personSummary(person){
    if(!person)return'<p>Tell me which associate you want to review.</p>';
    const m=RulesEngine.qualificationSummary(state,person);
    const acts=(state.actions||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&a.status!=='Closed');
    const asn=(state.assessmentAssignments||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&!['Completed','Cancelled'].includes(a.status));
    return `<h3>${esc(person.name)}</h3>
      <p><b>Employee #:</b> ${esc(person.employeeNumber)} · <b>Shift:</b> ${esc(person.shift)} · <b>Assigned level:</b> ${esc(person.assignedLevel)}</p>
      <p><b>Readiness:</b> ${m.pct}% · <b>Highest fully qualified:</b> ${esc(m.highestFullyQualified)} · <b>Open actions:</b> ${acts.length} · <b>Assigned assessments:</b> ${asn.length}</p>
      <button class="secondary eagle-action-btn" data-action="person" data-emp="${esc(person.employeeNumber)}">Open employee profile</button>`;
  }

  function advancementAnswer(person){
    if(!person)return'<p>I need an associate to answer that. If this is about you, make sure your login is linked to an employee record.</p>';
    const levels=['-10','-20','-30','-40'];
    const idx=levels.indexOf(person.assignedLevel||'-10');
    const next=idx>=0&&idx<levels.length-1?levels[idx+1]:null;
    const m=RulesEngine.qualificationSummary(state,person);
    if(!next)return`<h3>${esc(person.name)}</h3><p>${esc(person.name)} is already assigned to the highest level (${esc(person.assignedLevel)}).</p>`;
    const latest=latestResults(person.employeeNumber);
    const req=activeSubtasks().filter(s=>levelRank[s.requiredLevel]<=levelRank[next]);
    const gaps=req.filter(s=>latest.get(`${person.employeeNumber}|${s.id}`)?.result!=='GO');
    const actions=(state.actions||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&a.status!=='Closed');
    const assigned=(state.assessmentAssignments||[]).filter(a=>String(a.employeeNumber)===String(person.employeeNumber)&&!['Completed','Cancelled'].includes(a.status));
    return `<h3>${esc(person.name)} → ${esc(next)}</h3>
      <p><b>Current readiness:</b> ${m.pct}% · <b>${gaps.length}</b> requirement${gaps.length===1?'':'s'} not currently recorded GO for the next level.</p>
      ${actions.length?`<p><b>${actions.length} open corrective action${actions.length===1?'':'s'}</b> should be addressed.</p>`:''}
      ${assigned.length?`<p><b>${assigned.length} assigned assessment${assigned.length===1?'':'s'}</b> already scheduled.</p>`:''}
      ${gaps.length?`<div class="eagle-mini-list">${gaps.slice(0,8).map(s=>`<div><b>${esc(s.id)}</b><span>${esc(s.name)}</span></div>`).join('')}</div>`:'<p>No missing GO requirements are visible for the next level.</p>'}
      <button class="secondary eagle-action-btn" data-action="person" data-emp="${esc(person.employeeNumber)}">Open employee profile</button>`;
  }

  function readinessGroup(parsed){
    const shifts=parsed.shift?[parsed.shift]:['A','B','C','D'];
    return `<h3>Readiness</h3>${shifts.map(sh=>{
      const ps=activePeople().filter(p=>p.shift===sh);
      const pct=ps.length?Math.round(ps.reduce((sum,p)=>sum+RulesEngine.qualificationSummary(state,p).pct,0)/ps.length):0;
      return `<button class="list-link eagle-action-btn" data-action="shift" data-shift="${sh}"><span><b>${sh} Shift</b><small>${ps.length} active associates</small></span><strong>${pct}%</strong></button>`;
    }).join('')}`;
  }

  function correctiveAnswer(parsed){
    let rows=typeof correctiveActionRepository==='function'?correctiveActionRepository():[...(state.actions||[])];
    rows=rows.filter(a=>a.status!=='Closed');
    if(parsed.person)rows=rows.filter(a=>String(a.employeeNumber)===String(parsed.person.employeeNumber));
    if(parsed.overdue)rows=rows.filter(a=>(a.targetDate||a.reassessmentDate)&&String(a.targetDate||a.reassessmentDate)<todayISO());
    return `<h3>${rows.length} open corrective/reassessment record${rows.length===1?'':'s'}</h3>
      ${rows.slice(0,10).map(a=>`<button class="list-link eagle-action-btn" data-action="corrective" data-id="${esc(a.id)}"><span><b>${esc(a.employee||a.employeeNumber)}</b><small>${esc(a.taskId||'')} / ${esc(a.subtaskId||'')} · Due ${esc(a.targetDate||a.reassessmentDate||'—')}</small></span><span>${esc(a.status||'Open')}</span></button>`).join('')||'<p>No matching open records.</p>'}
      <button class="secondary eagle-action-btn" data-action="nav" data-view="actions">Open Corrective Actions</button>`;
  }

  function criticalAnswer(parsed){
    let rows=(state.results||[]).filter(r=>r.criticality==='Critical Gate'&&r.result!=='GO'&&r.result!=='NOT EVALUATED');
    if(parsed.person)rows=rows.filter(r=>String(r.employeeNumber)===String(parsed.person.employeeNumber));
    return `<h3>${rows.length} Critical Gate issue${rows.length===1?'':'s'}</h3>
      ${rows.slice(0,10).map(r=>`<p><b>${esc(r.associateName||r.employeeNumber)}</b> — ${esc(r.subtaskId)} · ${esc(r.result)}</p>`).join('')||'<p>No matching Critical Gate failures are currently recorded.</p>'}
      <button class="secondary eagle-action-btn" data-action="nav" data-view="actions">Open Corrective Actions</button>`;
  }

  function evaluatorAuthority(parsed){
    if(!parsed.task)return'<p>Tell me which METL task you need an evaluator for. Example: <b>Who can evaluate M03?</b></p>';
    const rows=typeof authorizedEvaluatorUsers==='function'
      ?authorizedEvaluatorUsers(parsed.task.id)
      :(authUsers||[]).filter(u=>u.role==='admin'||u.role==='evaluator');
    return `<h3>Authorized evaluators for ${esc(parsed.task.id)}</h3><p>${esc(parsed.task.name)}</p>
      ${rows.map(u=>`<div class="eagle-result-card"><b>${esc(u.name||u.username)}</b><small>${u.role==='admin'?'Administrator':`Evaluator ${esc(u.maxLevel||'')}`}</small></div>`).join('')||'<p>No authorized evaluator is configured for this task.</p>'}`;
  }

  function qualificationPeople(parsed){
    const req=parsed.subtask?[parsed.subtask]:(parsed.task?activeSubtasks().filter(s=>String(s.taskId)===String(parsed.task.id)):[]);
    if(!req.length)return'<p>Tell me which task or subtask. Example: <b>Who can perform M03-09 independently?</b></p>';
    const latestCache=new Map();
    const qualified=activePeople().filter(p=>{
      let latest=latestCache.get(p.employeeNumber);
      if(!latest){latest=latestResults(p.employeeNumber);latestCache.set(p.employeeNumber,latest)}
      return req.every(s=>latest.get(`${p.employeeNumber}|${s.id}`)?.result==='GO');
    });
    const title=parsed.subtask?`${parsed.subtask.id} — ${parsed.subtask.name}`:`${parsed.task.id} — ${parsed.task.name}`;
    return `<h3>${esc(title)}</h3><p>${qualified.length} associate${qualified.length===1?' is':'s are'} currently recorded GO for the applicable requirements.</p>
      ${qualified.slice(0,15).map(p=>`<button class="list-link eagle-action-btn" data-action="person" data-emp="${esc(p.employeeNumber)}"><span><b>${esc(p.name)}</b><small>${esc(p.shift)} Shift · ${esc(p.assignedLevel)}</small></span></button>`).join('')||'<p>No matching qualified associates were found.</p>'}`;
  }

  function taskInfo(parsed){
    if(parsed.subtask){
      const s=parsed.subtask;
      return `<h3>${esc(s.id)} — ${esc(s.name)}</h3><p><b>Parent task:</b> ${esc(s.taskId)} · <b>Level:</b> ${esc(s.requiredLevel)} · <b>Criticality:</b> ${esc(s.criticality||'Supporting')}</p><p><b>Standard:</b> ${esc(s.standard||'')}</p><p><b>Evidence:</b> ${esc(s.evidence||'')}</p><button class="secondary eagle-action-btn" data-action="nav" data-view="tasks">Open METL Library</button>`;
    }
    if(parsed.task){
      const t=parsed.task,subs=activeSubtasks().filter(s=>String(s.taskId)===String(t.id));
      return `<h3>${esc(t.id)} — ${esc(t.name)}</h3><p><b>Required level:</b> ${esc(t.requiredLevel)} · <b>${subs.length}</b> active subtasks</p><p>${esc(t.description||t.trainedStandard||'')}</p><button class="secondary eagle-action-btn" data-action="task-detail" data-id="${esc(t.id)}">Open METL task</button>`;
    }
    return'<p>Tell me a METL task or subtask ID/name.</p><button class="secondary eagle-action-btn" data-action="nav" data-view="tasks">Open METL Library</button>';
  }

  function assessmentHistory(parsed){
    const p=parsed.person||currentPerson();
    if(!p)return'<p>Tell me which associate, or ask about your own assessment history from an employee-linked login.</p>';
    const rows=(state.sessions||[]).filter(s=>String(s.employeeNumber)===String(p.employeeNumber)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    return `<h3>${esc(p.name)} — Assessment History</h3>
      ${rows.slice(0,10).map(s=>`<button class="list-link eagle-action-btn" data-action="session" data-id="${esc(s.id)}"><span><b>${esc(s.taskId)} · ${esc(s.date||'')}</b><small>${esc(s.finalStatus||s.status||'')} · Evaluator ${esc(s.evaluatorName||'')}</small></span></button>`).join('')||'<p>No assessment sessions are recorded.</p>'}`;
  }

  function assignmentAnswer(parsed,intentId){
    let rows=assignmentRows();
    if(intentId==='assignment.overdue')rows=rows.filter(a=>assignmentStatusLocal(a)==='Overdue');
    if(parsed.person)rows=rows.filter(a=>String(a.employeeNumber)===String(parsed.person.employeeNumber));
    if(parsed.task)rows=rows.filter(a=>String(a.taskId)===String(parsed.task.id));
    return `<h3>${rows.length} assigned assessment${rows.length===1?'':'s'}</h3>
      ${rows.slice(0,10).map(assignmentCard).join('')||'<p>No matching assessment assignments.</p>'}
      <div class="actions">${isAdmin()?'<button class="primary eagle-action-btn" data-action="assignment-create">Assign Assessment</button>':''}<button class="secondary eagle-action-btn" data-action="nav" data-view="assignments">Open Assigned Assessments</button></div>`;
  }

  function assignmentCreateAnswer(parsed){
    if(!isAdmin())return'<p>You do not have permission to create assessment assignments.</p><button class="secondary eagle-action-btn" data-action="nav" data-view="assignments">Open Assigned Assessments</button>';

    const p=parsed.person,t=parsed.task,ev=parsed.evaluator;
    const details=[
      p?`Associate: <b>${esc(p.name)}</b>`:'Associate: <b>select in form</b>',
      t?`Task: <b>${esc(t.id)} — ${esc(t.name)}</b>`:'Task: <b>select in form</b>',
      ev?`Evaluator: <b>${esc(ev.name||ev.username)}</b>`:'Evaluator: <b>select in form</b>',
      parsed.dueDate?`Due: <b>${esc(parsed.dueDate)}</b>`:'Due date: <b>select in form</b>'
    ];
    return `<h3>Assign Assessment</h3><p>${details.join(' · ')}</p><button class="primary eagle-action-btn" data-action="assignment-create">Open assignment form</button>`;
  }

  function render(parsed,intent){
    switch(intent.id){
      case'assignment.create':return assignmentCreateAnswer(parsed);
      case'assignment.evaluator':case'assignment.overdue':case'assignment.mine':case'assignment.list':return assignmentAnswer(parsed,intent.id);
      case'assessment.start':
        return mayEvaluate()
          ?`<h3>Start Assessment</h3><p>${parsed.person?`Associate: <b>${esc(parsed.person.name)}</b>. `:''}${parsed.task?`Task: <b>${esc(parsed.task.id)} — ${esc(parsed.task.name)}</b>.`:''}</p><button class="primary eagle-action-btn" data-action="assessment-start">Open Assessment Session</button>`
          :'<p>Your account is read-only and cannot conduct assessments.</p>';
      case'assessment.history':return assessmentHistory(parsed);

      case'metl.task.create':return mayManageMetl()?'<p>I will open the METL editor for a <b>new task</b>.</p><button class="primary eagle-action-btn" data-action="task-create">Create METL task</button>':'<p>You do not have permission to create METL tasks.</p>';
      case'metl.task.edit':return mayManageMetl()?`<p>${parsed.task?`I found <b>${esc(parsed.task.id)} — ${esc(parsed.task.name)}</b>. `:''}I can open the task editor.</p><button class="primary eagle-action-btn" data-action="task-edit">Edit METL task</button>`:'<p>You do not have permission to edit METL tasks.</p>';
      case'metl.task.open':return parsed.task?`<p>I found <b>${esc(parsed.task.id)} — ${esc(parsed.task.name)}</b>.</p><button class="primary eagle-action-btn" data-action="task-detail" data-id="${esc(parsed.task.id)}">Open METL task</button>`:taskInfo(parsed);
      case'metl.task.info':case'metl.subtask.info':return taskInfo(parsed);
      case'metl.subtask.create':return mayManageMetl()?`<p>I will open the editor for a <b>new subtask</b>${parsed.task?` under <b>${esc(parsed.task.id)}</b>`:''}.</p><button class="primary eagle-action-btn" data-action="subtask-create">Create subtask</button>`:'<p>You do not have permission to create subtasks.</p>';
      case'metl.subtask.edit':return mayManageMetl()?`<p>${parsed.subtask?`I found <b>${esc(parsed.subtask.id)} — ${esc(parsed.subtask.name)}</b>. `:''}I can open the subtask editor.</p><button class="primary eagle-action-btn" data-action="subtask-edit">Edit subtask</button>`:'<p>You do not have permission to edit subtasks.</p>';
      case'metl.subtask.open':return parsed.subtask?`<p>I found <b>${esc(parsed.subtask.id)} — ${esc(parsed.subtask.name)}</b>.</p><button class="primary eagle-action-btn" data-action="subtask-open">Open subtask</button>`:taskInfo(parsed);

      case'person.create':return mayManagePersonnel()?'<p>I can open the Personnel editor for a new associate.</p><button class="primary eagle-action-btn" data-action="person-create">Add personnel</button>':'<p>You do not have permission to add personnel.</p>';
      case'person.edit':return mayManagePersonnel()?`<p>${parsed.person?`I found <b>${esc(parsed.person.name)}</b>. `:''}I can open the Personnel editor.</p><button class="primary eagle-action-btn" data-action="person-edit">Edit personnel</button>`:'<p>You do not have permission to edit personnel.</p>';
      case'person.summary':return personSummary(parsed.person);
      case'system.personnel':return'<button class="primary eagle-action-btn" data-action="nav" data-view="personnel">Open Personnel</button>';

      case'development.advancement':return advancementAnswer(parsed.person);
      case'readiness.person':return personSummary(parsed.person||currentPerson());
      case'readiness.group':return readinessGroup(parsed);
      case'corrective.list':return correctiveAnswer(parsed);
      case'critical.list':return criticalAnswer(parsed);
      case'evaluator.authority':return evaluatorAuthority(parsed);
      case'qualification.people':return qualificationPeople(parsed);

      case'knowledge.answer':{
        const k=KnowledgeEngine.answer(state,parsed.raw);
        return k.found?`<h3>${esc(k.article.title)}</h3><p>${esc(k.text)}</p><button class="secondary eagle-action-btn" data-action="knowledge" data-id="${esc(k.article.id)}">Open approved article</button>`:`<p>${esc(k.text)}</p><button class="secondary eagle-action-btn" data-action="nav" data-view="knowledge">Search Knowledge Center</button>`;
      }

      case'system.backup':return isAdmin()?'<h3>Backup & Restore</h3><p>Create, verify, or restore a protected data package.</p><button class="primary eagle-action-btn" data-action="nav" data-view="backup">Open Backup & Restore</button>':'<p>Backup & Restore is restricted to administrators.</p>';
      case'system.notifications':return'<button class="primary eagle-action-btn" data-action="nav" data-view="notifications">Open Notifications</button>';
      case'system.audit':return (isAdmin()||currentUser?.role==='evaluator')?'<button class="primary eagle-action-btn" data-action="nav" data-view="audit">Open Audit Trail</button>':'<p>Your account is not authorized to view the Audit Trail.</p>';
      case'admin.departments':return isAdmin()?'<button class="primary eagle-action-btn" data-action="nav" data-view="settings">Open Administration</button>':'<p>Department management is restricted to administrators.</p>';
      case'admin.users':return isAdmin()?'<button class="primary eagle-action-btn" data-action="nav" data-view="settings">Open Administration</button>':'<p>User and permission management is restricted to administrators.</p>';
      case'system.profile':return'<button class="primary eagle-action-btn" data-action="nav" data-view="profile">Open My Profile</button>';
      case'system.dashboard':return'<button class="primary eagle-action-btn" data-action="nav" data-view="dashboard">Open Dashboard</button>';
      case'system.matrix':return'<button class="primary eagle-action-btn" data-action="nav" data-view="matrix">Open Readiness Matrix</button>';
      case'system.enterprise':return isAdmin()?'<button class="primary eagle-action-btn" data-action="nav" data-view="enterprise">Open Enterprise Tools</button>':'<p>Enterprise tools are restricted to administrators.</p>';

      default:{
        const hits=SearchEngine.searchAll(state,parsed.raw);
        const k=KnowledgeEngine.answer(state,parsed.raw);
        if(k.found)return `<h3>${esc(k.article.title)}</h3><p>${esc(k.text)}</p><button class="secondary eagle-action-btn" data-action="knowledge" data-id="${esc(k.article.id)}">Open article</button>`;
        if(hits.length)return `<h3>${hits.length} matching record${hits.length===1?'':'s'}</h3>${hits.slice(0,8).map(x=>`<div class="eagle-result-card"><b>${esc(x.title)}</b><small>${esc(x.meta||x.type)}</small></div>`).join('')}<p>Tell me what you want to do with one of these records: open, assign, evaluate, edit, or explain.</p>`;
        return'<p>I could not map that request to an RP workflow yet. Try naming the action and object, for example <b>Assign M03 to Jose</b>, <b>Edit M03-09</b>, <b>What do I need to advance?</b>, or <b>Show overdue corrective actions</b>.</p>';
      }
    }
  }

  function prefillAssignment(parsed){
    if(!isAdmin())return toast('Only an administrator can create assessment assignments');
    createAssessmentAssignment();
    setTimeout(()=>{
      if(parsed.person){
        const q=$one('#assignPersonSearch');if(q){q.value=parsed.person.name;q.dispatchEvent(new Event('input',{bubbles:true}))}
        const s=$one('#assignPerson');if(s)s.value=String(parsed.person.employeeNumber);
      }
      if(parsed.task){
        const t=$one('#assignTask');if(t){t.value=String(parsed.task.id);t.dispatchEvent(new Event('change',{bubbles:true}))}
      }
      if(parsed.evaluator){
        const e=$one('#assignEvaluator');if(e)e.value=String(parsed.evaluator.username);
      }
      if(parsed.dueDate){const d=$one('#assignDueDate');if(d)d.value=parsed.dueDate}
    },100);
  }

  function prefillAssessment(parsed){
    if(!mayEvaluate())return toast('You are not authorized to conduct assessments');
    assess();
    setTimeout(()=>{
      if(parsed.person){
        const q=$one('#aPersonSearch');if(q){q.value=parsed.person.name;q.dispatchEvent(new Event('input',{bubbles:true}))}
        const s=$one('#aPerson');if(s){s.value=String(parsed.person.employeeNumber);s.dispatchEvent(new Event('change',{bubbles:true}))}
      }
      if(parsed.task){
        const t=$one('#aTask');if(t){t.value=String(parsed.task.id);t.dispatchEvent(new Event('change',{bubbles:true}))}
      }
    },100);
  }

  function openSubtask(parsed){
    navigate('tasks');
    setTimeout(()=>{
      $one('#subTab')?.click();
      if(parsed.subtask){
        const search=$one('#sSearchAll');
        if(search){search.value=parsed.subtask.id;search.dispatchEvent(new Event('input',{bubbles:true}))}
      }
    },80);
  }

  function bind(root=document,parsed=null){
    $all('.eagle-action-btn',root).forEach(btn=>{
      btn.onclick=()=>{
        const action=btn.dataset.action;
        try{window.closeEaglePanel?.()}catch{}
        setTimeout(()=>{
          switch(action){
            case'nav':navigate(btn.dataset.view);break;
            case'person':personDetail(btn.dataset.emp);break;
            case'corrective':actionDetail(btn.dataset.id);break;
            case'session':sessionDetail(btn.dataset.id);break;
            case'knowledge':knowledgeArticleDetail(btn.dataset.id);break;
            case'open-assignment':openAssignedAssessment(btn.dataset.id);break;
            case'shift':
              navigate('matrix');
              setTimeout(()=>{const s=$one('#mxShift');if(s){s.value=btn.dataset.shift;s.dispatchEvent(new Event('change',{bubbles:true}))}},60);
              break;
            case'assignment-create':prefillAssignment(parsed||window.__eagleLastParsed||{});break;
            case'assessment-start':prefillAssessment(parsed||window.__eagleLastParsed||{});break;
            case'task-create':taskEdit();break;
            case'task-edit':taskEdit((parsed||window.__eagleLastParsed||{}).task?.id);break;
            case'task-detail':taskDetail(btn.dataset.id);break;
            case'subtask-create':subtaskEdit((parsed||window.__eagleLastParsed||{}).task?.id||'');break;
            case'subtask-edit':{
              const p=parsed||window.__eagleLastParsed||{};
              subtaskEdit(p.subtask?.taskId||p.task?.id||'',p.subtask?.id||'');
              break;
            }
            case'subtask-open':openSubtask(parsed||window.__eagleLastParsed||{});break;
            case'person-create':personEdit();break;
            case'person-edit':{
              const p=(parsed||window.__eagleLastParsed||{}).person;
              personEdit(p?.positionId);
              break;
            }
          }
        },35);
      };
    });
  }

  function answer(q){
    let parsed=parse(q);
    let intent=classify(parsed);
    parsed=applyConversationContext(parsed,intent);

    // Re-score once after context is injected so a follow-up like "assign him M03" works.
    intent=classify(parsed);

    const html=render(parsed,intent);
    const engines=ENGINE_PLAN[intent.family]||ENGINE_PLAN.search;
    const result={
      html,
      intent:intent.id,
      family:intent.family,
      confidence:intent.score,
      engines,
      parsed,
      ranked:intent.ranked.slice(0,5)
    };
    window.__eagleLastParsed=parsed;
    window.__eagleLastResult=result;
    return result;
  }

  // Final public brain contract used by Dashboard, Full Conversation, and Floating Eagle.
  window.RPBrainLegacy=window.RPBrainEnterprise;
  window.RPBrainEnterprise={
    answer,
    bind(root=document){bind(root,window.__eagleLastParsed||null)}
  };

  const priorReasoning=window.ReasoningEngine;
  window.ReasoningEngine={
    ...(priorReasoning||{}),
    explain(question,result){
      const r=result?.intent?result:(window.__eagleLastResult||answer(question));
      return{
        intent:r.intent,
        sources:r.engines,
        summary:`Eagle classified this as “${r.intent}” (score ${Math.round(r.confidence||0)}) and routed it through ${r.engines.join(', ')}.`
      };
    }
  };

  window.EagleOrchestrator={
    version:VERSION,
    parse,
    classifyText(text){const p=parse(text);return classify(p)},
    answer,
    intentCatalog:INTENTS.map(x=>({id:x.id,family:x.family,specificity:x.specificity})),
    engineCoverage(){
      const defs=window.RPIAPlatform?.engineDefinitions||[];
      const map={
        'Eagle':()=>!!window.RPBrainEnterprise,
        'Natural Language Engine':()=>true,
        'Reasoning Engine':()=>!!window.ReasoningEngine,
        'Workflow Engine':()=>!!window.WorkflowEngine,
        'Rules Engine':()=>!!window.RulesEngine,
        'Knowledge Engine':()=>!!window.KnowledgeEngine,
        'Predictive Engine':()=>!!window.PredictiveEngine,
        'Search Engine':()=>!!window.SearchEngine,
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

  console.info(`RP Eagle Brain Rebuild ${VERSION} loaded`);
})();
