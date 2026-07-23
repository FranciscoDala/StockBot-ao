stockbot-ao/
│
├── apps/ # <- Tudo que "roda" / "deploya"
│ ├── api/ # 1. Backend FastAPI = O Cérebro
│ │ ├── app/
│ │ ├── api/ # <- Rotas: v1/venda.py, v1/produto.py, v1/webhook.py
│ │ ├── core/ # <- Config, Segurança, JWT, .env
│ │ ├── db/ # <- Base: session.py, base.py, migrations/
│ │ ├── models/ # <- SQLAlchemy: loja.py, produto.py, venda.py, user.py
│ │ ├── schemas/ # <- Pydantic: produto_schema.py, venda_schema.py
│ │ ├── services/ # <- Regra de negócio: stock_service.py, relatorio_service.py
│ │ ├── integrations/ # <- UltraMSG, Whapi, Multicaixa Express
│ │ └── main.py # <- Junta tudo: FastAPI()
│ │ ├── tests/ # <- Pytest: test_venda.py
│ │ ├── alembic.ini # <- Migrações de DB
│ │ ├── Dockerfile
│ │ └── pyproject.toml # <- Poetry/Pip: dependências
│ │
│ ├── pwa/ # 2. App Funcionário = React + Vite PWA
│ │ ├── src/
│ │ ├── components/ # <- Button, ProductCard
│ │ ├── pages/ # <- VendaPage.tsx
│ │ ├── api/ # <- cliente axios pra chamar /api
│ │ └── main.tsx
│ │ ├── public/
│ │ ├── manifest.json
│ │ └── icons/
│ │ ├── index.html
│ │ └── package.json
│ │
│ └── dashboard/ # 3. Painel Dono = Next.js
│   ├── app/
│   │ ├── login/page.tsx
│   │ └── dashboard/page.tsx # <- Gráficos com Recharts
│   ├── components/
│   └── package.json
│
├── packages/ # <- Código partilhado. Evita copiar/colar
│ ├── ui/ # <- Botões, Cores, Tema do StockBot
│ ├── tsconfig/ # <- Config TS partilhada
│ ├── eslint-config/ # <- Regra de código partilhada
│ └── db/ # <- Tipos TS gerados do Postgres
│
├── infra/ # <- Tudo pra subir
│ ├── docker-compose.yml # <- Roda tudo local: API + DB + Redis
│ ├── render.yaml # <- Deploy 1 clique no Render
│ └── nginx.conf
│
├── docs/ # <- Documentação
│ ├── API.md # <- Endpoints da API
│ └── ONBOARDING.md # <- Como vender pra cantina
│
├──.github/ # <- CI/CD Automático
│ └── workflows/
│     └── deploy.yml # <- Testa e sobe sozinho no push
│
├──.gitignore
├── package.json # <- Root do Monorepo. Comando: pnpm dev
├── pnpm-workspace.yaml # <- Liga todas pastas
└── README.md # <- Pitch + Como rodar: `pnpm dev`




# comando para criar todas as pastas automaticamente e os
# ficheiros que estão dentro da pasta

# pasta principal
$root = "stockbot-ao"

$folders = @(
"apps/api/app/api","apps/api/app/core","apps/api/app/db","apps/api/app/models","apps/api/app/schemas","apps/api/app/services","apps/api/app/integrations","apps/api/tests",
"apps/pwa/src/components","apps/pwa/src/pages","apps/pwa/src/api","apps/pwa/public/icons",
"apps/dashboard/app/dashboard","apps/dashboard/components",
"packages/ui","packages/tsconfig","packages/eslint-config","packages/db",
"infra","docs",".github/workflows"
)

$files = @(
"apps/api/app/main.py","apps/api/app/__init__.py","apps/api/app/api/v1_venda.py","apps/api/app/api/v1_produto.py","apps/api/app/api/v1_webhook.py",
"apps/api/app/core/config.py","apps/api/app/db/session.py","apps/api/app/db/base.py",
"apps/api/app/models/loja.py","apps/api/app/models/produto.py","apps/api/app/models/venda.py","apps/api/app/models/user.py",
"apps/api/app/schemas/produto_schema.py","apps/api/app/schemas/venda_schema.py",
"apps/api/app/services/stock_service.py","apps/api/app/services/relatorio_service.py",
"apps/api/app/integrations/ultramsg.py","apps/api/tests/test_venda.py","apps/api/alembic.ini","apps/api/Dockerfile","apps/api/pyproject.toml",
"apps/pwa/src/main.tsx","apps/pwa/src/components/Button.tsx","apps/pwa/src/components/ProductCard.tsx","apps/pwa/src/pages/VendaPage.tsx","apps/pwa/src/api/client.ts",
"apps/pwa/public/manifest.json","apps/pwa/public/sw.js","apps/pwa/index.html","apps/pwa/package.json",
"apps/dashboard/app/login/page.tsx","apps/dashboard/app/dashboard/page.tsx","apps/dashboard/components/Header.tsx","apps/dashboard/package.json",
"packages/ui/index.ts","packages/tsconfig/base.json","packages/eslint-config/index.js","packages/db/index.ts",
"infra/docker-compose.yml","infra/render.yaml","infra/nginx.conf",
"docs/API.md","docs/ONBOARDING.md",".github/workflows/deploy.yml",".gitignore","package.json","pnpm-workspace.yaml","README.md",".env.example"
)

New-Item -ItemType Directory -Force -Path $root | Out-Null
foreach ($f in $folders) { New-Item -ItemType Directory -Force -Path "$root/$f" | Out-Null }
foreach ($f in $files) { New-Item -ItemType File -Force -Path "$root/$f" | Out-Null }

Set-Location $root
git init
git branch -M main
@"
node_modules
.env
__pycache__
.venv
dist
build
"@ | Out-File -FilePath .gitignore -Encoding utf8

git add .
git commit -m "chore: init StockBot AO v1 - estrutura escalável"

Write-Host "✅ StockBot AO criado com sucesso em: $PWD"











# como subir o projecto novo lá gitHub
    1. criar o repositorio la no gitHub
    2. copiar o endereço do repositorio criado
        ex: https://github.com/FranciscoDala/StockBot-ao.git

    3. usar os comandos do gitHub para subir a pasta toda

        # remote add origin = Liga teu PC com o GitHub
        1. git remote add origin https://github.com/FranciscoDala/StockBot-ao.git

        # branch -M main = Garante que o nome da branch é main
        2. git branch -M main

        # push -u origin main = Envia tudo e já deixa main como padrão
        3. git push -u origin main

# ok, depois de subir a pasta do projeto
# para começar atualizar no gitHub as pastas e arquivos alterados localmente
# é so usar os seguintes comandos

    # para adicionar todos os arquivos ou pastas alterados
    1. git add .

    # comentar o nome para saber o que vc subiu
    2. git commit .m "Qualquer nome para saber o que subiu"

    #  Envia tudo e já deixa main como padrão
    3 git push origin main

# para rodar o app
    1. uvicorn api.app.main:app --reload --port 8000

# rodar o env
    .\.venv\Scripts\Activate.ps1
    .\.venv\Scripts\Activate.ps1

# para subir o frontend
    pnpm run dev

# usuario

    Admin
    user - admin@stockbot.ao
    pass - 123456

INSERT INTO usuarios (id, nome, email, senha_hash, nivel, is_active, created_at, updated_at)
VALUES (
gen_random_uuid(),
    'Admin',
    'admin@stockbot.ao',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6uKx5TQq2K',
    'ADMIN',
    true,
    NOW(),
    NOW()
);



























Boas 🔥 Agora sim, tá com a base trancada

Do que falta pra deixar o StockBot 100% "pronto pra produção", o que resta é isso aqui:

### *1. Segurança e Validação [Prioridade Alta]*
- [ ] *Validar dono da loja na API*
  Hoje o middleware só vê "tem token". Na API tu ainda precisa checar: `esse token pode ver a /loja/[slug]`? Senão um dono consegue ver a loja do outro trocando o slug na URL.
- [ ] *Tirar dados sensíveis do front*
  `API_URL = "http://127.0.0.1:8000"` isso vai quebrar quando subir pro servidor. Tem que vir de `.env.local`

### *2. UX e Funcionalidade*
- [ ] *Feedback de erro melhor*
  Quando dá 401/403 hoje tu faz `handleTerminarSessao()`. Fazer um toast "Sessão expirada" antes de deslogar.
- [ ] *Paginação / Busca de Lojas*
  Quando tiver 200 lojas, carregar tudo de uma vez vai pesar. Fazer busca e paginar.
- [ ] *Upload de Logo/Banner da Loja*
  Só tem nome, slug e endereço. Falta identidade visual.

### *3. Deployer / Produção*
- [ ] *Variáveis de ambiente*
  Trocar `API_URL` pra `process.env.NEXT_PUBLIC_API_URL`
- [ ] *HTTPS + Cookies Secure*
  No `deleteCookie` e quando seta o cookie tem que ter `Secure; SameSite=Strict` pra produção
- [ ] *Build e Testar*
  Rodar `npm run build` e ver se nada quebrou. Middleware às vezes dá dor de cabeça no build.

### *4. Bônus que deixam profissional*
- [ ] *Role de Usuário*
  Diferenciar ADMIN de DONO no middleware. Ex: Dono não pode entrar em `/admin`
- [ ] *Loading Skeletons*
  Em vez de "Carregando lojas..." fazer cards cinza pulsando
- [ ] *Logs*
  Guardar quem criou/apagou loja

---

*Veredito:*
O que tens agora já dá pra usar internamente. As 3 coisas que eu faria AGORA antes de subir são: 1. `.env`, 2. Validar dono na API, 3. Cookies Secure

Quer que a gente ataque qual primeiro?
Eu recomendo começar pelo item 1.2 - Validar dono da loja na API, porque é brecha real de segurança.









-- 2. Criar o Usuario DONO. Senha = 123456
-- Adicionei is_verified = true
INSERT INTO usuarios (id, nome, email, senha_hash, telefone, is_active, is_verified, is_superuser, created_at, updated_at)
VALUES
(
    gen_random_uuid(),
    'Admin Teste',
    'admin@stockbot.ao',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- hash de 123456
    '939000',
    true,  -- is_active
    true,  -- is_verified <- FALTAVA ESSE
    true,  -- is_superuser
    now(),
    now()
)
RETURNING id;


















