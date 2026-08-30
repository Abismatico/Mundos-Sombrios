# Mundos Sombrios — Arquitetura Atual (0.65.0)

## Fonte de verdade
Supabase Auth + PostgreSQL + RLS + RPC + Realtime.

## Camadas
`UI → Services → Supabase DB → RLS/RPC/Realtime`

### Core
- `js/ms-platform.js`: eventos, estados, validação, recursos, exportação e feedback.
- `js/ms-services.js`: serviços de domínio (`Auth`, `Profile`, `Characters`, `Games`, `VTT`, `Content`).
- `js/supabase-db.js`: único adaptador de transporte para Supabase.

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

### Regra de ouro
Nenhum componente deve criar uma segunda fonte de persistência. `localStorage`/`sessionStorage` não são banco. O estado local é somente de interface/sessão.

### Permissões
A UI pode ocultar ações, mas a autorização real deve existir em RLS/RPC. Jogadores só alteram suas próprias fichas; Mestres administram apenas suas mesas; membros recebem apenas os dados da mesa aos quais têm acesso.

### Realtime
`table_events` transmite eventos de mesa; `table_state` sincroniza o estado estrutural do Mestre.

### Migração
Funcionalidades legadas podem continuar usando wrappers compatíveis, mas a nova implementação deve entrar por `MS_SERVICES`. Remoções de adapters só acontecem depois da auditoria de dependências.
