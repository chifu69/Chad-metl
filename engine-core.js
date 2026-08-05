/* RP IA Engine Core v6.0 — local-first, server-ready */
(function(){
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const now=()=>new Date().toISOString();

  window.RPIAEngines={version:'6.0.0'};

  window.SearchEngine={
    normalize:norm,
    personHaystack:p=>norm([p.employeeNumber,p.name,p.shift,p.role,p.assignedLevel,p.approvedLevel,p.status,p.qualifiedLines].join(' ')),
    matchPerson:(p,query)=>!norm(query)||window.SearchEngine.personHaystack(p).includes(norm(query)),
    searchAll:(s,query)=>{
      const q=norm(query); if(!q)return[];
      const out=[];
      (s.personnel||[]).forEach(x=>{if(window.SearchEngine.personHaystack(x).includes(q))out.push({type:'person',id:x.employeeNumber,title:x.name,meta:`#${x.employeeNumber} · ${x.shift} · ${x.role}`})});
      (s.tasks||[]).forEach(x=>{if(norm(`${x.id} ${x.name} ${x.description} ${x.domain}`).includes(q))out.push({type:'task',id:x.id,title:`${x.id} — ${x.name}`,meta:x.domain||'METL Task'})});
      (s.subtasks||[]).forEach(x=>{if(norm(`${x.id} ${x.name} ${x.standard} ${x.taskId}`).includes(q))out.push({type:'subtask',id:x.id,title:`${x.id} — ${x.name}`,meta:`Parent ${x.taskId} · ${x.requiredLevel||''}`})});
      (s.actions||[]).forEach(x=>{if(norm(`${x.id} ${x.employee} ${x.employeeNumber} ${x.taskId} ${x.subtaskId} ${x.status}`).includes(q))out.push({type:'action',id:x.id,title:`Corrective action — ${x.employee||x.employeeNumber}`,meta:`${x.taskId}/${x.subtaskId} · ${x.status}`})});
      (s.knowledge||[]).forEach(x=>{if(norm(`${x.title} ${x.summary} ${(x.tags||[]).join(' ')} ${x.content}`).includes(q))out.push({type:'knowledge',id:x.id,title:x.title,meta:x.category||'Knowledge'})});
      return out.slice(0,100);
    }
  };

  window.AuditEngine={
    ensure:s=>{s.audit=s.audit||[];return s.audit},
    record:(s,user,action,entity,id,detail,before=null,after=null)=>{
      const rec={time:now(),user:user?.name||user?.username||'System',action,entity,id:String(id||''),detail,before,after};
      window.AuditEngine.ensure(s).unshift(rec); return rec;
    },
    history:(s,entity,id)=>window.AuditEngine.ensure(s).filter(x=>(!entity||x.entity===entity)&&(!id||String(x.id)===String(id)))
  };

  window.RulesEngine={
    levelRank:{'-10':10,'-20':20,'-30':30,'-40':40},
    evaluatorCan:(user,level)=>user?.role==='admin'||(user?.role==='evaluator'&&(window.RulesEngine.levelRank[user.maxLevel||'-10']||0)>=(window.RulesEngine.levelRank[level||'-10']||0)),
    canManageMETL:user=>user?.role==='admin'||!!user?.manageMetl,
    canManagePersonnel:user=>user?.role==='admin'||!!user?.managePersonnel,
    canLogin:person=>!person||person.status==='Active',
    qualificationDecision:({result,criticalGate,evidencePresent,srLeadRequired,srLeadVerified})=>{
      const blockers=[];
      if(result!=='GO')blockers.push('Assessment result is not GO');
      if(criticalGate&&result!=='GO')blockers.push('Critical Gate failed');
      if(!evidencePresent)blockers.push('Required evidence is missing');
      if(srLeadRequired&&!srLeadVerified)blockers.push('Sr. Lead verification is required');
      return{qualified:blockers.length===0,blockers};
    },
    validateState:s=>{
      const issues=[]; const seen=new Set();
      (s.personnel||[]).filter(p=>p.employeeNumber).forEach(p=>{const n=String(p.employeeNumber);if(seen.has(n))issues.push({severity:'high',type:'duplicate_employee',message:`Duplicate employee number ${n}`});seen.add(n)});
      const taskIds=new Set((s.tasks||[]).map(x=>x.id));
      (s.subtasks||[]).forEach(x=>{if(!taskIds.has(x.taskId))issues.push({severity:'high',type:'orphan_subtask',message:`${x.id} has no valid parent task`});if(!x.standard)issues.push({severity:'medium',type:'missing_standard',message:`${x.id} has no performance standard`})});
      return issues;
    }
  };

  window.WorkflowEngine={
    ensure:s=>{s.workflows=s.workflows||[];return s.workflows},
    create:(s,type,payload,user)=>{const w={id:`WF-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,type,status:'Open',createdAt:now(),createdBy:user?.name||'System',steps:[],payload};window.WorkflowEngine.ensure(s).unshift(w);return w},
    fromAssessment:(s,assessment,user,settings={})=>{
      if(!assessment||!['NO-GO','REQUIRES ASSISTANCE'].includes(assessment.result))return null;
      const days=Number(settings.defaultCorrectiveActionDays||14); const d=new Date();d.setDate(d.getDate()+days);
      const action={id:`CA-${Date.now()}`,employeeNumber:assessment.employeeNumber,employee:assessment.employee||assessment.employeeName||'',shift:assessment.shift||'',taskId:assessment.taskId||'',subtaskId:assessment.subtaskId||'',status:'Open',targetDate:d.toISOString().slice(0,10),reason:assessment.result,createdAt:now(),sourceAssessmentId:assessment.id||''};
      s.actions=s.actions||[];s.actions.unshift(action);
      return window.WorkflowEngine.create(s,'Corrective Action & Reassessment',{actionId:action.id,assessmentId:assessment.id||'',employeeNumber:assessment.employeeNumber},user);
    },
    advance:(s,id,step,user)=>{const w=window.WorkflowEngine.ensure(s).find(x=>x.id===id);if(!w)return null;w.steps.push({time:now(),step,user:user?.name||'System'});return w}
  };

  window.KnowledgeEngine={
    ensure:s=>{s.knowledge=s.knowledge||[];return s.knowledge},
    add:(s,article,user)=>{const a={id:article.id||`KB-${Date.now()}`,title:article.title||'Untitled',category:article.category||'Procedure',summary:article.summary||'',content:article.content||'',tags:article.tags||[],taskIds:article.taskIds||[],subtaskIds:article.subtaskIds||[],status:article.status||'Draft',version:article.version||'1.0',owner:article.owner||user?.name||'',reviewDate:article.reviewDate||'',updatedAt:now()};window.KnowledgeEngine.ensure(s).unshift(a);return a},
    search:(s,q)=>window.SearchEngine.searchAll(s,q).filter(x=>x.type==='knowledge'),
    answer:(s,q)=>{const hits=window.KnowledgeEngine.search(s,q);if(!hits.length)return{found:false,text:'No approved knowledge article matches this question. Use the official procedure or ask an authorized Sr. Lead.'};const a=(s.knowledge||[]).find(x=>x.id===hits[0].id);if(a.status!=='Approved')return{found:false,text:`A related article exists (${a.title}), but it is not approved for operational use.`};return{found:true,article:a,text:a.summary||a.content.slice(0,500)}}
  };

  window.PredictiveEngine={
    readinessRisk:(s,metricsFn)=>{
      const rows=(s.personnel||[]).filter(p=>p.employeeNumber&&p.status==='Active').map(p=>{const m=metricsFn(p);let score=0;score+=(100-(m.pct||0))*.45;score+=(m.open||0)*8;score+=(m.critical||0)*20;return{employeeNumber:p.employeeNumber,name:p.name,shift:p.shift,risk:Math.min(100,Math.round(score)),readiness:m.pct||0,open:m.open||0,critical:m.critical||0}});return rows.sort((a,b)=>b.risk-a.risk)
    },
    shiftTrend:(s,metricsFn)=>['A','B','C','D'].map(shift=>{const p=(s.personnel||[]).filter(x=>x.status==='Active'&&x.employeeNumber&&x.shift===shift);const avg=p.length?Math.round(p.reduce((a,x)=>a+(metricsFn(x).pct||0),0)/p.length):0;return{shift,readiness:avg,count:p.length}}),
    confidence:s=>{const evaluated=new Set((s.results||[]).map(x=>`${x.employeeNumber}|${x.subtaskId}`)).size;const possible=Math.max(1,(s.personnel||[]).filter(x=>x.status==='Active'&&x.employeeNumber).length*Math.max(1,(s.subtasks||[]).filter(x=>x.status==='Active').length));return Math.min(100,Math.round(evaluated/possible*100))}
  };

  window.RPBrainEngine={
    recommend:(s,user,metricsFn)=>{const risks=window.PredictiveEngine.readinessRisk(s,metricsFn).slice(0,5);const issues=window.RulesEngine.validateState(s);const overdue=(s.actions||[]).filter(a=>a.status!=='Closed'&&a.targetDate&&a.targetDate<new Date().toISOString().slice(0,10));return{headline:overdue.length?`${overdue.length} overdue corrective action${overdue.length===1?'':'s'} require attention`:risks[0]?`${risks[0].name} has the highest current development priority`:'No urgent development risk detected',priorities:risks,systemIssues:issues.slice(0,5),overdue:overdue.slice(0,5),generatedAt:now(),user:user?.name||''}},
    ask:(s,q,metricsFn)=>{const k=window.KnowledgeEngine.answer(s,q);if(k.found)return{type:'knowledge',text:k.text,article:k.article};const hits=window.SearchEngine.searchAll(s,q);if(hits.length)return{type:'search',text:`I found ${hits.length} matching record${hits.length===1?'':'s'}.`,results:hits.slice(0,10)};const r=window.RPBrainEngine.recommend(s,null,metricsFn);return{type:'recommendation',text:r.headline,results:r.priorities}}
  };
})();
