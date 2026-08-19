/* Mundos Sombrios — Portal Oficial / Conteúdo V0.61.3
   Fonte única de conteúdo público administrável pelo ADM.
*/
(function () {
  'use strict';

  const KEY = 'portal-official';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = Date.now();

  const defaults = {
    hero: {
      eyebrow: 'PORTAL OFICIAL',
      title: 'Mundos Sombrios',
      subtitle: 'Dois mundos. Dois abismos. Uma história que não deveria ter sido aberta.',
      description: 'Conheça o cenário, acompanhe as novidades, descubra classes e expansões e entre no sistema de criação de fichas quando estiver pronto.',
      primaryLabel: 'ENTRAR NO JOGO'
    },
    featured: {
      title: 'A Ordem dos Sete Arcanjos',
      subtitle: 'Nova expansão em destaque',
      description: 'Novos registros, caminhos e ameaças chegam ao acervo oficial.',
      category: 'Expansão',
      world: 'Ocultatun',
      status: 'featured'
    },
    announcements: [
      { id: 'ann-1', title: 'Portal Oficial Mundos Sombrios', date: '2026-08-16', category: 'Comunicado', summary: 'O portal do cenário agora reúne notícias, eventos, classes, expansões, Códices e acesso às ferramentas de jogo.', published: true },
      { id: 'ann-2', title: 'Mesa dos Mestres', date: '2026-08-16', category: 'Atualização', summary: 'Nova central para mesas, ferramentas privadas, NPCs, arquivos e o Escudo do Mestre.', published: true }
    ],
    events: [
      { id: 'evt-1', title: 'A Noite do Envolto', date: '2026-08-28T21:00', world: 'Ocultatun', description: 'Sessão especial focada nas anomalias e nos ritos do Envolto.', published: true },
      { id: 'evt-2', title: 'Primeiro Contato', date: '2026-09-05T20:00', world: 'Êxodo', description: 'Evento de apresentação para novas mesas de Êxodo: Assimilação.', published: true }
    ],
    classes: [
      { id: 'cls-1', title: 'Esotérico', subtitle: 'O Cientista do Abismo', world: 'Ocultatun', description: 'Enxertos, cirurgia paranormal e covis. Transforme o impossível em ferramenta.', status: 'Destaque' },
      { id: 'cls-2', title: 'Alquerino', subtitle: 'O Laboratório do Impossível', world: 'Ocultatun', description: 'Caminhos, ingredientes e síntese alquímica em um laboratório vivo.', status: 'Destaque' },
      { id: 'cls-3', title: 'Mercador da Morte', subtitle: 'O Arsenal em Movimento', world: 'Êxodo', description: 'Bioenergia, força-tarefa, arsenal e operações sob pressão.', status: 'Destaque' },
      { id: 'cls-4', title: 'Hermético', subtitle: 'O Códice Vivo', world: 'Ocultatun', description: 'Rituais, símbolos e conhecimento selado.', status: 'Destaque' }
    ],
    community: [
      { id: 'com-1', title: 'Campanha em destaque — Ecos do Abismo', kind: 'Campanha', description: 'Uma mesa da comunidade atravessa os registros do Envolto e transforma o Códice em história.', date: '2026-08-16', published: true },
      { id: 'com-2', title: 'Arquivo da Comunidade — Primeiros relatos', kind: 'Destaque', description: 'Espaço reservado para fan art, relatos de campanha e criações aprovadas.', date: '2026-08-16', published: true }
    ],
    expansions: [
      { id: 'exp-1', title: 'A Corrupção Antológica — O Envolto', world: 'Ocultatun', description: 'Uma camada de horror cósmico, cânticos, rituais e a árvore de habilidades do Envolto.', date: '2026-08-16', status: 'Disponível' },
      { id: 'exp-2', title: 'A Ordem dos Sete Arcanjos', world: 'Ocultatun', description: 'Uma expansão dedicada aos registros da Ordem e seus caminhos.', date: '2026-08-16', status: 'Disponível' },
      { id: 'exp-3', title: 'Projeto Player', world: 'Êxodo', description: 'Aprimore a experiência de personagens e evolução.', date: '2026-08-16', status: 'Disponível' }
    ],
    stories: [
      { id: 'story-1', title: 'O Primeiro Eco', subtitle: 'Conto oficial', world: 'Ocultatun', description: 'Um registro encontrado entre as páginas seladas descreve o primeiro sinal de que algo estava respondendo do outro lado.', body: 'Naquela noite, o arquivo respondeu antes que alguém tocasse a página. O som veio de dentro do lacre, como uma respiração presa havia séculos. Quando o selo se partiu, nenhuma voz foi ouvida — apenas o eco de algo que já conhecia os nomes dos presentes.', date: '2026-08-16', kind: 'Conto', published: true },
      { id: 'story-2', title: 'Registro 07 — Atravessar', subtitle: 'História de Êxodo', world: 'Êxodo', description: 'Um fragmento de relatório narra o momento em que uma equipe percebe que o caminho de volta deixou de existir.', body: 'O marcador de retorno desapareceu do visor às 03:17. O operador tentou recalibrar o protocolo, mas a própria sala passou a responder com coordenadas que não pertenciam ao mapa. Às 03:21, a equipe recebeu uma última instrução: não olhar para trás.', date: '2026-08-16', kind: 'História', published: true }
    ],
    worlds: [
      { id: 'world-1', key: 'exodo', title: 'Êxodo: Assimilação', eyebrow: 'SALA DE REGISTROS SECRETOS', description: 'Um mundo de protocolos, assimilação e sobrevivência entre registros que deveriam permanecer fechados.', accent: 'tech' },
      { id: 'world-2', key: 'ocultatun', title: 'Ocultatun Ecos', eyebrow: 'BIBLIOTECA DOS SELOS', description: 'Um mundo de rituais, anomalias, símbolos e ecos que atravessam o conhecimento proibido.', accent: 'arcane' }
    ],
    portalVersion: 'V0.61.3'
  };

  let current = JSON.parse(JSON.stringify(defaults));

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function merge(base, extra) {
    const out = { ...base, ...(extra || {}) };
    ['announcements', 'events', 'classes', 'expansions', 'community', 'stories', 'worlds'].forEach((k) => {
      out[k] = Array.isArray(extra?.[k]) ? extra[k] : clone(base[k]);
    });
    out.hero = { ...base.hero, ...(extra?.hero || {}) };
    out.featured = { ...base.featured, ...(extra?.featured || {}) };
    return out;
  }

  function hydrateFromSupabase() {
    if (!window.MS_DB || !window.MS_DB.ready) return current;

    window.MS_DB.fetchSiteContent(KEY)
      .then((remote) => {
        if (remote && typeof remote === 'object') {
          current = merge(defaults, remote);
        }
      })
      .catch(() => {
        current = clone(defaults);
      });

    return current;
  }

  function read() {
    return clone(current);
  }

  async function write(data) {
    const next = merge(defaults, data || {});
    current = next;

    if (window.MS_DB && window.MS_DB.ready) {
      try {
        await window.MS_DB.saveSiteContent(next, KEY);
        return true;
      } catch (error) {
        console.warn('[Mundos Sombrios] Falha ao salvar conteúdo em Supabase:', error);
        return false;
      }
    }

    return true;
  }

  function isAdmin() {
    try {
      return !!(window.currentUser && window.currentUser.role === 'admin');
    } catch (_error) {
      return false;
    }
  }

  function published(list) {
    return (Array.isArray(list) ? list : []).filter((x) => x && x.published !== false);
  }

  hydrateFromSupabase();

  window.PortalContent = {
    KEY,
    defaults,
    read,
    write,
    isAdmin,
    published,
    escapeHtml: esc,
    now,
    hydrate: hydrateFromSupabase
  };
})();