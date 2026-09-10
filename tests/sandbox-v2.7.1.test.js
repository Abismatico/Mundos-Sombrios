import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('Sandbox HTML bloqueia Supabase remoto e usa runtime local',()=>{
  const html=read('test/sandbox.html');
  assert.match(html,/test\/sandbox-runtime\.js/);
  assert.doesNotMatch(html,/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/);
  assert.doesNotMatch(html,/src="js\/supabase-db\.js"/);
  assert.doesNotMatch(html,/src="js\/ms-config\.js"/);
});

test('Sandbox oferece quatro contas e realtime entre abas',()=>{
  const js=read('test/sandbox-runtime.js');
  for(const token of ["username:'admin'","username:'mestre'","username:'jogador'","username:'jogador2'"]) assert.match(js,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(js,/BroadcastChannel/);
  assert.match(js,/sessionStorage/);
  assert.match(js,/localStorage/);
  assert.match(js,/publishTableEvent/);
  assert.match(js,/subscribeTable/);
});

test('Build de produção não publica o diretório test',()=>{
  const build=read('scripts/build-site.mjs');
  assert.doesNotMatch(build,/['"]test['"]/);
  assert.match(build,/SQL, testes e auditorias ficam fora da publicação/);
});

test('Runtime Sandbox autentica ADM e persiste evento de mesa sem rede',async()=>{
  const vm=await import('node:vm');
  const cryptoMod=await import('node:crypto');
  const store=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};};
  class FakeChannel{addEventListener(_,fn){this.fn=fn;}postMessage(){}close(){}}
  class FakeEvent{constructor(type,opts={}){this.type=type;this.detail=opts.detail;}}
  const listeners={};
  const window={addEventListener:(n,f)=>{(listeners[n]??=[]).push(f)},dispatchEvent:()=>true};
  const context={window,localStorage:store(),sessionStorage:store(),BroadcastChannel:FakeChannel,CustomEvent:FakeEvent,console,crypto:{randomUUID:()=>cryptoMod.randomUUID()},Date,Math,setInterval,clearInterval,setTimeout,clearTimeout,location:{reload(){}}};
  vm.createContext(context);vm.runInContext(read('test/sandbox-runtime.js'),context);
  const db=context.window.MS_DB;
  let login=await db.signIn('admin','admin');assert.equal(login.error,null);
  const me=await db.fetchMyProfile();assert.equal(me.data.role,'admin');assert.equal(me.data.username,'admin');
  const summaries=await db.fetchMyTableSummaries();assert.ok(summaries.data.some(t=>t.code==='TST001'));
  const sent=await db.publishTableEvent('table-demo-001','chat',{sender:'Arconte Zero',msg:'Teste automatizado'},{clientEventId:'00000000-0000-4000-8000-000000000099'});assert.equal(sent.error,null);assert.equal(sent.data.event_type,'chat');
  const history=await db.fetchTableEventsAfter('table-demo-001',3,50);assert.equal(history.error,null);assert.equal(history.data.length,1);assert.equal(history.data[0].payload.msg,'Teste automatizado');
});
