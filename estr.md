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



















        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) {setEditingLoja(null); setFormData(emptyForm)} }}>
          <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md">
            <Plus className="w-4 h-4" /> Nova Loja
          </Button>

          <DialogContent
            className="sm:max-w-[600px] bg-black/50 border-white/10 p-0 flex flex-col max-h-[85vh]"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0">
              <DialogHeader className="p-6 pb-0 shrink-0">
                <DialogTitle>{editingLoja? "Editar Loja" : "Criar Nova Loja"}</DialogTitle>
                <DialogDescription>
                  {editingLoja? "Altere os dados abaixo." : `Preencha os dados. Slug: /${formData.slug || "minha-loja"}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 px-6 overflow-y-auto hide-scrollbar flex-1 min-h-0">

                <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados da Loja</p>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">Nome</Label>
                  <Input id="nome" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="col-span-3 bg-background" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="slug" className="text-right">Slug</Label>
                  <Input id="slug" value={formData.slug} onChange={e => handleChange('slug', e.target.value)} className="col-span-3 bg-background" required disabled={!!editingLoja} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endereco" className="text-right">Endereço</Label>
                  <Input id="endereco" value={formData.endereco} onChange={e => handleChange('endereco', e.target.value)} className="col-span-3 bg-background" placeholder="Rua, Bairro, Cidade" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">Ativa</Label>
                  <Switch id="active" checked={formData.is_active} onCheckedChange={v => handleChange('is_active', v)} className="col-span-3 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-700" />
                </div>

                {editingLoja && formData.dono && (
                  <>
                    <div className="border-t pt-4 mt-2">
                      <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados do Dono</p>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Nome</Label>
                      <Input value={formData.dono.nome} onChange={e => handleDonoChange('nome', e.target.value)} className="col-span-3 bg-background" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Email</Label>
                      <Input type="email" value={formData.dono.email} onChange={e => handleDonoChange('email', e.target.value)} className="col-span-3 bg-background" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Telefone</Label>
                      <Input value={formData.dono.telefone?? ""} onChange={e => handleDonoChange('telefone', e.target.value)} placeholder="Ex: 923456789" className="col-span-3 bg-background" />
                    </div>
                  </>
                )}

                {!editingLoja && (
                  <>
                    <div className="border-t pt-4 mt-2">
                      <p className="text-sm font-semibold text-muted-foreground -mb-2">Dono da Loja</p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2">
                      <Button type="button" variant={formData.modoDono === 'existente'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'existente')} className={formData.modoDono === 'existente'? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                        Dono Existente
                      </Button>
                      <Button type="button" variant={formData.modoDono === 'novo'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'novo')} className={formData.modoDono === 'novo'? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                        Criar Novo Dono
                      </Button>
                    </div>

                    {formData.modoDono === 'existente' && (
                      <div className="space-y-4 pt-2">
                        <select value={formData.dono_existente_id} onChange={(e) => handleChange('dono_existente_id', e.target.value)} required={formData.modoDono === 'existente'} className="flex h-10 w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value="" disabled>{donos.length > 0? "Seleciona um dono..." : "Nenhum dono cadastrado"}</option>
                          {donos.map(d => <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>)}
                        </select>
                      </div>
                    )}

                    {formData.modoDono === 'novo' && (
                      <div className="space-y-4 pt-2">
                        <Input placeholder="Nome do Dono" value={formData.dono_novo.nome} onChange={e => handleDonoNovoChange('nome', e.target.value)} required={formData.modoDono === 'novo'} />
                        <Input type="email" placeholder="Email do Dono" value={formData.dono_novo.email} onChange={e => handleDonoNovoChange('email', e.target.value)} required={formData.modoDono === 'novo'} />
                        <Input type="password" placeholder="Senha do Dono" value={formData.dono_novo.senha} onChange={e => handleDonoNovoChange('senha', e.target.value)} required={formData.modoDono === 'novo'} />
                        <Input placeholder="Telefone Opcional" value={formData.dono_novo.telefone} onChange={e => handleDonoNovoChange('telefone', e.target.value)} />
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter className="p-6 pt-0 bg-background shrink-0 border-t border-white/10">
                <DialogClose asChild>
                  <Button type="button" className="bg-gray-500 hover:bg-gray-600 text-white">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingLoja? "Salvar Alterações" : "Salvar Loja"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>












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
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, Tag, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Produto } from "../modals/ProdutoModal";

interface Props {
    produtos: Produto[];
    isAdmin: boolean;
    isDono: boolean;
    onAdd: () => void;
    onEdit: (p: Produto) => void;
    onDelete: (p: Produto) => void;
    formatCurrency: (v: number) => string;
}

export function ProdutosTab({ produtos, isAdmin, isDono, onAdd, onEdit, onDelete, formatCurrency }: Props) {

    const getEstoqueStatus = (estoque: number, minimo: number) => {
        if (estoque === 0) return { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Sem Estoque", icon: <AlertTriangle size={10} /> };
        if (estoque <= minimo) return { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Estoque Baixo", icon: <TrendingDown size={10} /> };
        return { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Em Estoque", icon: <TrendingUp size={10} /> };
    }

    return (
        <div className="bg-neutral-900 p-4 sm:p-5 rounded-xl border-neutral-800">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
                <div>
                    <h3 className="font-bold text-base">Produtos da Loja</h3>
                    <p className="text-xs text-gray-400">{produtos.length} {produtos.length === 1? 'produto' : 'produtos'} cadastrados</p>
                </div>
                {isAdmin && (
                    <Button size="sm" onClick={onAdd} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto font-semibold text-sm">
                        <Plus size={14} /> Adicionar Produto
                    </Button>
                )}
            </div>

            {/* ESTADO VAZIO */}
            {produtos.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-neutral-800 rounded-lg">
                    <Package className="mx-auto text-gray-600 mb-2" size={40} />
                    <p className="text-gray-400 font-medium text-sm">Nenhum produto cadastrado</p>
                    <p className="text-xs text-gray-500">Comece adicionando seu primeiro produto</p>
                </div>
            )}

            {/* GRID DE CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {produtos.map(p => {
                    const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                    const lucroUnidade = p.preco - p.preco_custo; // LUCRO EM KZ
                    const lucroTotal = lucroUnidade * p.estoque; // LUCRO SE VENDER TUDO

                    return (
                        <div key={p.id} className={`bg-neutral-950 border-neutral-800 rounded-lg overflow-hidden flex-col transition-all hover:border-green-500/50 group ${!p.is_active? 'opacity-60' : ''}`}>

                            {/* IMAGEM */}
                            <div className="relative w-full h-32 bg-neutral-900">
                                {p.imagem_url? (
                                    <img
                                        src={p.imagem_url}
                                        alt={p.nome}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageOff className="text-gray-600" size={24} />
                                    </div>
                                )}
                                {!p.is_active && (
                                    <div className="absolute top-1.5 right-1.5">
                                        <Badge variant="destructive" className="text- h-5 px-1.5">Inativo</Badge>
                                    </div>
                                )}
                            </div>

                            {/* CONTEUDO */}
                            <div className="p-3 flex-col flex-1">
                                <div className="flex items-start justify-between mb-1.5">
                                    <h4 className="font-semibold text-sm truncate group-hover:text-green-500 transition-colors flex-1">{p.nome}</h4>
                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text- font-semibold border ml-1.5 shrink-0 ${status.bg} ${status.color}`}>
                                        {status.icon}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text- text-gray-500 mb-2">
                                    <Tag size={10} /> SKU: {p.sku || 'N/A'}
                                </div>

                                {/* DADOS */}
                                <div className="space-y-1.5 text-xs flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Preço</span>
                                        <span className="font-bold text-green-400 text-sm">{formatCurrency(p.preco)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Custo</span>
                                        <span className="font-medium text-gray-300">{formatCurrency(p.preco_custo)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Lucro/Un</span>
                                        <span className={`font-bold ${lucroUnidade >= 0? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(lucroUnidade)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1.5 border-t border-neutral-800">
                                        <span className="text-gray-400">Estoque</span>
                                        <span className={`font-bold ${status.color}`}>{p.estoque} {p.unidade}</span>
                                    </div>
                                    {p.estoque > 0 && (
                                        <div className="flex justify-between items-center text-">
                                            <span className="text-gray-500">Lucro Potencial</span>
                                            <span className={`font-semibold ${lucroTotal >= 0? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(lucroTotal)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* AÇÕES */}
                                {isAdmin && (
                                    <div className="flex gap-1.5 mt-3 pt-2 border-t border-neutral-800">
                                        <Button size="sm" variant="secondary" onClick={() => onEdit(p)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 h-8 text-xs">
                                            <Edit size={12}/> Editar
                                        </Button>
                                        {isDono && (
                                            <Button size="sm" variant="destructive" onClick={() => onDelete(p)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white h-8 px-2">
                                                <Trash2 size={12}/>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
