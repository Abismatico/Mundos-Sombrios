/* Mundos Sombrios — Runtime Configuration v2.8.1-PRO
 * Centraliza o endpoint público do Supabase e gerencia conexões Realtime de Mesas.
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
  
  // --- INICIALIZAÇÃO SEGURA DO CLIENTE SUPABASE ---
  let clientInstance = null;
  if (typeof supabase !== 'undefined') {
      clientInstance = supabase.createClient(url, anonKey);
  }

  // Variável para rastrear o canal em tempo real ativo e evitar duplicidade
  let activeMesaChannel = null;

  // --- GERENCIADOR DE TEMPO REAL (CORREÇÃO ONLINE/OFFLINE) ---
  const realtimeManager = {
    // Retorna a instância do cliente Supabase
    getClient: () => {
        if (!clientInstance && typeof supabase !== 'undefined') {
            clientInstance = supabase.createClient(url, anonKey);
        }
        return clientInstance;
    },

    // Função central que conecta na mesa e limpa conexões fantasmas antigas
    conectarMesa: async function(tableId, currentUser, onPlayersUpdate = null) {
        if (!tableId || !currentUser?.id) return;
        const client = this.getClient();
        if (!client) return console.error("Supabase Client não carregado.");

        // [CORREÇÃO]: Se o usuário já estava em uma mesa antes, desconecta primeiro
        if (activeMesaChannel) {
            await this.desconectarMesa();
        }

        // Inicializa o novo canal usando Presence do Supabase
        activeMesaChannel = client.channel(`room_${tableId}`, {
            config: { presence: { key: currentUser.id } }
        });

        activeMesaChannel
            // Monitora quem entra e quem sai da mesa ao vivo
            .on('presence', { event: 'sync' }, () => {
                const state = activeMesaChannel.presenceState();
                if (onPlayersUpdate && typeof onPlayersUpdate === 'function') {
                    onPlayersUpdate(state);
                }
            })
            // Escuta modificações nas fichas/estado do jogo ao vivo
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'table_state',
                filter: `table_id=eq.${tableId}` 
            }, payload => {
                if (typeof window.atualizarFichaNaTela === 'function') {
                    window.atualizarFichaNaTela(payload.new);
                }
            })
            // Confirma a entrada na sala e injeta o status ONLINE
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await activeMesaChannel.track({
                        user_name: currentUser.name || "Jogador",
                        online_at: new Date().toISOString(),
                        is_master: currentUser.is_master || false
                    });
                }
            });
    },

    // [CORREÇÃO]: Desconecta e destrói o canal antigo impedindo o travamento em "offline"
    desconectarMesa: async function() {
        if (activeMesaChannel) {
            try {
                await activeMesaChannel.unsubscribe();
                const client = this.getClient();
                if (client) await client.removeChannel(activeMesaChannel);
                activeMesaChannel = null;
                console.log("Mundios Sombrios: Conexão antiga limpa. Status redefinido.");
            } catch (e) {
                console.error("Erro ao limpar canal:", e);
            }
        }
    }
  };

  // Mantém as configurações originais do seu site intactas
  window.MS_CONFIG=Object.freeze({version:'2.8.1',supabase:config});
  window.MS_DB_CONFIG=config;
  
  // Injeta o novo controlador de Realtime globalmente para o seu projeto usar
  window.MS_REALTIME = realtimeManager;

  window.dispatchEvent(new CustomEvent('ms:config-ready',{detail:{version:'2.8.1',projectRef:config.projectRef,environment:config.environment}}));
})();
