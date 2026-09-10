> **V2.6.0:** o Escudo do Mestre agora possui Atlas Global em Leaflet, dossiês visitáveis com artes, solicitações cartográficas Mestre→ADM e simulador econômico global controlado exclusivamente pelo ADM.

> **V2.5.3:** Imortalização simplificada nos dois modos: somente Nome + Expansão + Classe são pré-requisitos; todo o restante da ficha pode ser completado depois.

> **V2.5.2:** Painel ADM reorganizado em abas Usuários / SoulDrakma para tornar concessões administrativas explicitamente acessíveis.

# Mundos Sombrios — Portal Oficial

Site estático do portal oficial em HTML/CSS/JS, preparado para publicação em GitHub Pages.

## Arquitetura online atual e autenticação

Este projeto não deve conter nenhum usuário, senha ou credencial fixa embutida no código.

A autenticação do administrador deve acontecer via Supabase:

1. as contas são criadas pelo Supabase Auth;
2. um trigger cria o perfil correspondente em `public.profiles`;
3. o primeiro administrador é promovido pela RPC `bootstrap_first_admin` após autenticação;
4. o login é validado pelo Supabase Auth, sem senha ou hash salvo no front-end;
5. o painel administrativo é liberado conforme o perfil autenticado e as permissões do banco.

> Nenhuma conta padrão como `kaue-admin` deve existir no código. Qualquer usuário administrador precisa ser cadastrado no banco ou no primeiro fluxo de criação do painel.

## Publicar no GitHub Pages

1. Envie os arquivos para a raiz do repositório, na branch `main`.
2. Em Settings → Pages → Source, selecione **GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` valida JavaScript, executa os testes e publica somente os arquivos públicos de `dist/`.
4. Consulte `IMPLANTACAO.md` para concluir a configuração do Supabase antes de abrir o site aos usuários.

## Fonte de verdade

O **Supabase é a fonte de verdade** para autenticação, perfis, fichas, mesas, estado de mesa, eventos e ferramentas online. O navegador mantém somente cache efêmero para a sessão e a interface.

A camada `js/ms-platform.js` centraliza eventos, estados de loading/erro/sucesso, validação de ficha, recursos e exportação. `js/supabase-db.js` é a única camada de acesso ao banco.

Consulte `ARCHITECTURE/CURRENT.md` antes de criar uma nova funcionalidade.

## Modelo de produção — uma única fonte de verdade

- usar Supabase Auth + PostgreSQL + RLS + RPC + Realtime como fonte única de verdade;
- tratar `tables` como a entidade canônica de Mesa; `table_members` como a relação de participação; `character_versions` como histórico recuperável;
- usar `js/ms-services.js` como única camada de domínio entre UI e banco; componentes não devem chamar `supabase.from(...)` diretamente;
- salvar usuários, edições, mesas, personagens e publicações em tabelas do banco;
- manter o código do front-end leve, renderizando e enviando dados;
- nunca hardcodear credenciais, posts, conteúdo editorial ou regras de acesso em arquivos JavaScript;
- todas as operações privilegiadas devem ser protegidas por RLS ou RPC no Supabase;
- tratar documentos `ARCHITECTURE/*V0.*` e `AUDIT/*V0.*` como histórico, salvo quando explicitamente marcados como atuais.

## Observações

- O projeto usa persistência online do Supabase como fonte única de verdade.
- Não existe persistência de credenciais, personagens ou conteúdo de jogo por `localStorage`. A V2.1 usa `localStorage` apenas para preferências locais de interface (nível de imersão, áudio opcional e modo guiado/rápido); esses dados não são fonte de verdade do jogo.
- Para cada tipo de conteúdo que deve ser administrado online (postagens, notícias, regras, materiais), o ideal é criar uma tabela no Supabase e gravar por API/JS com `upsert` ou `insert`.

## Publicação do banco

Para uma instalação nova, execute, nesta ordem:

1. `supabase-production.sql`
2. `supabase-master-v2.3-migration.sql`
3. `supabase-soul-economy-v2.5-migration.sql`
4. `supabase-character-minimum-v2.5.3-migration.sql`
5. `supabase-atlas-v2.6-migration.sql`

Para instalações existentes, compare as tabelas, funções e migrações já aplicadas antes de executar apenas as mudanças pendentes. Não reaplique indiscriminadamente o schema inicial. Nunca desabilite RLS em produção.

## Experiência V2.1

A camada `js/immersive-experience.js` é exclusivamente de UX/direção de arte. Ela observa o estado canônico do construtor e acrescenta jornada guiada, Retrato Vivo, modos Criar/Evoluir/Jogar, transparência de fórmulas, feedback visual de consequências, favoritos de poderes e preferências de intensidade. Regras continuam em `ms-platform.js` e nos módulos especializados; a camada imersiva não deve duplicar cálculos canônicos.


## Portal Oficial V2.2

A home pública usa `css/portal/portal-editorial-v2.2.css` como camada final de apresentação. O Portal V2.2 reduz a extensão vertical, limita comprimentos de leitura, omite painéis editoriais vazios na página inicial, mantém um índice de acesso rápido e preserva a navegação principal nas subpáginas. Conteúdo publicado continua vindo de `PortalContent`/Supabase; o redesign não cria uma segunda fonte editorial.


## Centro de Comando do Mestre V2.3
A experiência do Mestre agora inclui fundação guiada de campanha, modo sessão, storyboard de cenas, Combat Director, NPCs com memória, pistas em três estados, facções vivas, mapa de relações, busca universal (`Ctrl/Cmd+K`), visão do jogador, encerramento de sessão e Registros Históricos integrados. Para colaboração por Co-Mestre/Observador, aplique `supabase-master-v2.3-migration.sql`.


## V2.4 — Mestre, dados 3D e performance
A V2.4 integra Campanha em Movimento à mesa selecionada, corrige o enquadramento da fundação de campanha, adiciona animações 3D próprias para D4/D6/D8/D10/D12/D20 e torna Forja, Fabric.js e html2pdf recursos sob demanda. O boot local de JavaScript foi reduzido em aproximadamente 61%. Consulte `AUDIT/MASTER-PERFORMANCE-V2.4.0.md`.


## V2.5 — Soul Economy
A V2.5 adiciona progressão de conta com SoulDrakma: Wallet/Ledger server-side, Colheita de 10 minutos a 2 SD/minuto, slots por papel, entitlements de expansão, Cofre, conquistas e console econômico do ADM. Jogadores continuam podendo consultar cards e Códices de todas as expansões; o bloqueio atua somente na criação. A migração `supabase-soul-economy-v2.5-migration.sql` é obrigatória em produção. Consulte `AUDIT/SOUL-ECONOMY-V2.5.0.md`. A V2.5.1 substitui o pseudo-3D do Orbe por renderização facetada em Canvas com animação contínua e registra a varredura por papel em `AUDIT/ROLE-SWEEP-V2.5.1.md`.
