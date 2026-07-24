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


























"use client";
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, Tag, ImageOff, QrCode, Download, DollarSign, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loja, userread } from "../../page";
import { formatCurrency } from "../utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
    produtos: any[];
    isAdmin: boolean;
    isDono: boolean;
    lojaId?: string;
    onAdd: () => void;
    onEdit: (p: any) => void;
    onDelete: (p: any) => void;
    formatCurrency: (v: number) => string;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function ProdutosTab({
    produtos,
    isAdmin,
    isDono,
    lojaId,
    onAdd,
    onEdit,
    onDelete,
    formatCurrency,
    theme,
    cardStyle,
    cardSize
}: Props) {
    const [qrProduto, setQrProduto] = useState<any>(null);

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const padding = cardSize === 'grande' ? '20px' : '16px';

    const getEstoqueStatus = (estoque: number, minimo: number) => {
        if (estoque === 0) return { color: "#ef4444", bg: "#ef444414", border: "#ef444430", label: "Sem Estoque", icon: <AlertTriangle size={12} /> };
        if (estoque <= minimo) return { color: "#f59e0b", bg: "#f59e0b14", border: "#f59e0b30", label: "Estoque Baixo", icon: <TrendingDown size={12} /> };
        return { color: "var(--cor-primaria)", bg: "var(--cor-primaria)14", border: "var(--cor-primaria)30", label: "Em Estoque", icon: <TrendingUp size={12} /> };
    }

    const kpis = useMemo(() => {
        const totalProdutos = produtos.length;
        const totalEmEstoque = produtos.filter(p => p.estoque > p.estoque_minimo).length;
        const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length;
        const semEstoque = produtos.filter(p => p.estoque === 0).length;
        const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.preco_custo || 0) * (p.estoque || 0)), 0);
        return { totalProdutos, totalEmEstoque, estoqueBaixo, semEstoque, valorTotalEstoque };
    }, [produtos]);

    const handleDownloadQR = (p: any) => {
        const svg = document.getElementById(`qr-${p.id}`);
        if (!svg) return;
        const serializer = new XMLSerializer();
        const svgBlob = new Blob([serializer.serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `QR-${p.sku || p.id}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .snap-x { scroll-snap-type: x mandatory; }
                .snap-center { scroll-snap-align: center; }
        `}</style>
            <div
                className="space-y-6"
                data-theme={theme}
                data-card-style={cardStyle}
                data-card-size={cardSize}
            >

                {/* HEADER PADRONIZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            Produtos
                            <Package size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </h2>
                        <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{kpis.totalProdutos} produtos cadastrados</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={onAdd}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4" // padronizado
                            style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                        >
                            <Plus size={16} /> Adicionar Produto
                        </button>
                    )}
                </div>

                {/* CARDS KPI PADRONIZADOS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div
                        className="transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', // 👈 glass
                            backdropFilter: 'blur(12px)',
                            color: 'var(--cor-primaria)', // 👈 letras primary
                            borderRadius: radius,
                            padding,
                            border: 'none', // 👈 remove borda
                            boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' // 👈 shadow
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>Valor em Estoque</p>
                            <DollarSign size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" style={{ color: 'var(--cor-primaria)' }} title={formatCurrency(kpis.valorTotalEstoque)}>
                            {formatCurrency(kpis.valorTotalEstoque)}
                        </p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>Total do estoque atual</p>
                    </div>

                    <div
                        className="transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', // 👈 glass
                            backdropFilter: 'blur(12px)',
                            color: 'var(--cor-primaria)', // 👈 letras primary
                            borderRadius: radius,
                            padding,
                            border: 'none', // 👈 remove borda
                            boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' // 👈 shadow
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-primaria)' }}>Em Estoque</p>
                            <TrendingUp size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{kpis.totalEmEstoque}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-primaria)' }}>Produtos com estoque ok</p>
                    </div>

                    <div
                        className="transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', // 👈 glass
                            backdropFilter: 'blur(12px)',
                            color: 'var(--cor-primaria)', // 👈 letras primary
                            borderRadius: radius,
                            padding,
                            border: 'none', // 👈 remove borda
                            boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' // 👈 shadow
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-primaria)' }}>Estoque Baixo</p>
                            <AlertTriangle size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{kpis.estoqueBaixo}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-primaria)' }}>Abaixo do mínimo</p>
                    </div>

                    <div
                        className="transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', // 👈 glass
                            backdropFilter: 'blur(12px)',
                            color: 'var(--cor-primaria)', // 👈 letras primary
                            borderRadius: radius,
                            padding,
                            border: 'none', // 👈 remove borda
                            boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' // 👈 shadow
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-primaria)' }}>Sem Estoque</p>
                            <TrendingDown size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{kpis.semEstoque}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-primaria)' }}>Produtos zerados</p>
                    </div>
                </div>

                {/* GRID DE PRODUTOS - MOBILE SCROLL | DESKTOP GRID */}
                <div className="">
                    {produtos.length === 0 ? (
                        <div
                            className="text-center py-16 border mt-4"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--cor-primaria) 20%, transparent)', // 👈 borda bem fraca
                                borderRadius: radius,
                                background: 'color-mix(in srgb, var(--cor-card) 95%, transparent)',
                                boxShadow: `0 0 20px color-mix(in srgb, var(--cor-primaria) 10%, transparent)` // 👈 shadow leve
                            }}
                        >
                            <Package className="mx-auto mb-3" size={48} style={{ color: 'var(--cor-primaria)', opacity: 0.5 }} />
                            <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>Nenhum produto cadastrado</p>
                            <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Comece adicionando seu primeiro produto</p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE: SCROLL HORIZONTAL */}
                            <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x px-4 py-4">
                                <div className="flex w-max gap-4">
                                    {produtos.map(p => {
                                        const preco = p.preco_venda || p.preco || 0;
                                        const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                                        const imgSrc = p.imagem_url?.startsWith('http') ? p.imagem_url : `${API_BASE}${p.imagem_url}`;

                                        return (
                                            <div
                                                key={`mobile-${p.id}`} // ou desktop
                                                className={`overflow-hidden flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${!p.is_active ? 'opacity-50' : ''} w-[calc(100vw-32px)] snap-center shrink-0 mx-auto`}
                                                style={{
                                                    background: 'color-mix(in srgb, var(--cor-card) 95%, transparent)', // 👈 glass leve
                                                    backdropFilter: 'blur(8px)',
                                                    border: `1px solid color-mix(in srgb, var(--cor-primaria) 15%, transparent)`, // 👈 borda quase invisivel primary
                                                    borderRadius: radius,
                                                    boxShadow: `0 0 20px color-mix(in srgb, var(--cor-primaria) 12%, transparent), 0 4px 16px rgba(0,0,0,0.15)`, // 👈 shadow primary + leve
                                                    opacity: p.is_active ? 1 : 0.6
                                                }}
                                            >
                                                {/* IMAGEM */}
                                                <div className="relative w-full h-52 overflow-hidden" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                                                    {p.imagem_url ? (
                                                        <img src={imgSrc} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><ImageOff size={36} style={{ color: 'var(--cor-primaria)', opacity: 0.3 }} /></div>
                                                    )}
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        <button onClick={() => setQrProduto(p)} className="backdrop-blur-md p-2 rounded-xl hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius }}>
                                                            <QrCode size={18} className="text-white" />
                                                        </button>
                                                        {!p.is_active && (<Badge className="text-xs h-7 px-3 font-semibold" style={{ backgroundColor: '#ef4444', borderRadius: radius }}>Inativo</Badge>)}
                                                    </div>
                                                </div>

                                                {/* CONTEUDO */}
                                                <div className="p-4 flex-col flex-1">
                                                    <h4 className="font-bold text-base mb-1.5 truncate" style={{ color: 'var(--cor-texto)' }}>{p.nome}</h4>
                                                    <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--cor-texto-sec)' }}><Tag size={12} /> {p.sku || 'N/A'}</div>
                                                    <div className="space-y-2.5 text-sm flex-1 mb-3">
                                                        <div className="flex justify-between items-center"><span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Preço</span><span className="font-bold text-lg" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</span></div>
                                                        <div className="flex justify-between items-center"><span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Estoque</span><div className="flex items-center gap-1.5 font-bold" style={{ color: status.color }}>{status.icon}<span>{p.estoque} {p.unidade}</span></div></div>
                                                    </div>
                                                    <div className="mb-4 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 w-fit" style={{ backgroundColor: status.bg, border: `1px solid ${status.border}`, color: status.color, borderRadius: radius }}>{status.icon} {status.label}</div>
                                                    {isAdmin && (
                                                        <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'var(--cor-primaria)30' }}>
                                                            <Button size="sm" onClick={() => onEdit(p)} className="flex-1 h-10 font-semibold" style={{ backgroundColor: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}><Edit size={14} /> Editar</Button>
                                                            {isDono && (<Button size="sm" variant="destructive" onClick={() => onDelete(p)} className="h-10 px-3" style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: radius }}><Trash2 size={14} /></Button>)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* DESKTOP: GRID NORMAL */}
                            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                                {produtos.map(p => {
                                    const preco = p.preco_venda || p.preco || 0;
                                    const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                                    const imgSrc = p.imagem_url?.startsWith('http') ? p.imagem_url : `${API_BASE}${p.imagem_url}`;

                                    return (
                                        <div
                                            key={`desktop-${p.id}`}
                                            className={`overflow-hidden flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${!p.is_active ? 'opacity-50' : ''}`}
                                            style={{
                                                background: 'color-mix(in srgb, var(--cor-card) 95%, transparent)', // 👈 glass leve
                                                backdropFilter: 'blur(8px)',
                                                border: `1px solid color-mix(in srgb, var(--cor-primaria) 15%, transparent)`, // 👈 borda quase invisivel
                                                borderRadius: radius,
                                                boxShadow: `0 0 20px color-mix(in srgb, var(--cor-primaria) 12%, transparent), 0 4px 16px rgba(0,0,0,0.15)`, // 👈 shadow primary
                                                opacity: p.is_active ? 1 : 0.6
                                            }}
                                        >
                                            {/* IMAGEM */}
                                            <div className="relative w-full h-52 overflow-hidden" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                                                {p.imagem_url ? (
                                                    <img src={imgSrc} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageOff size={36} style={{ color: 'var(--cor-primaria)', opacity: 0.3 }} /></div>
                                                )}
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    <button onClick={() => setQrProduto(p)} className="backdrop-blur-md p-2 rounded-xl hover:scale-110 transition-all" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius }}>
                                                        <QrCode size={18} className="text-white" />
                                                    </button>
                                                    {!p.is_active && (<Badge className="text-xs h-7 px-3 font-semibold" style={{ backgroundColor: '#ef4444', borderRadius: radius }}>Inativo</Badge>)}
                                                </div>
                                            </div>

                                            {/* CONTEUDO */}
                                            <div className="p-4 flex-col flex-1">
                                                <h4 className="font-bold text-base mb-1.5 truncate" style={{ color: 'var(--cor-texto)' }}>{p.nome}</h4>
                                                <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--cor-texto-sec)' }}><Tag size={12} /> {p.sku || 'N/A'}</div>
                                                <div className="space-y-2.5 text-sm flex-1 mb-3">
                                                    <div className="flex justify-between items-center"><span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Preço</span><span className="font-bold text-lg" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</span></div>
                                                    <div className="flex justify-between items-center"><span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Estoque</span><div className="flex items-center gap-1.5 font-bold" style={{ color: status.color }}>{status.icon}<span>{p.estoque} {p.unidade}</span></div></div>
                                                </div>
                                                <div className="mb-4 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 w-fit" style={{ backgroundColor: status.bg, border: `1px solid ${status.border}`, color: status.color, borderRadius: radius }}>{status.icon} {status.label}</div>
                                                {isAdmin && (
                                                    <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'var(--cor-primaria)30' }}>
                                                        <Button size="sm" onClick={() => onEdit(p)} className="flex-1 h-10 font-semibold" style={{ backgroundColor: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}><Edit size={14} /> Editar</Button>
                                                        {isDono && (<Button size="sm" variant="destructive" onClick={() => onDelete(p)} className="h-10 px-3" style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: radius }}><Trash2 size={14} /></Button>)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>

            <Dialog open={!!qrProduto} onOpenChange={() => setQrProduto(null)}>
                <DialogContent
                    className="border-0 max-w-sm w-[calc(100%-2rem)] p-0 overflow-hidden flex-col h-[80dvh] [&>button]:hidden items-center"
                    style={{ backgroundColor: 'var(--cor-fundo)' }}
                >
                    {/* HEADER */}
                    <div className="flex items-center justify-between p-4 shrink-0 w-full">
                        <button onClick={() => setQrProduto(null)} className="p-2 hover:bg-neutral-900 rounded-full transition" style={{ color: 'var(--cor-texto)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <DialogTitle className="text-base font-semibold" style={{ color: 'var(--cor-texto)' }}>Código QR</DialogTitle>
                        <button onClick={() => handleDownloadQR(qrProduto)} className="p-2 hover:bg-neutral-900 rounded-full transition" style={{ color: 'var(--cor-texto)' }}>
                            <Download size={20} />
                        </button>
                    </div>

                    {/* CONTEUDO CENTRALIZADO */}
                    <div className="px-4 pb-6 overflow-y-auto scrollbar-hide flex-1 w-full flex-col items-center">
                        <div
                            className="w-full p-6 flex-col items-center justify-center gap-5 text-center"
                            style={{ backgroundColor: 'var(--cor-card)', borderRadius: radius }}
                        >
                            {qrProduto?.imagem_url && (
                                <img
                                    src={qrProduto.imagem_url.startsWith('http') ? qrProduto.imagem_url : `${API_BASE}${qrProduto.imagem_url}`}
                                    alt={qrProduto.nome}
                                    className="w-16 h-16 rounded-full object-cover border-2"
                                    style={{ borderColor: 'var(--cor-primaria)30' }}
                                />
                            )}

                            <div className="space-y-1 w-full">
                                <p className="font-bold text-xl" style={{ color: 'var(--cor-texto)' }}>{qrProduto?.nome}</p>
                                <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>SKU: {qrProduto?.sku || 'N/A'}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-2xl w-full max-w-[280px]">
                                <QRCodeSVG
                                    id={`qr-${qrProduto?.id}`}
                                    value={`${APP_URL}/p/${qrProduto?.sku || qrProduto?.id}`}
                                    size={256}
                                    level="H"
                                    fgColor="#000"
                                    bgColor="#FFFFFF"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        <p className="text-center text-sm mt-6 px-4 leading-relaxed max-w-xs">
                            Este é o QR do seu produto.
                            <br />Qualquer pessoa pode escanear
                            <br />para ver a página e comprar direto.
                            <br />
                            <span className="font-medium" style={{ color: 'var(--cor-primaria)' }}>Manter em segurança</span>
                        </p>

                        <div className="mt-6 space-y-3 w-full max-w-sm px-2">
                            <Button
                                onClick={() => handleDownloadQR(qrProduto)}
                                className="w-full h-12 font-bold text-base flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                            >
                                <Download size={18} /> Baixar QR Code
                            </Button>

                            <button
                                onClick={() => toast.info("Função em breve")}
                                className="font-semibold text-sm w-full text-center hover:underline"
                                style={{ color: 'var(--cor-primaria)' }}
                            >
                                Gerar novo código
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    )
}

