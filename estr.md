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