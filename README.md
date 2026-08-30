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

1. Crie um repositório público ou privado no GitHub.
2. Envie este diretório como raiz do repositório.
3. No GitHub, vá em Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main` e folder: `/root`.
6. Salve.

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
- Não existe persistência de credenciais, personagens ou conteúdo por `localStorage` no runtime atual; caches de compatibilidade são apenas memória de sessão.
- Para cada tipo de conteúdo que deve ser administrado online (postagens, notícias, regras, materiais), o ideal é criar uma tabela no Supabase e gravar por API/JS com `upsert` ou `insert`.

## Publicação do banco

Para uma instalação nova, execute `supabase-production.sql` no SQL Editor do Supabase. Ele reúne o schema base e a migração online, incluindo Auth, RLS, RPC, Realtime, convites, histórico de fichas, campanhas e sessões.

Para instalações existentes, execute apenas `supabase-online-migration.sql` depois de revisar o estado atual das tabelas. Nunca desabilite RLS em produção.
