import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('loader offline não usa document.write com defer',()=>{
  const loader=read('js/offline-db-loader.js');
  assert.doesNotMatch(loader,/document\.write\s*\(/);
  assert.match(loader,/MS_OFFLINE_DB_READY/);
});

test('bootstrap de autenticação aguarda banco',()=>{
  assert.match(read('js/supabase-db.js'),/MS_DB_READY\s*=\s*\(async function/);
  assert.match(read('js/script.js'),/if \(window\.MS_DB_READY\) await window\.MS_DB_READY/);
});

test('lançadores apontam para distribuições locais corretas e sobem servidor antes do navegador',()=>{
  const offline=read('INICIAR-SITE-OFFLINE.bat');
  const sandbox=read('INICIAR-SANDBOX.bat');
  assert.match(offline,/offline-local\//);
  assert.match(sandbox,/sandbox-offline\//);
  assert.match(offline,/PORT=8765/);
  assert.match(sandbox,/PORT=8766/);
  assert.ok(offline.indexOf('http.server %PORT%') < offline.indexOf('start \"\" \"%URL%\"'));
  assert.ok(sandbox.indexOf('http.server %PORT%') < sandbox.indexOf('start \"\" \"%URL%\"'));
});

test('publicação mantém Offline e protege SANDBOX por marcador',()=>{
  const build=read('scripts/build-site.mjs');
  assert.match(build,/offline-local/);
  assert.match(build,/PUBLISH-SANDBOX/);
  assert.match(build,/sandbox-offline/);
});
