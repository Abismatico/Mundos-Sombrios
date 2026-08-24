# Mundos Sombrios — Portal Oficial

Site estático do portal oficial em HTML/CSS/JS, preparado para publicação em GitHub Pages.

## Autenticação e persistência

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

## Fluxo recomendado para produção

- usar Supabase como fonte única de dados;
- salvar usuários, edições, mesas, personagens e publicações em tabelas do banco;
- manter o código do front-end leve, apenas renderizando e enviando dados;
- nunca hardcodear credenciais, posts, conteúdo editorial ou regras de acesso em arquivos JavaScript.

## Observações

- O projeto usa persitência online do Supabase como fonte principal.
- O uso de `localStorage` continua como fallback de compatibilidade, mas não deve ser a fonte de verdade para login ou conteúdo público.
- Para cada tipo de conteúdo que deve ser administrado online (postagens, notícias, regras, materiais), o ideal é criar uma tabela no Supabase e gravar por API/JS com `upsert` ou `insert`.
