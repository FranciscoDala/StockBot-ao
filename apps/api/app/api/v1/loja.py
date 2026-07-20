from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
import re
import unicodedata
from datetime import datetime

from app.db.session import get_db
from app.models.loja import Loja
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.schemas.loja import LojaDetailOut, LojaCreateIn, LojaUpdateIn, DonoOut, DonoUpdateIn, GerenteOut
from app.schemas.usuario_loja import UsuarioLojaCreateIn, UsuarioLojaUpdateIn, UsuarioLojaOut
from app.core.deps import get_current_admin, get_current_user, get_current_user_temp, verificar_acesso_loja
from app.core.security import verify_password, get_password_hash
from app.crud import loja as crud_loja

router = APIRouter()

class AdminAuth(BaseModel):
    senha_admin: str = Field(..., min_length=1)

class AcaoSensivelAuth(BaseModel):
    senha_dono: str = Field(..., min_length=1)

class LojaUpdateInWithAuth(LojaUpdateIn, AdminAuth):
    dono: Optional[DonoUpdateIn] = None

class DonoUpdateInWithAuth(DonoUpdateIn, AdminAuth):
    pass

# NOVO: Schema para salvar só aparência
class LojaDefinicoesUpdate(BaseModel):
    theme: Optional[str] = None
    card_style: Optional[str] = None
    card_size: Optional[str] = None
    font_size: Optional[str] = None
    cor_primaria: Optional[str] = None
    cor_fundo: Optional[str] = None

    @field_validator('cor_primaria', 'cor_fundo', check_fields=False)
    @classmethod
    def normalize_hex(cls, v: Optional[str]) -> Optional[str]:
        if v is None: return v
        v = v.strip()
        # Aceita #000 e converte pra #000
        if re.match(r'^#[0-9a-fA-F]{3}$', v):
            v = '#' + ''.join([c*2 for c in v[1:]])
        if not re.match(r'^#[0-9a-fA-F]{6}$', v):
            raise ValueError('Cor deve estar no formato #rrggbb')
        return v.lower()

def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

async def get_admin_db(db: AsyncSession, admin_token: dict | object) -> Usuario:
    admin_email_raw = admin_token.get("email") if isinstance(admin_token, dict) else getattr(admin_token, "email", None)
    admin_sub_raw = admin_token.get("sub") if isinstance(admin_token, dict) else getattr(admin_token, "sub", None)
    admin_db = None
    if admin_email_raw:
        admin_email_clean = admin_email_raw.lower().strip()
        stmt = select(Usuario).where(func.lower(func.trim(Usuario.email)) == admin_email_clean)
        admin_db = (await db.execute(stmt)).scalar_one_or_none()
        if admin_db: return admin_db
    if admin_sub_raw:
        try:
            admin_id = UUID(admin_sub_raw)
            stmt = select(Usuario).where(Usuario.id == admin_id)
            admin_db = (await db.execute(stmt)).scalar_one_or_none()
            if admin_db: return admin_db
        except ValueError: pass
    raise HTTPException(status_code=403, detail="Admin não encontrado no DB")

async def verify_admin_password(db: AsyncSession, admin_token: dict | object, senha: str):
    if not senha: raise HTTPException(status_code=403, detail="Senha não informada")
    admin_db = await get_admin_db(db, admin_token)
    if not verify_password(senha, admin_db.senha_hash): raise HTTPException(status_code=403, detail="Senha do ADMIN incorreta")

async def get_dono_loja(db: AsyncSession, loja_id: UUID) -> tuple[Usuario | None, UsuarioLoja | None]:
    stmt = (select(Usuario, UsuarioLoja).join(UsuarioLoja, UsuarioLoja.usuario_id == Usuario.id).where(UsuarioLoja.loja_id == loja_id).where(UsuarioLoja.role == UserRole.DONO).where(UsuarioLoja.is_active == True))
    res = (await db.execute(stmt)).first()
    return (res[0], res[1]) if res else (None, None)

def map_usuario_to_gerente_out(usuario: Usuario | None, membro: UsuarioLoja | None) -> GerenteOut | None:
    if not usuario: return None
    return GerenteOut(id=usuario.id, nome=usuario.nome, email=usuario.email, is_active=usuario.is_active, is_superuser=usuario.is_superuser, criado_em=usuario.created_at, telefone=usuario.telefone)

def map_usuario_loja_out(usuario: Usuario, membro: UsuarioLoja) -> UsuarioLojaOut:
    return UsuarioLojaOut(id=usuario.id, nome=usuario.nome, email=usuario.email, telefone=usuario.telefone, role=membro.role, is_active=membro.is_active, loja_id=membro.loja_id)

@router.get("", response_model=List[LojaDetailOut])
async def listar_lojas(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    lojas = (await db.execute(select(Loja).order_by(Loja.nome))).scalars().all()
    out = []
    for l in lojas:
        dono, membro = await get_dono_loja(db, l.id)
        count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == l.id, UsuarioLoja.is_active == True)
        total = (await db.execute(count_stmt)).scalar_one()
        out.append(LojaDetailOut(
            id=l.id, nome=l.nome, slug=l.slug, is_active=l.is_active, created_at=l.created_at,
            endereco=l.endereco, nif=l.nif, telefone=l.telefone, logo_url=l.logo_url,
            theme=l.theme, card_style=l.card_style, card_size=l.card_size, font_size=l.font_size,
            cor_primaria=l.cor_primaria, cor_fundo=l.cor_fundo,
            gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
        ))
    return out

@router.get("/donos", response_model=List[DonoOut])
async def listar_donos(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    stmt = select(Usuario).join(UsuarioLoja).where(UsuarioLoja.role == UserRole.DONO, UsuarioLoja.is_active == True, Usuario.is_active == True).order_by(Usuario.nome).distinct()
    donos = (await db.execute(stmt)).scalars().all()
    return [DonoOut.model_validate(d) for d in donos]

@router.get("/minhas")
async def listar_minhas_lojas(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.is_superuser:
        return []
    stmt = select(Loja).join(UsuarioLoja).where(UsuarioLoja.usuario_id == current_user.id, UsuarioLoja.is_active == True, Loja.is_active == True).order_by(Loja.nome)
    result = await db.execute(stmt)
    lojas = result.scalars().all()
    return [{"id": str(l.id), "nome": l.nome, "slug": l.slug, "is_active": l.is_active, "created_at": l.created_at} for l in lojas]

@router.get("/minhas-temp")
async def listar_minhas_lojas_temp(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user_temp)):
    if current_user.is_superuser:
        stmt = select(Loja).order_by(Loja.nome)
    else:
        stmt = select(Loja).join(UsuarioLoja).where(UsuarioLoja.usuario_id == current_user.id).order_by(Loja.nome)
    result = await db.execute(stmt)
    lojas = result.scalars().all()
    lojas_out = []
    for l in lojas:
        membro = (await db.execute(select(UsuarioLoja).where(UsuarioLoja.loja_id == l.id, UsuarioLoja.usuario_id == current_user.id))).scalar_one_or_none()
        lojas_out.append({
            "id": str(l.id), "nome": l.nome, "slug": l.slug, "is_active": l.is_active, "created_at": l.created_at,
            "endereco": l.endereco, "role": membro.role.value if membro else "dono"
        })
    return lojas_out

@router.get("/id/{loja_id}", response_model=LojaDetailOut)
async def get_loja_by_id(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    loja = await db.get(Loja, loja_id)
    if not loja or loja.deleted_at: raise HTTPException(status_code=404, detail="Loja não encontrada")
    await verificar_acesso_loja(loja.id, db, current_user)
    dono, membro = await get_dono_loja(db, loja.id)
    count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == loja.id, UsuarioLoja.is_active == True)
    total = (await db.execute(count_stmt)).scalar_one()
    return LojaDetailOut(
        id=loja.id, nome=loja.nome, slug=loja.slug, is_active=loja.is_active, created_at=loja.created_at,
        endereco=loja.endereco, nif=loja.nif, telefone=loja.telefone, logo_url=loja.logo_url,
        theme=loja.theme, card_style=loja.card_style, card_size=loja.card_size, font_size=loja.font_size,
        cor_primaria=loja.cor_primaria, cor_fundo=loja.cor_fundo,
        gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
    )

@router.get("/{slug}", response_model=LojaDetailOut)
async def get_loja_by_slug(slug: str, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    loja = (await db.execute(select(Loja).where(Loja.slug == slug))).scalar_one_or_none()
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")
    await verificar_acesso_loja(loja.id, db, current_user)
    dono, membro = await get_dono_loja(db, loja.id)
    count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == loja.id, UsuarioLoja.is_active == True)
    total = (await db.execute(count_stmt)).scalar_one()
    return LojaDetailOut(
        id=loja.id, nome=loja.nome, slug=loja.slug, is_active=loja.is_active, created_at=loja.created_at,
        endereco=loja.endereco, nif=loja.nif, telefone=loja.telefone, logo_url=loja.logo_url,
        theme=loja.theme, card_style=loja.card_style, card_size=loja.card_size, font_size=loja.font_size,
        cor_primaria=loja.cor_primaria, cor_fundo=loja.cor_fundo,
        gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
    )

@router.post("", response_model=LojaDetailOut, status_code=status.HTTP_201_CREATED)
async def criar_loja(body: LojaCreateIn, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    slug_clean = slugify(body.slug)
    if (await db.execute(select(Loja).where(Loja.slug == slug_clean))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Slug '{slug_clean}' já existe")
    email_para_validar = None
    if body.dono_novo:
        email_para_validar = body.dono_novo.email.lower().strip()
        dono_existente = (await db.execute(select(Usuario).where(func.lower(func.trim(Usuario.email)) == email_para_validar))).scalar_one_or_none()
        if dono_existente:
            raise HTTPException(status_code=400, detail=f"Email '{body.dono_novo.email}' já cadastrado")
    try:
        body.slug = slug_clean
        if not body.cor_primaria: body.cor_primaria = "#057418"
        if not body.cor_fundo: body.cor_fundo = "#000000"
        if not body.theme: body.theme = "dark"
        if not body.card_style: body.card_style = "padrao"
        if not body.card_size: body.card_size = "medio"
        if not body.font_size: body.font_size = "medio"

        loja = await crud_loja.create_loja(db=db, loja_in=body)
    except IntegrityError as e:
        await db.rollback()
        erro_original = str(e.orig).lower()
        print(f"INTEGRITY ERROR AO CRIAR LOJA: {e.orig}")
        if "usuarios_email_key" in erro_original: raise HTTPException(status_code=400, detail="Email do dono já cadastrado")
        if "lojas_slug_key" in erro_original: raise HTTPException(status_code=400, detail="Slug já existe")
        if "usuarios_telefone_key" in erro_original: raise HTTPException(status_code=400, detail="Telefone já cadastrado")
        raise HTTPException(status_code=400, detail=f"Erro de integridade no banco: {e.orig}")
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        print(f"ERRO INESPERADO AO CRIAR LOJA: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao criar loja")
    dono, membro = await get_dono_loja(db, loja.id)
    count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == loja.id, UsuarioLoja.is_active == True)
    total = (await db.execute(count_stmt)).scalar_one()
    return LojaDetailOut(
        id=loja.id, nome=loja.nome, slug=loja.slug, is_active=loja.is_active, created_at=loja.created_at,
        endereco=loja.endereco, nif=loja.nif, telefone=loja.telefone, logo_url=loja.logo_url,
        theme=loja.theme, card_style=loja.card_style, card_size=loja.card_size, font_size=loja.font_size,
        cor_primaria=loja.cor_primaria, cor_fundo=loja.cor_fundo,
        gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
    )

@router.patch("/{loja_id}", response_model=LojaDetailOut)
async def atualizar_loja(loja_id: UUID, body: LojaUpdateInWithAuth, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    if not current_user.is_superuser:
        body.senha_admin = None
        body.dono = None
    else:
        await verify_admin_password(db, current_user, body.senha_admin)
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")
    try:
        loja_data = body.model_dump(exclude_unset=True, exclude={"senha_admin", "dono"})
        if "slug" in loja_data and loja_data["slug"]!= loja.slug:
            if (await db.execute(select(Loja).where(Loja.slug == loja_data["slug"]))).scalar_one_or_none(): raise HTTPException(status_code=400, detail="Slug já existe")
        for field, value in loja_data.items(): setattr(loja, field, value)
        if body.dono and current_user.is_superuser:
            dono, membro = await get_dono_loja(db, loja_id)
            if not dono or not membro: raise HTTPException(status_code=404, detail="Dono da loja não encontrado para atualizar")
            dono_data = body.dono.model_dump(exclude_unset=True)
            if "email" in dono_data:
                stmt = select(Usuario).where(Usuario.email == dono_data["email"], Usuario.id!= dono.id)
                if (await db.execute(stmt)).scalar_one_or_none(): raise HTTPException(status_code=400, detail="Email do dono já cadastrado para outro usuário")
                dono.email = dono_data["email"]
            if "nome" in dono_data: dono.nome = dono_data["nome"]
            if "telefone" in dono_data: dono.telefone = dono_data["telefone"]
            db.add(dono)
        db.add(loja)
        await db.commit()
        await db.refresh(loja)
        if body.dono and current_user.is_superuser: await db.refresh(dono)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar: {e}")
    dono, membro = await get_dono_loja(db, loja_id)
    count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == loja.id, UsuarioLoja.is_active == True)
    total = (await db.execute(count_stmt)).scalar_one()
    return LojaDetailOut(
        id=loja.id, nome=loja.nome, slug=loja.slug, is_active=loja.is_active, created_at=loja.created_at,
        endereco=loja.endereco, nif=loja.nif, telefone=loja.telefone, logo_url=loja.logo_url,
        theme=loja.theme, card_style=loja.card_style, card_size=loja.card_size, font_size=loja.font_size,
        cor_primaria=loja.cor_primaria, cor_fundo=loja.cor_fundo,
        gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
    )

# NOVO: ROTA PARA SALVAR APARÊNCIA
@router.patch("/{loja_id}/definicoes", response_model=LojaDetailOut)
async def atualizar_definicoes_loja(
    loja_id: UUID,
    body: LojaDefinicoesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")

    try:
        update_data = body.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(loja, field, value)
        db.add(loja)
        await db.commit()
        await db.refresh(loja)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar definições: {e}")

    dono, membro = await get_dono_loja(db, loja_id)
    count_stmt = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.loja_id == loja.id, UsuarioLoja.is_active == True)
    total = (await db.execute(count_stmt)).scalar_one()
    return LojaDetailOut(
        id=loja.id, nome=loja.nome, slug=loja.slug, is_active=loja.is_active, created_at=loja.created_at,
        endereco=loja.endereco, nif=loja.nif, telefone=loja.telefone, logo_url=loja.logo_url,
        theme=loja.theme, card_style=loja.card_style, card_size=loja.card_size, font_size=loja.font_size,
        cor_primaria=loja.cor_primaria, cor_fundo=loja.cor_fundo,
        gerente=map_usuario_to_gerente_out(dono, membro), total_funcionarios=total
    )

@router.patch("/{loja_id}/dono", response_model=GerenteOut)
async def atualizar_dono_loja(loja_id: UUID, body: DonoUpdateInWithAuth, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    await verify_admin_password(db, admin, body.senha_admin)
    dono, membro = await get_dono_loja(db, loja_id)
    if not dono or not membro: raise HTTPException(status_code=404, detail="Dono da loja não encontrado")
    update_data = body.model_dump(exclude_unset=True, exclude={"senha_admin"})
    if "email" in update_data:
        stmt = select(Usuario).where(Usuario.email == update_data["email"], Usuario.id!= dono.id)
        if (await db.execute(stmt)).scalar_one_or_none(): raise HTTPException(status_code=400, detail="Email já cadastrado para outro usuário")
        dono.email = update_data["email"]
    if "nome" in update_data: dono.nome = update_data["nome"]
    if "telefone" in update_data: dono.telefone = update_data["telefone"]
    db.add(dono)
    await db.commit()
    await db.refresh(dono)
    return map_usuario_to_gerente_out(dono, membro)

@router.delete("/{loja_id}", status_code=204)
async def apagar_loja(loja_id: UUID, body: AdminAuth, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    await verify_admin_password(db, admin, body.senha_admin) # 👈 tu esqueceu o 'admin' aqui
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")

    try:
        membros_stmt = select(UsuarioLoja).where(UsuarioLoja.loja_id == loja_id)
        membros_da_loja = (await db.execute(membros_stmt)).scalars().all()
        donos_da_loja = [m for m in membros_da_loja if m.role == UserRole.DONO]
        ids_donos = {m.usuario_id for m in donos_da_loja}

        for m in membros_da_loja: await db.delete(m)
        await db.delete(loja)

        for user_id in ids_donos:
            usuario = await db.get(Usuario, user_id)
            if not usuario or usuario.is_superuser: continue
            stmt_count = select(func.count()).select_from(UsuarioLoja).where(UsuarioLoja.usuario_id == user_id, UsuarioLoja.role == UserRole.DONO, UsuarioLoja.is_active == True)
            total_lojas_dono = (await db.execute(stmt_count)).scalar_one()
            if total_lojas_dono <= 1: await db.delete(usuario)

        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"ERRO DELETE LOJA: {e}") # 👈 log pra ver no railway
        raise HTTPException(status_code=500, detail=f"Erro ao apagar loja: {e}")
