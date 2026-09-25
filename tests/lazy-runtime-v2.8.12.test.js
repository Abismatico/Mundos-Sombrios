import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
for (const file of ['js/progression-v2.8.9.js','js/offline-sandbox-ui.js','js/exodo-nexo.js','js/mundos-updates.js','js/ordem-sete.js','js/power-registry.js','js/dice-3d.js']) {
  test(`${file} inicializa também quando carregado depois do DOMContentLoaded`,()=>{
    const s=read(file);
    assert.match(s,/document\.readyState\s*===?\s*['"]loading['"]/);
    assert.match(s,/else\s+[A-Za-z_$][\w$]*\s*\(/);
  });
}
test('progressão V2.8.9 inicializa de forma idempotente',()=>{
  const s=read('js/progression-v2.8.9.js');
  assert.match(s,/let initialized\s*=\s*false/);
  assert.match(s,/if \(initialized\) return/);
});
test('loader do sandbox injeta UI imediatamente e a UI possui boot tardio seguro',()=>{
  assert.match(read('js/offline-sandbox-ui-loader.js'),/\n\s*boot\(\);/);
  const s=read('js/offline-sandbox-ui.js');
  assert.match(s,/const boot = async/);
  assert.match(s,/else boot\(\)/);
});
