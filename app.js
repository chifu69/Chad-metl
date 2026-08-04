const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const levelRank={'-10':1,'-20':2,'-30':3,'-40':4};
const profiles=[
 {id:'admin',name:'System Administrator',role:'admin',label:'Administrator'},
 {id:'ev40',name:'Chad R. Walker',role:'evaluator',label:'Approved Evaluator (-40)',maxLevel:'-40'},
 {id:'ev10',name:'Kevin Buckner',role:'evaluator',label:'Approved Evaluator (-10)',maxLevel:'-10'},
 {id:'associate',name:'Dustin Cox',role:'associate',label:'Extrusion Associate',employeeNumber:'1018'},
 {id:'leader',name:'Plant Leadership',role:'viewer',label:'Leadership / Read-only'}];
let state,currentUser,view='dashboard';
const storageKey='k1-metl-pilot-state-v01';
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1800)}
function save(){
  try{localStorage.setItem(storageKey,JSON.stringify(state))}
  catch(err){console.warn('Unable to save local state',err)}
}
function audit(action,entity,id,detail){state.audit.unshift({time:new Date().toISOString(),user:currentUser?.name||'System',action,entity,id,detail});save()}
function cloneData(value){
  if(value==null)return null;
  try{return JSON.parse(JSON.stringify(value))}catch(err){console.warn('Unable to clone baseline',err);return null}
}
function emptyState(){
  return {
    meta:{name:'K1 Extrusion METL Competency System',version:'Recovery',schemaVersion:'1.0',aiReady:true},
    personnel:[],evaluators:[],tasks:[],subtasks:[],sessions:[],results:[],actions:[],audit:[],aiNotes:[]
  };
}
function loadInitialState(){
  const baseline=cloneData(window.METL_BASELINE);
  const saved=localStorage.getItem(storageKey);
  if(saved){
    try{
      const parsed=JSON.parse(saved);
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed;
      console.warn('Saved METL state was not an object; restoring baseline');
    }catch(err){
      console.warn('Saved METL state was invalid; restoring baseline',err);
      try{localStorage.removeItem(storageKey)}catch(_){}
    }
  }
  return baseline&&typeof baseline==='object'?baseline:emptyState();
}
async function init(){
  try{
    profiles.forEach(p=>$('#profileSelect').add(new Option(p.label,p.id)));
    state=loadInitialState();
    normalizeState();
    save();
    $('#loginBtn').addEventListener('click',login);
    $('#pin').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
    $('#logoutBtn').addEventListener('click',logout);
    $('#menuBtn').addEventListener('click',()=>{const open=!$('#nav').classList.contains('open');$('#nav').classList.toggle('open',open);$('#navScrim')?.classList.toggle('open',open)});
    $('#navScrim').addEventListener('click',()=>{$('#nav').classList.remove('open');$('#navScrim').classList.remove('open')});
    $('#startupStatus').textContent=`Ready · ${state.personnel.length} personnel · ${state.tasks.filter(t=>t.status==='Active').length} tasks`;
    if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch(err){
    console.error(err);
    const s=$('#startupStatus');
    if(s){s.textContent='Startup error: '+err.message;s.classList.add('error')}
  }
}
function normalizeState(){
  if(!state||typeof state!=='object'||Array.isArray(state))state=emptyState();
  state.meta=(state.meta&&typeof state.meta==='object'&&!Array.isArray(state.meta))?state.meta:{};
  state.meta.schemaVersion=state.meta.schemaVersion||'1.0';
  state.meta.aiReady=true;
  state.personnel=state.personnel||[];
  state.evaluators=state.evaluators||[];
  state.tasks=state.tasks||[];
  state.subtasks=state.subtasks||[];
  state.sessions=state.sessions||[];
  state.results=state.results||[];
  state.actions=state.actions||[];
  state.audit=state.audit||[];
  state.aiNotes=state.aiNotes||[];
}
function login(){
  if($('#pin').value.trim()!=='2468')return toast('Incorrect demo PIN');
  currentUser=profiles.find(p=>p.id===$('#profileSelect').value);
  if(!currentUser)return toast('Select a user profile');
  sessionStorage.setItem('k1-metl-profile',currentUser.id);
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#roleBadge').textContent=currentUser.label;
  renderNav();
  navigate('dashboard');
}
function logout(){$('#app').classList.add('hidden');$('#login').classList.remove('hidden');currentUser=null}
const iconSvg={
 dashboard:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
 personnel:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 14c3.2-.5 5 1.2 5.5 4"/></svg>',
 tasks:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M8 9h8M8 13h8M8 17h5"/></svg>',
 assess:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 9"/></svg>',
 actions:'<svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.5v.2"/></svg>',
 insights:'<svg viewBox="0 0 24 24"><path d="M12 2.5 13.7 8l5.8 1.7-5.8 1.8L12 17l-1.7-5.5-5.8-1.8L10.3 8 12 2.5Z"/><path d="m18.5 15 .8 2.4 2.2.7-2.2.8-.8 2.3-.7-2.3-2.3-.8 2.3-.7.7-2.4Z"/></svg>',
 audit:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
 settings:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="white"/><circle cx="15" cy="12" r="2" fill="white"/><circle cx="11" cy="18" r="2" fill="white"/></svg>'
};
const navItems=[
 {group:'Overview',items:[['dashboard','Dashboard']]},
 {group:'Operations',items:[['personnel','Personnel'],['tasks','METL Tasks'],['assess','New Assessment']]},
 {group:'Quality & Intelligence',items:[['actions','Corrective Actions'],['insights','AI Readiness'],['audit','Audit Trail']]},
 {group:'Administration',items:[['settings','Data & Export']]}
];
function allowed(id){if(currentUser.role==='associate')return ['dashboard','tasks','actions','insights'].includes(id);if(currentUser.role==='viewer')return id!=='assess'&&id!=='settings';if(currentUser.role==='evaluator')return id!=='settings';return true}
function renderNav(){
 const groups=navItems.map(g=>{const items=g.items.filter(([id])=>allowed(id));if(!items.length)return '';return `<div class="nav-group">${g.group}</div>${items.map(([id,label])=>`<button class="nav-link" data-view="${id}">${iconSvg[id]}<span>${label}</span></button>`).join('')}`}).join('');
 const stamp=state.meta?.generated||new Date().toISOString().slice(0,10);
 $('#nav').innerHTML=`${groups}<div class="nav-spacer"></div><div class="nav-footer"><strong>${esc(currentUser.name)}</strong>${esc(currentUser.label)}<br>Workbook baseline: ${esc(stamp)}<br>v2.0 Enterprise</div>`;
 $$('#nav button').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
}
function navigate(v){view=v;$$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#nav').classList.remove('open');$('#navScrim')?.classList.remove('open');({dashboard,personnel,tasks,assess,actions,insights,audit:audits,settings}[v]||dashboard)()}
function page(title,sub,body,actions=''){$('#main').innerHTML=`<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div><div class="actions">${actions}</div></div>${body}`}
function personScope(){return currentUser.role==='associate'?state.personnel.filter(p=>p.employeeNumber===currentUser.employeeNumber):state.personnel}
function dashboard(){
 const ppl=personScope();
 const active=ppl.filter(p=>p.name&&p.status!=='Inactive').length;
 const curr=state.results.filter(r=>r.recordStatus==='Current');
 const noGo=curr.filter(r=>r.result==='NO-GO').length;
 const critical=curr.filter(r=>r.result==='NO-GO'&&state.subtasks.find(s=>s.id===r.subtaskId)?.criticality==='Critical Gate').length;
 const open=state.actions.filter(a=>a.status!=='Closed').length;
 const assessed=new Set(state.sessions.map(x=>x.employeeNumber)).size;
 const coverage=active?Math.round(assessed/active*100):0;
 const activeTasks=state.tasks.filter(t=>t.status==='Active').length;
 const criticalGates=state.subtasks.filter(s=>s.status==='Active'&&s.criticality==='Critical Gate').length;
 const shifts=['A','B','C','D'];
 const shiftRows=shifts.map(s=>{const roster=state.personnel.filter(p=>p.shift===s&&p.name&&p.status!=='Inactive').length;const done=new Set(state.sessions.filter(x=>x.shift===s).map(x=>x.employeeNumber)).size;const pct=roster?Math.min(100,Math.round(done/roster*100)):0;return `<tr><td><b>${s}</b></td><td>${roster}</td><td>${done}</td><td><div class="bar"><i style="width:${pct}%"></i></div><small>${pct}%</small></td></tr>`}).join('');
 page('Readiness Dashboard','Live view of the imported competency workboard and local assessment activity',`
 <div class="grid kpis">
  <div class="card kpi"><span>Personnel roster</span><strong>${active}</strong><small>${state.evaluators.length} approved evaluators</small></div>
  <div class="card kpi"><span>Assessment coverage</span><strong>${coverage}%</strong><small>${assessed} associates assessed</small></div>
  <div class="card kpi"><span>Current NO-GO</span><strong>${noGo}</strong><small>${critical} critical-gate failures</small></div>
  <div class="card kpi"><span>Open corrective actions</span><strong>${open}</strong><small>Require documented closure</small></div>
 </div>
 <div class="grid two" style="margin-top:14px">
  <div class="card"><h3>Shift readiness coverage</h3><div class="table-wrap"><table><thead><tr><th>Shift</th><th>Roster</th><th>Assessed</th><th>Coverage</th></tr></thead><tbody>${shiftRows}</tbody></table></div></div>
  <div class="card dashboard-highlight"><h3>Workbook baseline loaded</h3><p>The application contains the normalized data imported from the competency workboard.</p><div class="metric-row"><div><b>${activeTasks}</b><span>Active METL tasks</span></div><div><b>${state.subtasks.length}</b><span>Evaluation subtasks</span></div><div><b>${criticalGates}</b><span>Critical gates</span></div></div><p class="muted">Source: ${esc(state.meta?.sourceWorkbook||'K1 Extrusion METL workbook')}</p></div>
 </div>
 <div class="card" style="margin-top:14px"><h3>Qualification doctrine</h3><p><b>Trained:</b> all applicable critical gates GO and at least 90% standard subtasks GO. <b>Practiced:</b> at least 70% GO with no current critical NO-GO. <b>Untrained:</b> current critical NO-GO or below threshold.</p><p class="muted">Levels are cumulative from -10 through -40. Recommendations in AI Readiness are explainable and derived from assessment evidence.</p></div>`)
}
function personnel(){let data=personScope();page('Personnel','Master roster; identity should be maintained once',`<div class="filters"><input id="pSearch" placeholder="Search name or employee #"><select id="pShift"><option value="">All shifts</option>${['A','B','C','D'].map(x=>`<option>${x}</option>`).join('')}</select><select id="pRole"><option value="">All roles</option>${['Supervisor','Sr. Lead','Operator'].map(x=>`<option>${x}</option>`).join('')}</select></div><div id="ptable"></div>`,currentUser.role==='admin'?'<button class="primary" id="addPerson">Add person</button>':'');const draw=()=>{let q=$('#pSearch').value.toLowerCase(),sh=$('#pShift').value,ro=$('#pRole').value;let rows=data.filter(p=>(p.name+' '+p.employeeNumber).toLowerCase().includes(q)&&(!sh||p.shift===sh)&&(!ro||p.role===ro)).map(p=>`<tr><td>${esc(p.employeeNumber)}</td><td>${esc(p.name)}</td><td>${p.shift}</td><td>${p.role}</td><td><span class="pill ${String(p.status).toLowerCase()}">${p.status}</span></td><td>${p.assignedLevel}</td><td>${p.approvedLevel||'—'}</td></tr>`).join('');$('#ptable').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Employee #</th><th>Name</th><th>Shift</th><th>Role</th><th>Status</th><th>Assigned</th><th>Approved</th></tr></thead><tbody>${rows}</tbody></table></div>`};['pSearch','pShift','pRole'].forEach(id=>$(`#${id}`).oninput=draw);draw();if($('#addPerson'))$('#addPerson').onclick=()=>personModal()}
function personModal(){modal(`<h2>Add personnel record</h2><div class="form-grid"><label>Employee number<input id="mEmp"></label><label>Name<input id="mName"></label><label>Shift<select id="mShift">${['A','B','C','D'].map(x=>`<option>${x}</option>`)}</select></label><label>Role<select id="mRole">${['Operator','Sr. Lead','Supervisor'].map(x=>`<option>${x}</option>`)}</select></label><label>Assigned level<select id="mLevel">${Object.keys(levelRank).map(x=>`<option>${x}</option>`)}</select></label></div><div class="actions"><button class="primary" id="savePerson">Save</button><button class="secondary close">Cancel</button></div>`);$('#savePerson').onclick=()=>{if(!$('#mEmp').value||!$('#mName').value)return toast('Employee number and name required');state.personnel.push({employeeNumber:$('#mEmp').value,name:$('#mName').value,shift:$('#mShift').value,role:$('#mRole').value,assignedLevel:$('#mLevel').value,status:'Active'});audit('CREATE','Personnel',$('#mEmp').value,'Personnel record created');closeModal();personnel()}}
function tasks(){let canEdit=currentUser.role==='admin';page('METL Tasks',`${state.tasks.length} tasks and ${state.subtasks.length} supporting subtasks imported from the workbook`,`<div class="filters"><input id="tSearch" placeholder="Search task"><select id="tLevel"><option value="">All levels</option>${Object.keys(levelRank).map(x=>`<option>${x}</option>`)}</select><select id="tDomain"><option value="">All domains</option>${[...new Set(state.tasks.map(t=>t.domain))].map(x=>`<option>${esc(x)}</option>`)}</select></div><div id="taskList" class="grid"></div>`,canEdit?'<button class="primary" id="newTask">New task</button>':'');const draw=()=>{let q=$('#tSearch').value.toLowerCase(),lv=$('#tLevel').value,dm=$('#tDomain').value;$('#taskList').innerHTML=state.tasks.filter(t=>(t.id+' '+t.name+' '+t.description).toLowerCase().includes(q)&&(!lv||t.requiredLevel===lv)&&(!dm||t.domain===dm)).map(t=>{let n=state.subtasks.filter(s=>s.taskId===t.id&&s.status==='Active').length,c=state.subtasks.filter(s=>s.taskId===t.id&&s.criticality==='Critical Gate').length;return `<div class="card"><div class="page-head"><div><h3>${t.id} — ${esc(t.name)}</h3><p>${esc(t.domain)} · ${t.requiredLevel} · Revision ${t.revision}</p></div><div class="actions"><button class="secondary detail" data-id="${t.id}">View</button>${canEdit?`<button class="secondary edit" data-id="${t.id}">Revise</button>`:''}</div></div><p>${esc(t.description)}</p><small>${n} subtasks · ${c} critical gates · recert ${t.recertMonths} months</small></div>`}).join('');$$('.detail').forEach(b=>b.onclick=()=>taskDetail(b.dataset.id));$$('.edit').forEach(b=>b.onclick=()=>taskEdit(b.dataset.id))};['tSearch','tLevel','tDomain'].forEach(id=>$(`#${id}`).oninput=draw);draw();if($('#newTask'))$('#newTask').onclick=()=>taskEdit()}
function taskDetail(id){const t=state.tasks.find(x=>x.id===id),subs=state.subtasks.filter(s=>s.taskId===id).sort((a,b)=>a.sequence-b.sequence);page(`${t.id} — ${esc(t.name)}`,`${t.domain} · ${t.requiredLevel} · Revision ${t.revision}`,`<div class="card"><p>${esc(t.description)}</p><p><b>Standard:</b> ${esc(t.trainedStandard)}</p><p><b>Source:</b> ${esc(t.source)}</p></div><h3>Supporting subtasks</h3><div class="grid">${subs.map(s=>`<div class="card"><b>${s.id}</b> <span class="pill ${s.criticality==='Critical Gate'?'critical':'ne'}">${esc(s.criticality)}</span><p>${esc(s.name)}</p><small><b>Performance standard:</b> ${esc(s.standard)}</small></div>`).join('')}</div>`,'<button class="secondary" id="backTasks">Back</button>');$('#backTasks').onclick=tasks}
function taskEdit(id){const old=id?state.tasks.find(t=>t.id===id):null;modal(`<h2>${old?'Create new revision':'Create METL task'}</h2><div class="form-grid"><label>Task ID<input id="eId" value="${esc(old?.id||'')}"></label><label>Name<input id="eName" value="${esc(old?.name||'')}"></label><label>Domain<input id="eDomain" value="${esc(old?.domain||'')}"></label><label>Required level<select id="eLevel">${Object.keys(levelRank).map(x=>`<option ${old?.requiredLevel===x?'selected':''}>${x}</option>`)}</select></label><label class="full">Description<textarea id="eDesc">${esc(old?.description||'')}</textarea></label><label class="full">Trained standard<textarea id="eStd">${esc(old?.trainedStandard||'')}</textarea></label><label>Recert months<input id="eRecert" type="number" value="${old?.recertMonths||12}"></label><label>Effective date<input id="eDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label class="full">Revision reason<textarea id="eReason"></textarea></label></div><div class="actions"><button class="primary" id="saveTask">Publish</button><button class="secondary close">Cancel</button></div>`);$('#saveTask').onclick=()=>{let tid=$('#eId').value.trim();if(!tid||!$('#eName').value)return toast('Task ID and name required');if(old){old.status='Superseded';const revised={...old,name:$('#eName').value,domain:$('#eDomain').value,requiredLevel:$('#eLevel').value,description:$('#eDesc').value,trainedStandard:$('#eStd').value,recertMonths:+$('#eRecert').value,effectiveDate:$('#eDate').value,revision:(old.revision||1)+1,status:'Active',previousRevision:old.revision,revisionReason:$('#eReason').value};state.tasks.push(revised);audit('REVISE','METL Task',tid,`Revision ${revised.revision}: ${$('#eReason').value||'No reason entered'}`)}else{state.tasks.push({id:tid,name:$('#eName').value,domain:$('#eDomain').value,requiredLevel:$('#eLevel').value,description:$('#eDesc').value,trainedStandard:$('#eStd').value,recertMonths:+$('#eRecert').value,effectiveDate:$('#eDate').value,revision:1,status:'Active'});audit('CREATE','METL Task',tid,'Task created')}closeModal();tasks()}}
function assess(){if(!['admin','evaluator'].includes(currentUser.role))return dashboard();const activePeople=state.personnel.filter(p=>p.name&&p.status!=='Inactive'),activeTasks=state.tasks.filter(t=>t.status==='Active');page('New Assessment','Evaluator authority and Critical Gate logic are enforced on submission',`<div class="card form-grid"><label>Associate<select id="aPerson"><option value="">Select</option>${activePeople.map(p=>`<option value="${p.employeeNumber}">${esc(p.name)} · ${p.shift} · ${p.assignedLevel}</option>`)}</select></label><label>METL task<select id="aTask"><option value="">Select</option>${activeTasks.map(t=>`<option value="${t.id}">${t.id} — ${esc(t.name)} (${t.requiredLevel})</option>`)}</select></label><label>Method<select id="aMethod">${['Hands-On','Simulation','Oral/Written','Document Review','Combined'].map(x=>`<option>${x}</option>`)}</select></label><label>Location / line<input id="aLine"></label></div><div id="evalSubs"></div>`);$('#aTask').onchange=drawAssessment;$('#aPerson').onchange=drawAssessment}
function drawAssessment(){const emp=$('#aPerson').value,tid=$('#aTask').value;if(!emp||!tid)return $('#evalSubs').innerHTML='';const p=state.personnel.find(x=>x.employeeNumber===emp),t=state.tasks.find(x=>x.id===tid);let max=currentUser.role==='admin'?4:levelRank[currentUser.maxLevel];if(levelRank[t.requiredLevel]>max){$('#evalSubs').innerHTML=`<div class="card"><span class="pill nogo">Not authorized</span><p>Your evaluator authority does not cover ${t.requiredLevel}.</p></div>`;return}let subs=state.subtasks.filter(s=>s.taskId===tid&&s.status==='Active'&&levelRank[s.requiredLevel]<=levelRank[p.assignedLevel]);$('#evalSubs').innerHTML=`<h3>${subs.length} applicable subtasks</h3>${subs.map(s=>`<div class="subtask-eval ${s.criticality==='Critical Gate'?'critical-box':''}" data-sub="${s.id}"><h4>${s.id} ${s.criticality==='Critical Gate'?'<span class="pill critical">Critical Gate</span>':''}</h4><p>${esc(s.name)}</p><label>Result<select class="r"><option>NE</option><option>GO</option><option>NO-GO</option><option>REQUIRES ASSISTANCE</option></select></label><label>Evidence / observation<textarea class="o" placeholder="Objective evidence and observations"></textarea></label></div>`).join('')}<button class="primary" id="submitAssessment">Submit assessment</button>`;$('#submitAssessment').onclick=submitAssessment}
function submitAssessment(){const emp=$('#aPerson').value,tid=$('#aTask').value,p=state.personnel.find(x=>x.employeeNumber===emp),t=state.tasks.find(x=>x.id===tid),sid='S-'+Date.now();let rows=$$('.subtask-eval').map(box=>({subtaskId:box.dataset.sub,result:box.querySelector('.r').value,observation:box.querySelector('.o').value}));let critFail=rows.some(r=>r.result==='NO-GO'&&state.subtasks.find(s=>s.id===r.subtaskId)?.criticality==='Critical Gate');state.sessions.push({id:sid,employeeNumber:emp,associateName:p.name,shift:p.shift,role:p.role,taskId:tid,taskName:t.name,date:new Date().toISOString().slice(0,10),evaluatorName:currentUser.name,method:$('#aMethod').value,status:'Closed',location:$('#aLine').value,finalStatus:critFail?'Unqualified':'Recorded'});rows.forEach(r=>{state.results.push({sessionId:sid,employeeNumber:emp,taskId:tid,...r,recordStatus:'Current',requiredLevel:state.subtasks.find(s=>s.id===r.subtaskId)?.requiredLevel});if(r.result==='NO-GO'){state.actions.push({id:'CA-'+Date.now()+'-'+r.subtaskId,employeeNumber:emp,employee:p.name,shift:p.shift,taskId:tid,subtaskId:r.subtaskId,criticality:state.subtasks.find(s=>s.id===r.subtaskId)?.criticality,observation:r.observation,status:'Open',owner:currentUser.name,targetDate:'',created:new Date().toISOString()})}});audit('SUBMIT','Assessment',sid,`${p.name} / ${tid}; critical failure=${critFail}`);toast(critFail?'Saved: qualification blocked by Critical Gate':'Assessment saved');dashboard()}
function actions(){let acts=currentUser.role==='associate'?state.actions.filter(a=>a.employeeNumber===currentUser.employeeNumber):state.actions;page('Corrective Actions','NO-GO records are preserved; closure creates a separate audit event',`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Associate</th><th>Task / Subtask</th><th>Criticality</th><th>Status</th><th>Owner</th><th></th></tr></thead><tbody>${acts.map(a=>`<tr><td>${a.id}</td><td>${esc(a.employee)}</td><td>${a.taskId}<br>${a.subtaskId}</td><td><span class="pill ${a.criticality==='Critical Gate'?'critical':'ne'}">${esc(a.criticality)}</span></td><td><span class="pill ${a.status==='Closed'?'go':'nogo'}">${a.status}</span></td><td>${esc(a.owner)}</td><td>${['admin','evaluator'].includes(currentUser.role)&&a.status!=='Closed'?`<button class="secondary closeAction" data-id="${a.id}">Close</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">No corrective actions.</td></tr>'}</tbody></table></div>`);$$('.closeAction').forEach(b=>b.onclick=()=>{let a=state.actions.find(x=>x.id===b.dataset.id);a.status='Closed';a.closedBy=currentUser.name;a.closedDate=new Date().toISOString();audit('CLOSE','Corrective Action',a.id,'Closed after competency demonstration');actions()})}
function audits(){page('Audit Trail','Pilot record of create, revise, assess, and closure events',`<div class="table-wrap"><table><thead><tr><th>Date/time</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>Detail</th></tr></thead><tbody>${state.audit.map(a=>`<tr><td>${new Date(a.time).toLocaleString()}</td><td>${esc(a.user)}</td><td>${a.action}</td><td>${a.entity}</td><td>${a.id}</td><td>${esc(a.detail)}</td></tr>`).join('')||'<tr><td colspan="6">No pilot changes yet.</td></tr>'}</tbody></table></div>`)}

function qualificationSnapshot(person){
  const applicable=state.subtasks.filter(s=>s.status==='Active'&&levelRank[s.requiredLevel]<=levelRank[person.assignedLevel]);
  const latest=new Map();
  state.results.filter(r=>r.employeeNumber===person.employeeNumber&&r.recordStatus==='Current').forEach(r=>latest.set(r.subtaskId,r));
  let go=0,noGo=0,assist=0,criticalFail=0;
  applicable.forEach(s=>{
    const r=latest.get(s.id);
    if(r?.result==='GO')go++;
    if(r?.result==='NO-GO'){noGo++;if(s.criticality==='Critical Gate')criticalFail++}
    if(r?.result==='REQUIRES ASSISTANCE')assist++;
  });
  const pct=applicable.length?Math.round(go/applicable.length*100):0;
  return {applicable:applicable.length,go,noGo,assist,criticalFail,pct};
}
function buildInsights(){
  return personScope().filter(p=>p.name&&p.status!=='Inactive').map(p=>{
    const q=qualificationSnapshot(p);
    const open=state.actions.filter(a=>a.employeeNumber===p.employeeNumber&&a.status!=='Closed').length;
    let risk='Low',recommendation='Continue scheduled training and reassessment.';
    if(q.criticalFail>0){risk='Critical';recommendation='Block independent performance and prioritize Critical Gate reassessment.'}
    else if(open>0||q.noGo>0){risk='High';recommendation='Complete corrective actions and targeted retraining before qualification approval.'}
    else if(q.pct<70){risk='Developing';recommendation='Increase coached repetitions on incomplete subtasks.'}
    else if(q.pct>=90){risk='Ready';recommendation='Review remaining evidence and consider qualification-level advancement.'}
    return {...p,...q,open,risk,recommendation};
  }).sort((a,b)=>({Critical:5,High:4,Developing:3,Ready:2,Low:1}[b.risk]-({Critical:5,High:4,Developing:3,Ready:2,Low:1}[a.risk])));
}
function insights(){
  const rows=buildInsights();
  const cards=rows.map(x=>`<div class="card insight-card">
    <div class="page-head"><div><h3>${esc(x.name)}</h3><p>${x.shift} Shift · ${x.role} · Assigned ${x.assignedLevel}</p></div><span class="pill risk-${x.risk.toLowerCase()}">${x.risk}</span></div>
    <div class="progress"><span style="width:${x.pct}%"></span></div>
    <p><b>${x.pct}%</b> of applicable subtasks currently GO · ${x.open} open actions · ${x.criticalFail} critical failures</p>
    <p class="ai-recommendation"><b>Recommended next action:</b> ${esc(x.recommendation)}</p>
  </div>`).join('');
  page('AI Readiness','Explainable recommendations generated from assessment and corrective-action records',`
    <div class="card ai-banner"><h3>AI-ready architecture</h3>
    <p>This version uses a transparent rules engine. A secured corporate AI service can later analyze the same normalized records without changing the user interface or historical data model.</p></div>
    <div class="grid">${cards||'<div class="card">No personnel records available.</div>'}</div>`,
    '<button class="secondary" id="exportInsights">Export insights CSV</button>');
  $('#exportInsights').onclick=()=>exportInsightsCsv(rows);
}
function exportInsightsCsv(rows=buildInsights()){
  const headers=['Employee Number','Name','Shift','Role','Assigned Level','Applicable Subtasks','GO','NO-GO','Requires Assistance','Critical Failures','Open Actions','Readiness Percent','Risk','Recommendation'];
  const vals=rows.map(x=>[x.employeeNumber,x.name,x.shift,x.role,x.assignedLevel,x.applicable,x.go,x.noGo,x.assist,x.criticalFail,x.open,x.pct,x.risk,x.recommendation]);
  const csv=[headers,...vals].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
  download(csv,'K1_METL_AI_Readiness.csv','text/csv');
}
function exportAssessmentCsv(){
  const headers=['Session ID','Employee Number','Associate','Shift','Task ID','Task Name','Date','Evaluator','Method','Location','Final Status'];
  const vals=state.sessions.map(s=>[s.id,s.employeeNumber,s.associateName,s.shift,s.taskId,s.taskName,s.date,s.evaluatorName,s.method,s.location,s.finalStatus]);
  const csv=[headers,...vals].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
  download(csv,'K1_METL_Assessment_Sessions.csv','text/csv');
}

function settings(){
  page('Data, Backup & Integration','Administrative controls for portability, recovery, and future secured integrations.',`
  <div class="grid two">
    <div class="card"><h3>System data</h3>
      <p>${state.personnel.length} personnel · ${state.evaluators.length} evaluators · ${state.tasks.length} task records · ${state.subtasks.length} subtasks</p>
      <button class="secondary" id="exportJson">Export encrypted-ready JSON</button>
      <button class="secondary" id="exportSessions">Export assessment CSV</button>
      <button class="secondary" id="exportAI">Export AI readiness CSV</button>
    </div>
    <div class="card"><h3>Restore / migrate</h3>
      <p>Import a previously exported JSON backup. Existing local records will be replaced after validation.</p>
      <input id="importFile" type="file" accept=".json,application/json">
      <button class="secondary" id="importJson">Import backup</button>
    </div>
    <div class="card"><h3>AI integration contract</h3>
      <p>Normalized entities are ready for a secured API: personnel, tasks, subtasks, assessment sessions, results, actions, evaluator authority, and audit events.</p>
      <p class="muted">No employee data is sent anywhere in this local version.</p>
    </div>
    <div class="card"><h3>Reset local application</h3>
      <p>Removes local changes and restores the embedded workbook baseline.</p>
      <button class="danger" id="resetData">Reset local data</button>
    </div>
  </div>`);
  $('#exportJson').onclick=()=>download(JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2),'K1_METL_Backup.json','application/json');
  $('#exportSessions').onclick=exportAssessmentCsv;
  $('#exportAI').onclick=()=>exportInsightsCsv();
  $('#importJson').onclick=async()=>{
    const f=$('#importFile').files[0]; if(!f)return toast('Choose a JSON backup first');
    try{
      const imported=JSON.parse(await f.text());
      for(const key of ['personnel','tasks','subtasks','sessions','results','actions','audit'])if(!Array.isArray(imported[key]))throw new Error(`Missing ${key}`);
      state=imported;normalizeState();save();audit('IMPORT','System','Backup','Validated JSON backup imported');toast('Backup imported');dashboard();
    }catch(e){toast('Import failed: '+e.message)}
  };
  $('#resetData').onclick=()=>{
    if(!confirm('Reset all local changes?'))return;
    state=cloneData(window.METL_BASELINE)||emptyState();normalizeState();save();toast('Baseline restored');dashboard();
  };
}
function download(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function modal(html){document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modal-card">${html}</div></div>`);$$('.close').forEach(b=>b.onclick=closeModal)}function closeModal(){$('.modal')?.remove()}
init();

window.addEventListener('error',e=>{console.error(e.error||e.message);const s=document.querySelector('#startupStatus');if(s&&!document.querySelector('#login').classList.contains('hidden')){s.textContent='Error: '+e.message;s.classList.add('error')}});
