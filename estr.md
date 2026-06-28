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
    1. uvicorn app.main:app --reload --port 8000