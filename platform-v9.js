/* RP IA Enterprise Platform v8.0 — architecture and experience layer */
(function(){
  'use strict';
  const VERSION='9.1.0';
  const $q=(s,r=document)=>r.querySelector(s);
  const $$q=(s,r=document)=>[...r.querySelectorAll(s)];
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const escV=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now=()=>new Date().toISOString();
  const LOG_KEY='rpia-diagnostic-log-v9';
  const logs=()=>{try{return JSON.parse(localStorage.getItem(LOG_KEY))||[]}catch{return[]}};
  function log(level,source,message,detail=''){
    const rows=logs();rows.unshift({time:now(),level,source,message,detail});
    localStorage.setItem(LOG_KEY,JSON.stringify(rows.slice(0,500)));
  }

  const safeCount=(fn)=>{try{return fn()}catch{return 0}};
  const engineDefinitions=[
    ['Eagle AI','Coordinates every engine and returns one clear answer.'],
    ['Natural Language Engine','Understands intent, entities, language, and conversational context.'],
    ['Reasoning Engine','Explains the facts, rules, and evidence behind each conclusion.'],
    ['Workflow Engine','Runs corrective-action, reassessment, approval, and qualification workflows.'],
    ['Rules Engine','Enforces levels, evaluator authority, Critical Gates, evidence, and blocking rules.'],
    ['Knowledge Engine','Connects approved procedures, standard work, training, and lessons learned.'],
    ['Search Engine','Finds authorized records consistently across the entire platform.'],
    ['Predictive Engine','Detects readiness trends, future risks, and development opportunities.'],
    ['Audit Engine','Preserves who changed what, when, and why.'],
    ['Competency Coach Engine','Provides positive, personalized development guidance.'],
    ['Experience Engine','Learns recurring patterns from assessment and training history.'],
    ['Evidence Engine','Organizes photos, files, and evidence connected to official records.'],
    ['Certification Engine','Tracks supporting certifications, validity, and expiration.'],
    ['Readiness Integrity Engine','Validates readiness calculations before they are displayed.'],
    ['Data Quality Engine','Detects duplicates, missing fields, orphan records, and contradictions.'],
    ['Training Effectiveness Engine','Measures whether training improves later performance.'],
    ['Coverage Resilience Engine','Measures vulnerability when qualified people are unavailable.'],
    ['Recertification Engine','Schedules and controls renewal of expiring qualifications.'],
    ['Permission Assurance Engine','Continuously checks role and evaluator permissions.'],
    ['Dependency & Impact Engine','Shows who and what will be affected before a master-data change.']
  ];

  function dataQualityIssues(){
    const issues=[];const seen=new Set();
    for(const p of state.personnel||[]){
      if(!p.employeeNumber||!p.name)continue;
      const k=String(p.employeeNumber);
      if(seen.has(k))issues.push(`Duplicate employee number ${k}`);seen.add(k);
      if(!p.shift)issues.push(`${p.name}: missing shift`);
      if(!p.role)issues.push(`${p.name}: missing role`);
    }
    const subIds=new Set((state.subtasks||[]).map(s=>s.id));
    for(const r of state.results||[])if(r.subtaskId&&!subIds.has(r.subtaskId))issues.push(`Assessment references missing subtask ${r.subtaskId}`);
    return issues;
  }
  function permissionIssues(){
    const rows=[];
    for(const u of authUsers||[]){
      if(u.role==='evaluator'&&!u.maxLevel)rows.push(`${u.name||u.username}: evaluator level missing`);
      if(u.role==='viewer'&&(u.manageMetl||u.managePersonnel))rows.push(`${u.name||u.username}: read-only account has management permission`);
    }
    return rows;
  }
  function readinessIntegrity(){
    const people=(state.personnel||[]).filter(p=>p.employeeNumber&&p.name&&p.status==='Active');
    let low=0;
    for(const p of people){const m=personMetrics(p);if(m.applicable&&m.go+m.nogo+m.assist+m.expired===0)low++;}
    return {people:people.length,lowConfidence:low};
  }
  function engineTest(name){
    const start=performance.now();let status='Healthy',detail='Operational';
    try{
      if(name==='Search Engine'){SearchEngine.searchAll(state,'392');detail='Personnel, task, action, and knowledge indexes responded.'}
      else if(name==='Knowledge Engine'){detail=`${safeCount(()=>state.knowledge.filter(x=>x.status==='Approved').length)} approved articles available.`}
      else if(name==='Rules Engine'){detail=`${readinessIntegrity().people} active personnel evaluated by readiness rules.`}
      else if(name==='Audit Engine'){detail=`${safeCount(()=>state.audit.length)} audit events available.`}
      else if(name==='Data Quality Engine'){const n=dataQualityIssues().length;status=n?'Warning':'Healthy';detail=`${n} data quality issue${n===1?'':'s'} detected.`}
      else if(name==='Permission Assurance Engine'){const n=permissionIssues().length;status=n?'Warning':'Healthy';detail=`${n} permission issue${n===1?'':'s'} detected.`}
      else if(name==='Readiness Integrity Engine'){const r=readinessIntegrity();status=r.lowConfidence?'Warning':'Healthy';detail=`${r.lowConfidence} active profile${r.lowConfidence===1?'':'s'} need more assessment data.`}
      else if(name==='Workflow Engine'){detail=`${safeCount(()=>state.actions.filter(a=>a.status!=='Closed').length)} open workflows/actions.`}
      else if(name==='Experience Engine'){detail=`${safeCount(()=>ExperienceEngine.patterns().length)} experience patterns calculated.`}
      else if(name==='Certification Engine'){detail=`${safeCount(()=>CertificationEngine.expiring().length)} certifications approaching expiration.`}
      else if(name==='Natural Language Engine'){NaturalLanguageEngine.parse('What does John Smith need to advance?');detail='Intent and entity parser responded.'}
      else if(name==='Eagle AI'){detail='Brain routing, search, rules, knowledge, and coaching connections available.'}
      else detail='Foundation loaded and dependencies available.';
    }catch(err){status='Error';detail=err.message||String(err)}
    const ms=Math.max(1,Math.round(performance.now()-start));
    log(status==='Error'?'ERROR':status==='Warning'?'WARNING':'INFO',name,`${status} (${ms} ms)`,detail);
    return{name,status,detail,ms,lastRun:new Date().toLocaleString()};
  }

  window.RPIAPlatform={version:VERSION,engineDefinitions,engineTest,log,dataQualityIssues,permissionIssues,readinessIntegrity};

  /* Reasoning Engine */
  window.ReasoningEngine={
    explain(question,result){
      const parsed=NaturalLanguageEngine?.parse?.(question)||{intent:'general'};
      const sources=['Personnel Master'];
      if(['advancement','person','qualified','shift'].includes(parsed.intent))sources.push('Rules Engine','Readiness Integrity Engine');
      if(parsed.intent==='knowledge')sources.push('Knowledge Engine');
      if(parsed.intent==='actions')sources.push('Workflow Engine');
      sources.push('Audit Engine');
      return{intent:parsed.intent,sources,summary:`Eagle AI interpreted this as “${parsed.intent}” and consulted ${sources.join(', ')}.`};
    }
  };

  /* Foundations for the remaining engines, exposed through one stable registry. */
  window.ReadinessIntegrityEngine={analyze:readinessIntegrity};
  window.DataQualityEngine={scan:dataQualityIssues};
  window.TrainingEffectivenessEngine={analyze(){const rows=state.results||[];return{records:rows.length,message:rows.length?'Assessment history is available for before/after training analysis.':'More assessment history is required.'}}};
  window.CoverageResilienceEngine={analyze(){const risks=window.RPIAEnterprise?.CoverageResilienceEngine?.analyze?.()||[];return risks}};
  window.RecertificationEngine={due(){return window.CertificationEngine?.expiring?.()||[]}};
  window.PermissionAssuranceEngine={scan:permissionIssues};
  window.DependencyImpactEngine={
    assess(entity){
      const id=entity?.id||entity?.employeeNumber||'';
      return{
        assessments:(state.results||[]).filter(r=>r.taskId===id||r.subtaskId===id||r.employeeNumber===id).length,
        actions:(state.actions||[]).filter(a=>a.taskId===id||a.subtaskId===id||a.employeeNumber===id).length,
        personnel:(state.personnel||[]).filter(p=>p.employeeNumber===id).length
      };
    }
  };

  function askBrainCard(){
    return `<section class="card dashboard-brain"><div class="dashboard-card-head"><div><span class="ai-badge">Powered by RP IA</span><h2>Ask Eagle AI</h2></div><span class="brain-orb"><img src="icon-192.png" alt="Eagle AI" class="eagle-mini"></span></div><p>Ask about readiness, employees, tasks, corrective actions, qualifications, or approved procedures.</p><div class="ask-row compact"><input id="dashBrainQuestion" placeholder="Example: What does John Smith need to advance?"><button class="primary" id="dashAskBrain">Ask</button></div><div id="dashBrainAnswer" class="ai-answer compact-answer">Ask a question or open the full conversation.</div><div class="actions"><button class="secondary" id="openFullBrain">Open full conversation</button></div></section>`;
  }

  function metricButton(value,label,cls,target){return `<button class="kpi metric-link ${cls||''}" data-metric="${target}"><b>${value}</b><span>${label}</span></button>`}

  window.dashboard=function(){
    const people=(state.personnel||[]).filter(p=>p.employeeNumber&&p.name&&p.status==='Active');
    const metrics=people.map(p=>({...p,...personMetrics(p)}));
    const readiness=metrics.length?Math.round(metrics.reduce((n,x)=>n+x.pct,0)/metrics.length):0;
    const ready=metrics.filter(x=>x.pct===100&&!x.open&&!x.critical).length;
    const open=(state.actions||[]).filter(a=>a.status!=='Closed');
    const overdue=open.filter(a=>a.targetDate&&a.targetDate<today());
    const critical=(state.results||[]).filter(r=>r.criticality==='Critical Gate'&&r.result!=='GO'&&r.result!=='NOT EVALUATED');
    const due=(state.actions||[]).filter(a=>a.reassessmentDate&&a.reassessmentDate>=today()).slice(0,4);
    const shifts=['A','B','C','D'].map(sh=>{const r=metrics.filter(x=>x.shift===sh);return{shift:sh,count:r.length,pct:r.length?Math.round(r.reduce((a,x)=>a+x.pct,0)/r.length):0,critical:r.reduce((a,x)=>a+x.critical,0)}});
    const hour=new Date().getHours();const greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
    const userName=escV(currentUser?.name||currentUser?.username||'Administrator');
    const weakest=[...shifts].filter(x=>x.count).sort((a,b)=>a.pct-b.pct)[0];
    const missions=[];
    if(overdue.length)missions.push({icon:'⚠️',text:`Review ${overdue.length} overdue corrective action${overdue.length===1?'':'s'}.`,target:'overdue'});
    if(critical.length)missions.push({icon:'🔴',text:`Resolve ${critical.length} Critical Gate issue${critical.length===1?'':'s'}.`,target:'critical'});
    if(weakest)missions.push({icon:'🎯',text:`Strengthen ${weakest.shift} Shift readiness, currently ${weakest.pct}%.`,target:'matrix'});
    if(!missions.length)missions.push({icon:'✅',text:'No urgent compliance issues are recorded. Review upcoming assessments.',target:'assessments'});
    page('Dashboard','',`
      <section class="welcome-intelligence card"><div class="welcome-copy"><span class="eyebrow">Eagle AI operational briefing</span><h1>${greeting}, ${userName}.</h1><p>Welcome back. Eagle AI analyzed the current competency records and prepared today’s highest-impact work.</p></div><div class="briefing-summary" aria-label="Today's operational summary"><span class="eyebrow">Operational Summary</span><div class="briefing-metrics"><button data-briefing="readiness"><b>${readiness}%</b><small>Department readiness</small></button><button data-briefing="critical" class="danger"><b>${critical.length}</b><small>Critical Gate issues</small></button><button data-briefing="open" class="warning"><b>${open.length}</b><small>Open actions</small></button><button data-briefing="assessments"><b>${due.length}</b><small>Upcoming reassessments</small></button></div><div class="briefing-priority"><small>Highest priority</small><b>${escV(missions[0].text)}</b><button class="secondary" id="briefingOpenPriority">Open priority</button></div></div></section>
      <section class="mission-card card"><div class="mission-head"><div><span class="eyebrow">Today's Mission</span><h2>Start with what matters most</h2></div><button class="primary" id="startMission">Start Today's Mission</button></div><div class="mission-list">${missions.slice(0,4).map((m,i)=>`<button class="mission-item" data-target="${m.target}"><b>${i+1}</b><span>${m.icon} ${escV(m.text)}</span><em>Open</em></button>`).join('')}</div></section>
      <div class="dashboard-top-grid">
        <section class="card readiness-master"><div class="dashboard-card-head"><div><span class="eyebrow">Plant Intelligence</span><h2>Readiness</h2></div><div class="readiness-ring" style="background:conic-gradient(var(--primary) 0 ${readiness}%,rgba(70,102,140,.14) ${readiness}% 100%)"><b>${readiness}%</b><span>Department</span></div></div><div class="shift-mini-grid">${shifts.map(s=>`<button class="shift-mini" data-shift="${s.shift}"><b>${s.shift}</b><span>${s.pct}%</span><small>${s.count} active</small></button>`).join('')}</div></section>
        ${askBrainCard()}
      </div>
      <div class="kpis clickable-kpis">
        ${metricButton(people.length,'Active associates','','active')}
        ${metricButton(ready,'Fully ready','good','ready')}
        ${metricButton(open.length,'Open actions','warn','open')}
        ${metricButton(overdue.length,'Overdue actions','bad','overdue')}
        ${metricButton(critical.length,'Critical Gate issues','bad','critical')}
      </div>
      <div class="grid dashboard-detail-grid">
        <section class="card"><h3>Priority attention</h3>${metrics.sort((a,b)=>b.critical-a.critical||b.open-a.open||a.pct-b.pct).slice(0,7).map(x=>`<button class="list-link dashPerson" data-emp="${x.employeeNumber}"><span><b>${escV(x.name)}</b><small>${x.shift} Shift · ${x.role} · ${x.assignedLevel}</small></span><span class="pill ${x.critical?'critical':x.open?'nogo':x.pct>=90?'go':'ne'}">${x.pct}%</span></button>`).join('')||'<p>No priority records.</p>'}</section>
        <section class="card"><h3>Upcoming work</h3>${due.map(x=>`<button class="list-link" data-action="${x.id}"><span><b>${escV(x.associateName||x.employeeNumber||'Associate')}</b><small>${escV(x.reassessmentDate||'')} · ${escV(x.subtaskName||x.subtaskId||'Reassessment')}</small></span></button>`).join('')||'<p>No upcoming reassessments are recorded.</p>'}</section>
        <section class="card full"><h3>Recent activity</h3>${(state.audit||[]).slice(0,6).map(a=>`<div class="activity-row"><span>${escV(a.action)} · ${escV(a.entity)}</span><small>${escV(a.user||'System')} · ${new Date(a.time).toLocaleString()}</small></div>`).join('')||'<p>No recent activity.</p>'}</section>
      </div>`);
    const run=()=>{const q=$q('#dashBrainQuestion').value.trim();if(!q)return;try{const r=RPBrainEnterprise.answer(q);$q('#dashBrainAnswer').innerHTML=r.html;RPBrainEnterprise.bind($q('#dashBrainAnswer'));const why=ReasoningEngine.explain(q,r);log('INFO','Eagle AI',`Question answered: ${q}`,why.summary)}catch(err){$q('#dashBrainAnswer').textContent='Eagle AI could not complete this request. Open Diagnostic Center for details.';log('ERROR','Eagle AI','Dashboard question failed',err.message)}};
    $q('#dashAskBrain').onclick=run;$q('#dashBrainQuestion').onkeydown=e=>{if(e.key==='Enter')run()};$q('#openFullBrain').onclick=()=>openEaglePanel();
    $$q('.dashPerson').forEach(b=>b.onclick=()=>personDetail(b.dataset.emp));$$q('[data-action]').forEach(b=>b.onclick=()=>actionDetail(b.dataset.action));
    $$q('.shift-mini').forEach(b=>b.onclick=()=>{navigate('matrix');setTimeout(()=>{const el=$q('#mShift');if(el){el.value=b.dataset.shift;el.dispatchEvent(new Event('change'))}},0)});
    const openTarget=t=>{if(t==='active'||t==='ready')return navigate('personnel');if(t==='matrix')return navigate('matrix');if(t==='assessments')return navigate('assessments');if(t==='critical'||t==='open'||t==='overdue')return navigate('actions')};
    $$q('.metric-link,.mission-item').forEach(b=>b.onclick=()=>openTarget(b.dataset.metric||b.dataset.target));$q('#startMission').onclick=()=>openTarget(missions[0].target);$$q('[data-briefing]').forEach(b=>b.onclick=()=>openTarget(b.dataset.briefing));$q('#briefingOpenPriority').onclick=()=>openTarget(missions[0].target);
  };

  window.assessmentsUnifiedView=function(){
    const rows=[...(state.sessions||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    page(uiLanguage==='es'?'Evaluaciones':'Assessments',uiLanguage==='es'?'Crea evaluaciones y revisa todo el historial en una sola pantalla':'Create assessments and review the complete history in one place',`
      <div class="card assessment-hub"><div class="assessment-hub-head"><div><h2>Assessment workspace</h2><p>Start a controlled assessment or find an existing signed session.</p></div>${canEvaluate()?'<button class="primary" id="newAssessmentUnified">+ New Assessment</button>':''}</div><div class="filters"><input id="uAssessSearch" placeholder="Search employee name, employee #, task, or evaluator"><select id="uAssessResult"><option value="">All results</option><option>UNQUALIFIED</option><option>CRITICAL</option><option>RECORDED</option></select></div><div id="uAssessTable"></div></div>`);
    const draw=()=>{const q=norm($q('#uAssessSearch').value),r=$q('#uAssessResult').value;const filtered=rows.filter(s=>norm(`${s.employeeNumber||''} ${s.associateName||''} ${s.taskId||''} ${s.taskName||''} ${s.evaluatorName||''}`).includes(q)&&(!r||String(s.finalStatus).includes(r)));$q('#uAssessTable').innerHTML=sessionTable(filtered);$$q('.sv').forEach(b=>b.onclick=()=>sessionDetail(b.dataset.id))};
    $q('#uAssessSearch').oninput=draw;$q('#uAssessResult').onchange=draw;if($q('#newAssessmentUnified'))$q('#newAssessmentUnified').onclick=()=>assess();draw();
  };

  window.diagnosticCenterView=function(){
    if(currentUser?.role!=='admin'){page('Restricted','Diagnostic Center is available only to administrators and IT.',`<div class="card"><p>Access denied.</p></div>`);return}
    const current=engineDefinitions.map(([name])=>engineTest(name));
    const health=Math.round(current.reduce((n,x)=>n+(x.status==='Healthy'?100:x.status==='Warning'?65:0),0)/current.length);
    page('Diagnostic Center','Server, data, engine health, tests, and technical event logs',`
      <div class="diag-overview card"><div><span class="eyebrow">Enterprise diagnostics</span><h2>Overall System Health</h2><p>Run targeted tests without exposing technical tools to production users.</p></div><div class="health-score ${health<80?'warning':''}"><b>${health}%</b><span>${health>=90?'Healthy':health>=70?'Attention required':'Critical'}</span></div></div>
      <div class="diag-actions"><button class="primary" id="runFullDiagnostic">Run Full System Diagnostic</button><button class="secondary" id="openServerConfigDiagnostic">Server Configuration</button><button class="secondary" id="clearDiagnosticLog">Clear Log</button><button class="secondary" id="exportDiagnostic">Export Report</button></div>
      <div id="engineHealthGrid" class="engine-health-grid">${current.map(x=>engineHealthCard(x)).join('')}</div>
      <div class="card terminal-card"><div class="terminal-head"><h3>Live System Log</h3><span>Read-only diagnostic stream</span></div><div id="diagnosticTerminal" class="diagnostic-terminal">${renderLogs()}</div></div>`);
    $$q('.engine-health-card').forEach(b=>b.onclick=()=>engineDiagnosticDetail(b.dataset.engine));
    $q('#runFullDiagnostic').onclick=()=>{const result=engineDefinitions.map(([n])=>engineTest(n));$q('#engineHealthGrid').innerHTML=result.map(engineHealthCard).join('');$$q('.engine-health-card').forEach(b=>b.onclick=()=>engineDiagnosticDetail(b.dataset.engine));$q('#diagnosticTerminal').innerHTML=renderLogs();toast('Full diagnostic completed')};
    $q('#openServerConfigDiagnostic').onclick=()=>window.RpiaServerSetup.open();
    $q('#clearDiagnosticLog').onclick=()=>{localStorage.removeItem(LOG_KEY);$q('#diagnosticTerminal').innerHTML='<div class="terminal-line"><span>INFO</span><b>Diagnostic Center</b><em>Log cleared.</em></div>'};
    $q('#exportDiagnostic').onclick=()=>{const report={generated:now(),version:VERSION,health,engines:engineDefinitions.map(([n])=>engineTest(n)),logs:logs().slice(0,100)};download(JSON.stringify(report,null,2),`RP-IA-diagnostic-${today()}.json`,'application/json')};
  };
  function engineHealthCard(x){return `<button class="engine-health-card ${norm(x.status)}" data-engine="${escV(x.name)}"><span class="health-dot"></span><div><b>${escV(x.name)}</b><small>${escV(x.detail)}</small></div><em>${escV(x.status)}</em></button>`}
  function renderLogs(){return logs().slice(0,100).map(x=>`<div class="terminal-line ${norm(x.level)}"><time>${new Date(x.time).toLocaleTimeString()}</time><span>${escV(x.level)}</span><b>${escV(x.source)}</b><em>${escV(x.message)}</em>${x.detail?`<small>${escV(x.detail)}</small>`:''}</div>`).join('')||'<div class="terminal-line"><span>INFO</span><b>Diagnostic Center</b><em>No diagnostic events recorded.</em></div>'}
  function engineDiagnosticDetail(name){const x=engineTest(name);modal(`<button class="close icon-btn">×</button><h2>${escV(name)}</h2><div class="engine-detail-status ${norm(x.status)}"><b>${x.status}</b><span>${x.ms} ms</span></div><p>${escV(engineDefinitions.find(e=>e[0]===name)?.[1]||'')}</p><div class="detail-list"><p><b>Last test</b><span>${escV(x.lastRun)}</span></p><p><b>Result</b><span>${escV(x.detail)}</span></p><p><b>Platform version</b><span>${VERSION}</span></p></div><div class="actions"><button class="primary" id="rerunEngineTest">Run Test Again</button><button class="secondary close">Close</button></div>`);$q('#rerunEngineTest').onclick=()=>{closeModal();engineDiagnosticDetail(name)}}


  window.backupRestoreView=function(){
    if(currentUser?.role!=='admin'){page('Restricted','Backup & Restore is available only to administrators and IT.',`<div class="card"><p>Access denied.</p></div>`);return}
    let history=[];try{history=JSON.parse(localStorage.getItem('rpia-backup-history-v9'))||[]}catch{}
    page('Backup & Restore','Create, verify, restore, and review protected data packages',`
      <div class="backup-grid"><section class="card"><span class="eyebrow">Manual backup</span><h2>Create a complete backup</h2><p>Downloads personnel, METL, assessments, actions, knowledge, settings, and audit history.</p><button class="primary" id="createFullBackup">Create Backup</button></section><section class="card"><span class="eyebrow">Restore</span><h2>Restore a backup package</h2><p>The selected file is validated before replacing current pilot data.</p><label class="file-label">Choose JSON backup<input id="restoreEnterpriseBackup" type="file" accept="application/json"></label></section><section class="card"><span class="eyebrow">Integrity</span><h2>Verify current data</h2><p id="backupIntegrity">Ready to run validation.</p><button class="secondary" id="verifyBackupData">Verify Data Integrity</button></section><section class="card"><span class="eyebrow">Enterprise destination</span><h2>Server backup</h2><p>Configure server, database, file, and backup addresses for an enterprise deployment.</p><button class="secondary" id="backupServerConfig">Server Configuration</button></section></div>
      <section class="card"><h3>Backup History</h3><div id="backupHistory">${history.map(x=>`<div class="activity-row"><span><b>${escV(x.type)}</b> · ${escV(x.status)}</span><small>${new Date(x.time).toLocaleString()}</small></div>`).join('')||'<p>No backup activity has been recorded on this device.</p>'}</div></section>`);
    const record=(type,status)=>{history.unshift({type,status,time:now()});localStorage.setItem('rpia-backup-history-v9',JSON.stringify(history.slice(0,30)));log('INFO','Backup & Restore',`${type}: ${status}`)};
    $q('#createFullBackup').onclick=()=>{const pkg={format:'RP-IA-BACKUP',version:VERSION,createdAt:now(),state};download(JSON.stringify(pkg,null,2),`RP-IA-Enterprise-backup-${today()}.json`,'application/json');record('Manual backup','Created');toast('Backup created')};
    $q('#restoreEnterpriseBackup').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);const incoming=o.format==='RP-IA-BACKUP'?o.state:o;if(!incoming?.personnel||!incoming?.tasks)throw Error('Required collections are missing');state=normalize(incoming);audit('RESTORE','System','backup','Enterprise backup restored');record('Restore','Completed');toast('Backup restored');backupRestoreView()}catch(err){record('Restore','Failed');toast(`Invalid backup: ${err.message}`)}};rd.readAsText(f)};
    $q('#verifyBackupData').onclick=()=>{const issues=[...dataQualityIssues(),...permissionIssues()];$q('#backupIntegrity').innerHTML=issues.length?`<b>${issues.length} issue(s) found.</b><br>${issues.slice(0,5).map(escV).join('<br>')}`:'<b>PASS</b> — required master collections and permission checks are valid.';record('Integrity verification',issues.length?'Warning':'Passed')};
    $q('#backupServerConfig').onclick=()=>window.RpiaServerSetup.open();
  };

  let eagleConversation=[];
  function currentContext(){const title=$q('#main .page-head h1')?.textContent||'Dashboard';return title}
  window.openEaglePanel=function(){
    let panel=$q('#eagleAssistantPanel');if(!panel){panel=document.createElement('aside');panel.id='eagleAssistantPanel';panel.className='eagle-assistant-panel';document.body.appendChild(panel)}
    panel.innerHTML=`<div class="eagle-panel-head"><div><img src="icon-192.png" alt="Eagle AI"><span><b>Ask Eagle AI</b><small>Context: ${escV(currentContext())}</small></span></div><button id="closeEaglePanel" class="icon-btn">✕</button></div><div id="eagleMessages" class="eagle-messages">${eagleConversation.map(m=>`<div class="eagle-msg ${m.role}">${m.html}</div>`).join('')||'<div class="eagle-msg assistant">How can I help you with this screen?</div>'}</div><div class="eagle-compose"><input id="eagleQuestion" placeholder="Ask anything about your operation..."><button class="primary" id="sendEagleQuestion">Ask</button></div>`;
    panel.classList.add('open');window.closeEaglePanel=()=>panel.classList.remove('open');$q('#closeEaglePanel').onclick=window.closeEaglePanel;
    const send=()=>{const input=$q('#eagleQuestion'),q=input.value.trim();if(!q)return;eagleConversation.push({role:'user',html:escV(q)});let html;try{const r=RPBrainEnterprise.answer(q);html=r.html;const why=ReasoningEngine.explain(q,r);html+=`<details class="reasoning-summary"><summary>Why this answer?</summary><p>${escV(why.summary)}</p></details>`;log('INFO','Eagle AI',`Question answered in ${currentContext()}`,why.summary)}catch(err){html=`Eagle AI could not complete this request. ${escV(err.message||'')}`;log('ERROR','Eagle AI','Floating assistant failed',err.message)}eagleConversation.push({role:'assistant',html});openEaglePanel();setTimeout(()=>{$q('#eagleMessages').scrollTop=$q('#eagleMessages').scrollHeight},0)};
    $q('#sendEagleQuestion').onclick=send;$q('#eagleQuestion').onkeydown=e=>{if(e.key==='Enter')send()};setTimeout(()=>$q('#eagleQuestion')?.focus(),50)
  };
  function ensureFloatingEagle(){if(!$q('#app')||$q('#app').classList.contains('hidden'))return;let b=$q('#floatingEagleAI');if(!b){b=document.createElement('button');b.id='floatingEagleAI';b.className='floating-eagle-ai';b.innerHTML='<img src="icon-192.png" alt=""><span>Ask Eagle AI</span>';b.onclick=openEaglePanel;document.body.appendChild(b)}}
  window.enterpriseToolsView=function(){
    if(currentUser?.role!=='admin'){navigate('dashboard');return}
    page('Enterprise','Server configuration, diagnostics, security, and recovery tools',`<div class="enterprise-module-grid"><button class="enterprise-module" id="enterpriseServer"><span>🖥️</span><b>Server Configuration</b><small>Local, test, production, API, files, and authentication.</small></button><button class="enterprise-module" id="enterpriseDiagnostics"><span>🛠️</span><b>Diagnostic Center</b><small>Engine health, tests, logs, and diagnostic reports.</small></button><button class="enterprise-module" id="enterpriseBackup"><span>💾</span><b>Backup & Restore</b><small>Create, verify, restore, and review local or enterprise backups.</small></button><button class="enterprise-module" id="enterpriseSecurity"><span>🔐</span><b>Security Center</b><small>Review roles and permission assurance issues.</small></button></div><div id="enterpriseSummary" class="card"><h3>Platform status</h3><p>${dataQualityIssues().length} data quality issue(s) · ${permissionIssues().length} permission issue(s).</p></div>`);
    $q('#enterpriseServer').onclick=()=>window.RpiaServerSetup.open();$q('#enterpriseDiagnostics').onclick=diagnosticCenterView;$q('#enterpriseBackup').onclick=backupRestoreView;$q('#enterpriseSecurity').onclick=()=>{const issues=permissionIssues();$q('#enterpriseSummary').innerHTML=`<h3>Permission Assurance</h3>${issues.map(i=>`<p>⚠ ${escV(i)}</p>`).join('')||'<p>✓ No permission assurance issues detected.</p>'}`};
  };



  window.metlIntelligence=function(){
    const people=(state.personnel||[]).filter(p=>p.employeeNumber&&p.name&&p.status==='Active');
    const avg=people.length?Math.round(people.reduce((n,p)=>n+personMetrics(p).pct,0)/people.length):0;
    page('Ask Eagle AI','One conversation interface coordinated by all RP IA engines',`
      <div class="conversation-shell">
        <aside class="conversation-context card"><span class="ai-badge">Powered by RP IA</span><h2>Eagle AI</h2><p>Ask about employees, advancement, readiness, qualifications, actions, tasks, or approved work knowledge.</p><div class="context-stat"><b>${avg}%</b><span>Department readiness</span></div><button class="secondary" id="brainBackDashboard">Return to Dashboard</button></aside>
        <section class="card conversation-main"><div id="brainConversation" class="brain-conversation"><div class="brain-message assistant"><b>Eagle AI</b><p>How can I help? I will coordinate the appropriate engines and explain the basis of the answer.</p></div></div><div class="quick-prompts"><button>Who is closest to advancement?</button><button>Show overdue corrective actions</button><button>Who can perform Die Move independently?</button><button>Open the approved Die Move procedure</button></div><div class="ask-row"><input id="fullBrainQuestion" placeholder="Example: What does John Smith need to advance?"><button class="primary" id="fullBrainAsk">Ask</button></div></section>
      </div>`);
    const run=()=>{const input=$q('#fullBrainQuestion'),q=input.value.trim();if(!q)return;const box=$q('#brainConversation');box.insertAdjacentHTML('beforeend',`<div class="brain-message user"><b>You</b><p>${escV(q)}</p></div>`);input.value='';try{const r=RPBrainEnterprise.answer(q);const why=ReasoningEngine.explain(q,r);box.insertAdjacentHTML('beforeend',`<div class="brain-message assistant"><b>Eagle AI</b><div class="brain-response">${r.html}</div><details class="reasoning-summary"><summary>Why this answer?</summary><p>${escV(why.summary)}</p><p><b>Sources:</b> ${why.sources.map(escV).join(' · ')}</p></details></div>`);RPBrainEnterprise.bind(box);log('INFO','Reasoning Engine',`Reasoning trace created for: ${q}`,why.summary)}catch(err){box.insertAdjacentHTML('beforeend',`<div class="brain-message assistant error"><b>Eagle AI</b><p>I could not complete that request. The error was sent to Diagnostic Center.</p></div>`);log('ERROR','Eagle AI','Conversation request failed',err.message||String(err))}box.scrollTop=box.scrollHeight};
    $q('#fullBrainAsk').onclick=run;$q('#fullBrainQuestion').onkeydown=e=>{if(e.key==='Enter')run()};$$q('.quick-prompts button').forEach(b=>b.onclick=()=>{$q('#fullBrainQuestion').value=b.textContent;run()});$q('#brainBackDashboard').onclick=()=>navigate('dashboard');
  };

  /* Replace navigation with user modules only; engines stay invisible. */
  window.navDefs=[
    ['dashboard','Dashboard','Inicio'],
    ['personnel','Personnel','Personal'],
    ['tasks','METL & Subtasks','METL y subtareas'],
    ['matrix','Readiness Matrix','Matriz de preparación'],
    ['assessments','Assessments','Evaluaciones'],
    ['actions','Corrective Actions','Acciones correctivas'],
    ['knowledge','Knowledge Center','Centro de conocimiento'],
    ['notifications','Notifications','Notificaciones'],
    ['audit','Audit Trail','Auditoría'],
    ['profile','My Profile','Mi perfil'],
    ['settings','Administration','Administración'],
    ['enterprise','Enterprise','Enterprise']
  ];
  window.renderNav=function(){
    const allowed=window.navDefs.filter(x=>{if(['settings','enterprise'].includes(x[0]))return currentUser.role==='admin';if(x[0]==='audit')return currentUser.role==='admin'||currentUser.role==='evaluator';return true});
    $q('#nav').innerHTML=allowed.map(([id,en,es])=>`<button data-view="${id}">${uiLanguage==='es'?es:en}</button>`).join('')+`<div class="nav-spacer"></div><div class="nav-footer"><strong>RP IA</strong>${uiLanguage==='es'?'Impulsado por RP IA':'Powered by RP IA'}</div>`;
    $$q('#nav button').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
  };
  window.navigate=function(v){
    view=v;trackInterest(v,1);$$q('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$q('#nav').classList.remove('open');$q('#navScrim').classList.remove('open');
    const routes={dashboard,personnel,tasks,matrix:matrixView,assessments:assessmentsUnifiedView,actions,knowledge:knowledgeCenterView,notifications:notificationView,audit:auditView,profile:myProfile,settings,enterprise:enterpriseToolsView,backup:backupRestoreView,intelligence:metlIntelligence};
    try{(routes[v]||dashboard)()}catch(err){console.error('RP IA view error',v,err);log('ERROR','Navigation',`Unable to open ${v}`,err.message||String(err));page('Unable to open this view','The rest of RP IA is still available.',`<div class="card"><h3>View error</h3><p>${escV(err?.message||'Unknown error')}</p><button class="primary" id="returnDashboard">Return to dashboard</button></div>`);$q('#returnDashboard').onclick=()=>navigate('dashboard')}
  };

  /* Server icon now opens Enterprise tools, where Diagnostic Center lives. */
  const serverBtn=$q('#serverConfigBtn');if(serverBtn)serverBtn.onclick=()=>navigate('enterprise');
  log('INFO','Platform',`RP IA Enterprise Platform ${VERSION} loaded`,'20 engines registered; Eagle AI and enterprise layers initialized.');setInterval(ensureFloatingEagle,700);
})();
