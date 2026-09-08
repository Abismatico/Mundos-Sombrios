# Mundos Sombrios — Arquitetura Atual (2.5.3)

## Fonte de verdade
Supabase Auth + PostgreSQL + RLS + RPC + Realtime.

## Camadas
`UI → Services → Supabase DB → RLS/RPC/Realtime`

### Core
- `js/ms-platform.js`: eventos, estados, validação, recursos, exportação e feedback.
- `js/ms-services.js`: serviços de domínio (`Auth`, `Profile`, `Characters`, `Games`, `VTT`, `Content`, `Soul`).
- `js/supabase-db.js`: único adaptador de transporte para Supabase.


### Experiência / apresentação
- `js/immersive-experience.js`: camada de UX e direção de arte; não é fonte de regra nem persistência de jogo.
- `css/immersive-experience.css`: identidades visuais de Êxodo, Ocultatun, Envolto e Ordem, níveis Funcional/Imersivo/Cinemático e estados de consequência.
- `css/portal/portal-editorial-v2.2.css`: camada final do Portal Oficial, responsável por hierarquia editorial, densidade, limites de leitura e responsividade da home/subpáginas.
- `js/portal/portal-core.js`: shell persistente do Portal, navegação, composição da home e rotas editoriais; não é fonte de regras de jogo.
- Preferências de interface podem usar `localStorage`, mas nunca fichas, credenciais, mesas, regras ou conteúdo canônico.

### Dados canônicos
- `profiles`: identidade e papel.
- `characters`: ficha atual do jogador.
- `character_versions`: histórico da ficha.
- `tables`: Mesa/Fenda canônica.
- `table_members`: participantes e vínculo com personagem.
- `table_state`: estado estrutural do VTT, controlado pelo Mestre.
- `table_events`: chat, dados e eventos transitórios persistíveis.
- `table_invites`: convites temporários.
- `campaigns` e `game_sessions`: camada de campanha/sessão.
- `gm_notes`, `gm_npcs`, `gm_files`: ferramentas privadas da mesa.

### Imortalização de ficha
- Nos modos **Êxodo** e **Ocultatun**, os únicos pré-requisitos editoriais para persistir uma ficha são **Nome + Expansão/Origem + Classe**.
- Atributos, conceito, perícias, poderes, equipamento, retrato e demais campos são progressivos/opcionais e nunca bloqueiam a imortalização.
- Slots de conta e acesso à expansão continuam sendo autorização econômica separada, validada server-side.

### Regra de ouro
Nenhum componente deve criar uma segunda fonte de persistência. `localStorage`/`sessionStorage` não são banco. O estado local é somente de interface/sessão.

### Permissões
A UI pode ocultar ações, mas a autorização real deve existir em RLS/RPC. Jogadores só alteram suas próprias fichas; Mestres administram apenas suas mesas; membros recebem apenas os dados da mesa aos quais têm acesso.

### Realtime
`table_events` transmite eventos de mesa; `table_state` sincroniza o estado estrutural do Mestre.

### Migração
Funcionalidades legadas podem continuar usando wrappers compatíveis, mas a nova implementação deve entrar por `MS_SERVICES`. Remoções de adapters só acontecem depois da auditoria de dependências.


## Centro de Comando do Mestre V2.3
A Sala dos Mestres passa a operar em Campanha -> Sessão -> Cena -> Consequência. `master-command-center.js` adiciona fases de preparação/sessão/pós-sessão, storyboard de cenas, facções, relações, busca universal, visão do jogador, cronologia automática e integração dos Registros Históricos. O Cofre permanece como camada de detalhe e `table_state` continua sendo a persistência estrutural da mesa.

A migração `supabase-master-v2.3-migration.sql` adiciona papéis operacionais `co_mestre` e `observador` sem elevar permissões de perfil global.


## Performance e experiência do Mestre V2.4
- O modal de criação de mesa usa viewport limitado, cabeçalho/rodapé fixos e rolagem apenas no corpo.
- Campanha em Movimento é contextual à mesa selecionada, e não uma janela global da Ancoragem.
- D4, D6, D8, D10, D12 e D20 têm malhas 3D próprias em Canvas 2D e animação sincronizada em rolagens locais/remotas.
- Fabric.js e html2pdf são carregados apenas quando VTT/PDF são solicitados.
- A camada pesada da Forja (JS e CSS) é carregada sob demanda preservando a ordem histórica de módulos.
- O boot local de JavaScript caiu de 1.619.672 para 629.802 bytes (~61%).
- Partículas deixam de criar/remover DOM em loop e o polling permanente da Forja foi removido.


## Soul Economy V2.5
- `js/soul-economy.js` apresenta Orbe SoulDrakma, Colheita, Cofre, conquistas e console ADM; não é fonte de verdade econômica.
- `css/soul-economy.css` concentra a direção de arte e animações 3D da economia.
- `supabase-soul-economy-v2.5-migration.sql` cria Wallet, Ledger, catálogo, entitlements, Colheitas, conquistas e guardas server-side de criação.
- `soul_catalog` é a fonte canônica dos preços; o catálogo no frontend é somente fallback de apresentação.
- Jogador: 3 fichas, 0 mesas e expansões por entitlement. Mestre: 5 fichas, 3 mesas e expansões completas. ADM: ilimitado.
- Compras são atômicas por RPC. Saldo, slots e desbloqueios jamais são concedidos por `localStorage`.
- `localStorage` continua permitido apenas para posição/minimização do Orbe e outras preferências de interface.
- Não existe transferência de SoulDrakma entre contas na V2.5.
