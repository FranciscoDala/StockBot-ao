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























import logging # <- ADICIONA ISSO NO TOPO
from fastapi import APIRouter, Depends, status, Query, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import select, func, and_ # <- adiciona and_ no topo se não tiver
from datetime import date
from typing import List
from uuid import UUID
import asyncio
from decimal import Decimal


from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.usuario import Role
from app.models.usuario import Usuario
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from app.models.loja import Loja
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import TipoMovimentacao
from app.db.session import get_db
from app.schemas.venda import VendaCreate, VendaRead
from app.services.venda import criar_venda, estornar_venda_service
from app.services.whatsapp import enviar_msg_venda
from app.websocket.manager import manager
from app.api.v1.caixas import registrar_movimento_caixa


logger = logging.getLogger(__name__) # <- ADICIONA ISSO NO TOPO

router = APIRouter()



@router.post("/", response_model=VendaRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def criar_venda_endpoint(
    venda_in: VendaCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: UUID = Depends(get_current_loja_id)
):
    venda = await criar_venda(db=db, venda_in=venda_in, usuario=current_user, loja_id=loja_id)

    if venda and venda.itens:
        await db.commit() # 1. SALVA PRIMEIRO PRA GARANTIR DADOS NO BANCO

        for item in venda.itens:
            produto_id = item.produto_id
            nome_produto = item.nome_produto
            produto_db = await db.get(Produto, produto_id)
            if produto_db and produto_db.controla_estoque:
                await db.refresh(produto_db) # 2. PEGA ESTOQUE ATUALIZADO DO BANCO
                await manager.broadcast_to_loja(
                    str(loja_id),
                    {"tipo": "stock.updated", "produto_id": str(produto_id), "nome_produto": nome_produto, "novo_estoque": produto_db.estoque}
                )

        await manager.broadcast_to_loja(
            str(loja_id),
            {"tipo": "stats.updated", "valor_venda": float(venda.total), "total_itens": venda.total_itens, "acao": "add"}
        )

        # 3. LANÇA NO CAIXA TODA VENDA - DINHEIRO, TPA, PIX, ETC
        try:
            hoje = date.today()
            stmt_caixa = select(Caixa).where(
                and_(
                    Caixa.loja_id == loja_id,
                    Caixa.status == StatusCaixa.ABERTO,
                    func.date(Caixa.data_caixa) == hoje
                )
            )
            result_caixa = await db.execute(stmt_caixa)
            caixa_aberto = result_caixa.scalar_one_or_none()

            logger.info(f"[VENDA] Caixa encontrado: {caixa_aberto.id if caixa_aberto else 'NENHUM'}")

            if caixa_aberto:
                await registrar_movimento_caixa(
                    db=db,
                    caixa_id=UUID(str(caixa_aberto.id)), # type: ignore
                    loja_id=loja_id,
                    tipo=TipoMovimentacao.ENTRADA,
                    valor=Decimal(str(venda.total)),
                    descricao=f"Venda #{str(venda.id)[:8]} - {venda.forma_pagamento}",
                    usuario_id=current_user.id,
                    referencia_id=venda.id,
                    referencia_tipo='venda',
                    forma_pagamento=venda.forma_pagamento
                )
                await manager.broadcast_to_loja(str(loja_id), {"tipo": "caixa.updated"})
            else:
                logger.warning(f"AVISO CAIXA: Nenhum caixa aberto HOJE para venda {venda.id}")

        except Exception as e:
            logger.error(f"ERRO AO LANÇAR NO CAIXA: {e}", exc_info=True)

    if venda:
        background_tasks.add_task(enviar_msg_venda, db, loja_id, venda.id)
    return venda




@router.get("/", response_model=List[VendaRead], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def get_vendas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id_param: UUID | None = Query(None, alias="loja_id"),
    loja_id_token: UUID = Depends(get_current_loja_id),
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    vendedor_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(5000, ge=1, le=5000)
):
    loja_id_usar = loja_id_param or loja_id_token
    offset = (page - 1) * limit

    query = (
        select(Venda)
      .options(
            joinedload(Venda.usuario),
            joinedload(Venda.itens).joinedload(ItemVenda.produto)
        )
      .where(Venda.loja_id == loja_id_usar)
      .order_by(Venda.created_at.desc())
      .limit(limit)
      .offset(offset)
    )

    if data_inicio:
        query = query.where(Venda.created_at >= data_inicio)
    if data_fim:
        query = query.where(Venda.created_at <= data_fim)
    if vendedor_id:
        query = query.where(Venda.usuario_id == vendedor_id)

    result = await db.execute(query)
    vendas_db = result.scalars().unique().all()

    vendas_response = []
    for v in vendas_db:
        itens = []
        for i in v.itens:
            itens.append({
                "id": i.id,
                "venda_id": i.venda_id,
                "produto_id": i.produto_id,
                "loja_id": i.loja_id,
                "nome_produto": i.produto.nome if i.produto else "Produto Removido",
                "quantidade": i.quantidade,
                "preco_unitario": i.preco_unitario,
                "subtotal": i.subtotal,
            })

        vendas_response.append({
            "id": v.id,
            "loja_id": v.loja_id,
            "usuario_id": v.usuario_id,
            "nome_vendedor": v.usuario.nome if v.usuario else "Sistema",
            "total": v.total,
            "total_itens": v.total_itens,
            "forma_pagamento": v.forma_pagamento,
            "valor_recebido": v.valor_recebido,
            "troco": v.troco,
            "status": v.status,
            "data_venda": v.created_at,
            "itens": itens
        })

    return vendas_response # type: ignore



@router.get("/{venda_id}/imprimir", response_class=HTMLResponse)
async def imprimir_venda(
    venda_id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id)
):
    # Busca a venda com itens e loja
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto),
        selectinload(Venda.loja),
        selectinload(Venda.usuario)
    ).where(Venda.id == venda_id, Venda.loja_id == loja_id)

    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")

    # Monta HTML da factura
    itens_html = ""
    for item in venda.itens:
        nome = item.produto.nome if item.produto else "Produto Removido"
        itens_html += f"""
        <tr>
            <td>{nome}</td>
            <td style="text-align:center">{item.quantidade}</td>
            <td style="text-align:right">{item.preco_unitario:.2f} KZ</td>
            <td style="text-align:right">{item.subtotal:.2f} KZ</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
        <meta charset="UTF-8">
        <title>Factura #{str(venda.id)[:8]}</title>
        <style>
            body {{ font-family: 'Arial', sans-serif; padding: 20px; max-width: 80mm; margin: auto; font-size: 12px; }}
      .header {{ text-align: center; margin-bottom: 15px; }}
      .header h1 {{ margin: 0; font-size: 18px; }}
      .info p {{ margin: 2px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th, td {{ padding: 4px 0; border-bottom: 1px dashed #ccc; }}
      .total {{ text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px; }}
      .footer {{ text-align: center; margin-top: 20px; font-size: 10px; }}
            @media print {{ body {{ margin: 0; }} }}
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <h1>{venda.loja.nome if venda.loja else 'MINHA LOJA'}</h1>
            <p>FACTURA RECIBO</p>
        </div>
        <div class="info">
            <p><b>Nº:</b> {str(venda.id)[:8]}</p>
            <p><b>Data:</b> {venda.created_at.strftime('%d/%m/%Y %H:%M')}</p>
            <p><b>Vendedor:</b> {venda.usuario.nome if venda.usuario else 'Sistema'}</p>
            <p><b>Pagamento:</b> {venda.forma_pagamento}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th>
                </tr>
            </thead>
            <tbody>
                {itens_html}
            </tbody>
        </table>
        <div class="total">TOTAL: {venda.total:.2f} KZ</div>
        <div class="footer">
            <p>Obrigado pela preferência!</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)



@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    current_user: Usuario = Depends(get_current_user)
):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)

    valor_estornado = Decimal('0')
    total_itens_estornados = 0

    if itens_estornados:
        for item in itens_estornados:
            produto_id = item.get("produto_id")
            nome = item.get("nome")
            novo_estoque = item.get("novo_estoque")
            valor_estornado += Decimal(str(item.get("subtotal", 0)))
            total_itens_estornados += item.get("quantidade", 0)

            await manager.broadcast_to_loja(str(loja_id),{"tipo": "stock.updated","produto_id": str(produto_id),"nome_produto": nome,"novo_estoque": novo_estoque})

    # ATUALIZA ESTATISTICAS DO ESTORNO
    await manager.broadcast_to_loja(
        str(loja_id),
        {
            "tipo": "stats.updated",
            "valor_venda": -float(valor_estornado),
            "total_itens": -total_itens_estornados,
            "acao": "remove"
        }
    )

    # 4. LANÇA ESTORNO NO CAIXA
    if valor_estornado > 0:
        try:
            hoje = date.today() # <- ADICIONADO
            # BUSCAR CAIXA ABERTO DE HOJE
            stmt_caixa = select(Caixa).where(
                and_(
                    Caixa.loja_id == loja_id,
                    Caixa.status == StatusCaixa.ABERTO,
                    func.date(Caixa.data_caixa) == hoje # <- ADICIONADO
                )
            )
            result_caixa = await db.execute(stmt_caixa)
            caixa_aberto = result_caixa.scalar_one_or_none()

            logger.info(f"[ESTORNO] Caixa encontrado: {caixa_aberto.id if caixa_aberto else 'NENHUM'}") # <- LOG

            if not caixa_aberto:
                logger.warning(f"AVISO CAIXA: Nenhum caixa aberto HOJE para estorno {id}") # <- LOG
                raise HTTPException(status_code=400, detail="Nenhum caixa aberto para registrar o estorno")

            await registrar_movimento_caixa(
                db=db,
                caixa_id=UUID(str(caixa_aberto.id)), # type: ignore
                loja_id=loja_id,
                tipo=TipoMovimentacao.SAIDA,
                valor=valor_estornado,
                descricao=f"Estorno Venda #{str(id)[:8]}",
                usuario_id=current_user.id,
                referencia_id=id,
                referencia_tipo='estorno',
                forma_pagamento=None # <- estorno não tem forma
            )
            await db.commit()
            await manager.broadcast_to_loja(str(loja_id), {"tipo": "caixa.updated"})
        except HTTPException as e:
            await db.rollback()
            logger.error(f"AVISO CAIXA ESTORNO: {e.detail}") # <- troquei print por logger
        except Exception as e:
            await db.rollback()
            logger.error(f"ERRO AO LANÇAR ESTORNO NO CAIXA: {e}", exc_info=True)

    return None
