from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.schemas.produto import ProdutoCreate, ProdutoOut, ProdutoUpdate # <- CORRIGIDO
from app.schemas.usuario import Role
from app.core.deps import get_current_user, require_role
from app.models.produto import Produto
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.models.loja import Loja
from app.models.usuario import Usuario # <- MOVI PRA CIMA
from app.core.security import verify_password
import qrcode
import io
import base64
import uuid
import random
import string

router = APIRouter()

class ProdutoCreateWithAuth(ProdutoCreate):
    senha_dono: str = Field(..., min_length=1)
    senha_confirmacao: str = Field(..., min_length=1)

class ProdutoUpdateWithAuth(ProdutoUpdate): # <- CORRIGIDO: herdava de si mesmo
    senha_dono: str = Field(..., min_length=1)
    senha_confirmacao: str = Field(..., min_length=1)

def gerar_ean13_interno(id: UUID) -> str:
    numeros = ''.join(filter(str.isdigit, str(id)))
    base_num = numeros[:5].zfill(5)
    base = f"2{base_num}"
    soma = 0
    for i, digito in enumerate(base):
        n = int(digito)
        soma += n * (3 if i % 2 else 1)
    digito_verificador = (10 - (soma % 10)) % 10
    return f"{base}{digito_verificador}"

def gerar_sku_aleatorio() -> str:
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"PROD-{random_part}"

def gerar_qr_code_base64(produto_id: UUID, sku: str, nome: str) -> str:
    dados = f'{{"id":"{produto_id}","sku":"{sku}","nome":"{nome}"}}'
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(dados)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

def to_schema(produto: Produto) -> ProdutoOut:
    return ProdutoOut(
        id=produto.id, loja_id=produto.loja_id, nome=produto.nome, descricao=produto.descricao,
        categoria_id=produto.categoria_id, marca=produto.marca, imagem_url=produto.imagem_url,
        sku=produto.sku, codigo_barras=produto.codigo_barras, codigo_qr=produto.codigo_qr, ncm=produto.ncm,
        preco=float(produto.preco_venda) if produto.preco_venda else 0.0, # <- CORRIGIDO
        preco_custo=float(produto.preco_compra) if produto.preco_compra else 0.0, # <- CORRIGIDO
        preco_promocao=float(produto.preco_promocao) if produto.preco_promocao else None,
        custo_medio=float(produto.custo_medio) if produto.custo_medio else 0.0,
        estoque=float(produto.estoque),
        estoque_minimo=float(produto.estoque_minimo),
        estoque_maximo=float(produto.estoque_maximo) if produto.estoque_maximo else None,
        unidade=produto.unidade, peso_kg=float(produto.peso_kg) if produto.peso_kg else None,
        fornecedor_id=produto.fornecedor_id, localizacao=produto.localizacao, is_active=produto.is_active,
        created_at=produto.created_at, updated_at=produto.updated_at, deleted_at=produto.deleted_at,
        margem_lucro=float(produto.margem_lucro) if produto.margem_lucro else 0.0
    )

async def verify_dono_password(db: AsyncSession, loja_id: UUID, senha_dono: str, senha_confirmacao: str):
    if not senha_dono or not senha_confirmacao: raise HTTPException(status_code=403, detail="Senha do dono não informada")
    if senha_dono!= senha_confirmacao: raise HTTPException(status_code=403, detail="Senha e confirmação não conferem")
    stmt = select(UsuarioLoja).where(UsuarioLoja.loja_id == loja_id, UsuarioLoja.role == UserRole.DONO)
    result = await db.execute(stmt)
    dono_loja = result.scalar_one_or_none()
    if not dono_loja: raise HTTPException(status_code=404, detail="Dono da loja não encontrado")
    usuario_dono = await db.get(Usuario, dono_loja.usuario_id)
    if not usuario_dono: raise HTTPException(status_code=404, detail="Usuário dono não encontrado")
    senha_hash = getattr(usuario_dono, "senha_hash", None)
    if not senha_hash or not verify_password(senha_dono, senha_hash): raise HTTPException(status_code=403, detail="Senha do dono incorreta")

async def get_produto_da_loja_or_404(db: AsyncSession, loja_id: UUID, produto_id: UUID) -> Produto:
    result = await db.execute(select(Produto).where(Produto.id == produto_id, Produto.loja_id == loja_id, Produto.deleted_at.is_(None)))
    produto = result.scalar_one_or_none()
    if not produto: raise HTTPException(status_code=404, detail="Produto não encontrado nesta loja")
    return produto

async def gerar_sku_unico(db: AsyncSession, loja_id: UUID) -> str:
    while True:
        sku = gerar_sku_aleatorio()
        existing = await db.execute(select(Produto).where(and_(Produto.loja_id == loja_id, Produto.sku == sku)))
        if not existing.scalar_one_or_none():
            return sku

@router.post("", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def criar_produto(produto: ProdutoCreateWithAuth, db: AsyncSession = Depends(get_db)):
    loja_id = produto.loja_id
    if not loja_id: raise HTTPException(status_code=400, detail="loja_id é obrigatório")

    await verify_dono_password(db, loja_id, produto.senha_dono, produto.senha_confirmacao)

    sku_final = await gerar_sku_unico(db, loja_id)

    codigo_barras_enviado = produto.codigo_barras.strip() if produto.codigo_barras else None
    if not codigo_barras_enviado:
        codigo_barras_final = gerar_ean13_interno(uuid.uuid4())
    else:
        existing = await db.execute(select(Produto).where(and_(Produto.loja_id == loja_id, Produto.codigo_barras == codigo_barras_enviado)))
        if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="Código de barras já cadastrado nesta loja")
        codigo_barras_final = codigo_barras_enviado

    payload = produto.model_dump(exclude={"senha_dono", "senha_confirmacao", "sku", "codigo_barras"})
    preco_venda = Decimal(str(payload.get("preco", 0)))
    preco_compra = Decimal(str(payload.get("preco_custo", 0)))

    novo = Produto(
        loja_id=loja_id, nome=payload.get("nome"), descricao=payload.get("descricao"),
        categoria_id=payload.get("categoria_id"), marca=payload.get("marca"), imagem_url=payload.get("imagem_url"),
        sku=sku_final, codigo_barras=codigo_barras_final, ncm=payload.get("ncm"),
        estoque=payload.get("estoque", 0), estoque_minimo=payload.get("estoque_minimo", 5),
        estoque_maximo=payload.get("estoque_maximo"), unidade=payload.get("unidade"),
        fornecedor_id=payload.get("fornecedor_id"), localizacao=payload.get("localizacao"),
        preco_venda=preco_venda, preco_compra=preco_compra,
        margem_lucro = 0 if preco_compra == 0 else ((preco_venda - preco_compra) / preco_compra) * 100,
        codigo_qr=None
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)

    if not codigo_barras_enviado:
        novo.codigo_barras = gerar_ean13_interno(novo.id)
    novo.codigo_qr = gerar_qr_code_base64(novo.id, novo.sku, novo.nome)

    await db.commit()
    await db.refresh(novo)
    return to_schema(novo)

@router.get("", response_model=list[ProdutoOut], dependencies=[Depends(get_current_user)])
async def listar_produtos(loja_id: UUID, db: AsyncSession = Depends(get_db)):
    if not loja_id: raise HTTPException(status_code=400, detail="loja_id é obrigatório na query")
    stmt = select(Produto).where(Produto.loja_id == loja_id, Produto.deleted_at.is_(None)).order_by(Produto.nome)
    result = await db.execute(stmt)
    produtos = result.scalars().all()
    return [to_schema(p) for p in produtos]

@router.get("/{produto_id}", response_model=ProdutoOut, dependencies=[Depends(get_current_user)])
async def buscar_produto(produto_id: UUID, loja_id: UUID, db: AsyncSession = Depends(get_db)):
    if not loja_id: raise HTTPException(status_code=400, detail="loja_id é obrigatório na query")
    produto = await get_produto_da_loja_or_404(db, loja_id, produto_id)
    return to_schema(produto)



@router.patch("/{produto_id}", response_model=ProdutoOut, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def atualizar_produto(produto_id: UUID, produto_update: ProdutoUpdateWithAuth, db: AsyncSession = Depends(get_db)):
    # PEGA O PRODUTO PRIMEIRO PRA SABER A LOJA
    produto_db = await db.get(Produto, produto_id)
    if not produto_db or produto_db.deleted_at:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    loja_id = produto_db.loja_id # <- CORRETO: pega do banco

    await verify_dono_password(db, loja_id, produto_update.senha_dono, produto_update.senha_confirmacao)
    produto_db = await get_produto_da_loja_or_404(db, loja_id, produto_id)

    print(f"\n--- PATCH PRODUTO {produto_id} ---")
    print(f"DB codigo: '{produto_db.codigo_barras}' | RECEBIDO: '{produto_update.codigo_barras}'")
    print(f"DB imagem: '{produto_db.imagem_url}' | RECEBIDO: '{produto_update.imagem_url}'")

    if produto_update.sku and produto_update.sku.strip() and produto_update.sku!= produto_db.sku:
        existing = await db.execute(select(Produto).where(and_(Produto.loja_id == loja_id, Produto.sku == produto_update.sku, Produto.id!= produto_id)))
        if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="SKU já cadastrado nesta loja")
        produto_db.sku = produto_update.sku

    codigo_recebido = produto_update.codigo_barras
    if codigo_recebido is not None and codigo_recebido.strip()!= "":
        codigo_novo = codigo_recebido.strip()
        if codigo_novo!= (produto_db.codigo_barras or ""):
            print(f"Validando novo codigo: {codigo_novo}")
            existing = await db.execute(select(Produto).where(and_(Produto.loja_id == loja_id, Produto.codigo_barras == codigo_novo, Produto.id!= produto_id)))
            if existing.scalar_one_or_none(): raise HTTPException(status_code=400, detail="Código de barras já cadastrado nesta loja")
            produto_db.codigo_barras = codigo_novo
            print("Codigo atualizado")
        else:
            print("Codigo igual, ignorado")
    else:
        print("Codigo veio vazio/null, ignorado")

    update_data = produto_update.model_dump(exclude_unset=True, exclude={"senha_dono", "senha_confirmacao", "sku"})

    if 'preco' in update_data: produto_db.preco_venda = Decimal(str(update_data.pop('preco')))
    if 'preco_custo' in update_data: produto_db.preco_compra = Decimal(str(update_data.pop('preco_custo')))

    for key, value in update_data.items():
        if key == 'imagem_url' and value == "":
            continue # <- não apaga imagem se vier vazio
        setattr(produto_db, key, value)

    if 'nome' in update_data or 'sku' in update_data:
        produto_db.codigo_qr = gerar_qr_code_base64(produto_db.id, produto_db.sku, produto_db.nome)

    produto_db.margem_lucro = 0 if produto_db.preco_compra == 0 else ((produto_db.preco_venda - produto_db.preco_compra) / produto_db.preco_compra) * 100

    await db.commit()
    await db.refresh(produto_db)
    print("--- FIM PATCH ---\n")
    return to_schema(produto_db)





@router.delete("/{produto_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_role(Role.DONO))])
async def apagar_produto(body: dict, produto_id: UUID, db: AsyncSession = Depends(get_db)):
    loja_id = body.get("loja_id")
    if not loja_id: raise HTTPException(status_code=400, detail="loja_id é obrigatório")
    await verify_dono_password(db, loja_id, body.get("senha_dono"), body.get("senha_dono"))
    produto_db = await get_produto_da_loja_or_404(db, loja_id, produto_id)
    produto_db.deleted_at = datetime.utcnow()
    await db.commit()
    return {"message": "Produto apagado com sucesso"}

@router.get("/publico/{sku}")
async def get_produto_publico(sku: str, db: AsyncSession = Depends(get_db)):
    stmt = (select(Produto).options(selectinload(Produto.loja)).where(Produto.sku == sku, Produto.deleted_at.is_(None), Produto.is_active == True))
    result = await db.execute(stmt)
    produto = result.scalar_one_or_none()
    if not produto: raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {
        "id": str(produto.id), "nome": produto.nome, "sku": produto.sku, "preco": float(produto.preco_venda),
        "preco_custo": float(produto.preco_compra), "estoque": float(produto.estoque), "unidade": produto.unidade,
        "marca": produto.marca, "descricao": produto.descricao, "imagem_url": produto.imagem_url,
        "loja_nome": produto.loja.nome if produto.loja else "Loja não informada"
    }
