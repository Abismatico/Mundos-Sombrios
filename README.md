# Mundos Sombrios — Portal Oficial

Site estático do portal oficial em HTML/CSS/JS, preparado para publicação em GitHub Pages.

## Login do administrador

A primeira vez que a página abrir em um navegador sem um administrador configurado, o sistema cria automaticamente um usuário administrador local com as credenciais abaixo:

- Usuário: `kaue-admin`
- E-mail: `kaue@mundossombrios.com`
- Senha: `MundosSombriosAdmin#2026`

> Isso é um setup local para uso pessoal do protótipo. Em um ambiente real, o login deve migrar para backend/autenticação segura.

## Publicar no GitHub Pages

1. Crie um repositório público ou privado no GitHub.
2. Envie este diretório como raiz do repositório.
3. No GitHub, vá em Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main` e folder: `/root`.
6. Salve.

## Acessar o painel admin

1. Abra a URL do GitHub Pages.
2. Faça login com `kaue-admin`.
3. No portal, clique em "SISTEMA DO ARCONTE (ADM)".

## Observações

- O site usa `localStorage` do navegador para persistir usuários e dados.
- Como é um protótipo client-side, o administrador fica vinculado ao navegador do visitante.
- O login do admin é habilitado somente para a instalação local do seu navegador, mas a estrutura já está pronta para publicar online.
