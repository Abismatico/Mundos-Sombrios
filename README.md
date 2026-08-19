# Mundos Sombrios — Portal Oficial

Site estático do portal oficial em HTML/CSS/JS, preparado para publicação em GitHub Pages.

## Autenticação e persistência

Este projeto não deve conter nenhum usuário, senha ou credencial fixa embutida no código.

A autenticação do administrador deve acontecer via Supabase:

1. o perfil do admin é criado no banco em `public.profiles`;
2. o campo `role` deve ser `admin`;
3. o campo `password_hash` deve ser gerado pelo próprio app usando PBKDF2;
4. o login valida a senha no browser com o hash salvo no banco;
5. o painel administrativo é liberado somente quando `currentUser.role === 'admin'`.

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
