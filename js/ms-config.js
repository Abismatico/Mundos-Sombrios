/* Mundos Sombrios — Runtime Configuration v2.7
 * Centraliza o endpoint público do Supabase. Nunca inclua service_role/secret aqui.
 */
(function(){
  'use strict';
  const legacy={
    url:'https://xhcunksjrksdzdtabfxt.supabase.co',
    anonKey:'sb_publishable_Yq3SDfQEaX_vxdZKvADyMQ_evvVDqdi',
    environment:'production'
  };
  const supplied=window.MS_RUNTIME_CONFIG?.supabase||window.MS_DB_CONFIG||{};
  const url=String(supplied.url||legacy.url).replace(/\/$/,'');
  const anonKey=String(supplied.publishableKey||supplied.anonKey||legacy.anonKey);
  const match=url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/i);
  const config=Object.freeze({url,anonKey,projectRef:match?.[1]||'unknown',environment:String(supplied.environment||legacy.environment)});
  window.MS_CONFIG=Object.freeze({version:'2.8.1',supabase:config});
  window.MS_DB_CONFIG=config;
  window.dispatchEvent(new CustomEvent('ms:config-ready',{detail:{version:'2.8.1',projectRef:config.projectRef,environment:config.environment}}));
})();
