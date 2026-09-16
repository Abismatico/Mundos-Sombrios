import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('site principal não carrega runtime offline nem fallback local', () => {
  const index = read('index.html');
  assert.doesNotMatch(index, /offline-db-loader\.js/i);
  assert.doesNotMatch(index, /offline-sandbox-ui-loader\.js/i);
  assert.doesNotMatch(index, /offline-login-hint/i);

  const db = read('js/supabase-db.js');
  assert.doesNotMatch(db, /MS_OFFLINE_DB\?\.create/i);
  assert.doesNotMatch(db, /Modo offline local ativado/i);
});
