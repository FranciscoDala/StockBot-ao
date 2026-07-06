from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from api.app.models.loja import Loja
from api.app.models.usuario import Usuario
from api.app.models.usuario_loja import UsuarioLoja
from api.app.models.role import UserRole # <- CORRIGIDO
from api.app.schemas.loja import LojaCreateIn
from api.app.core.security import get_password_hash

async def get_loja_by_slug(db: AsyncSession, *, slug: str) -> Loja | None:
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    return result.scalar_one_or_none()

async def create_loja(db: AsyncSession, *, loja_in: LojaCreateIn) -> Loja:
    if not loja_in.dono_existente_id and not loja_in.dono_novo:
        raise ValueError("Informe dono_existente_id ou dono_novo")
    if loja_in.dono_existente_id and loja_in.dono_novo:
        raise ValueError("Envie apenas dono_existente_id OU dono_novo, não os dois")

    usuario_id: UUID
    telefone_dono: str | None = None

    if loja_in.dono_novo:
        stmt = select(Usuario).where(Usuario.email == loja_in.dono_novo.email)
        usuario = (await db.execute(stmt)).scalar_one_or_none()
        if usuario:
            usuario_id = usuario.id
            telefone_dono = usuario.telefone
        else:
            usuario = Usuario(
                email=loja_in.dono_novo.email,
                nome=loja_in.dono_novo.nome,
                senha_hash=get_password_hash(loja_in.dono_novo.senha),
                is_active=True,
                telefone=loja_in.dono_novo.telefone
            )
            db.add(usuario)
            await db.flush()
            usuario_id = usuario.id
            telefone_dono = loja_in.dono_novo.telefone
    else:
        usuario_id = loja_in.dono_existente_id # type: ignore
        stmt = select(Usuario).where(Usuario.id == usuario_id)
        usuario = (await db.execute(stmt)).scalar_one_or_none()
        telefone_dono = usuario.telefone if usuario else None

    loja = Loja(nome=loja_in.nome, slug=loja_in.slug, endereco=loja_in.endereco, is_active=loja_in.is_active)
    db.add(loja)
    await db.flush()

    # CRIAR VINCULO EM usuario_loja
    usuario_loja = UsuarioLoja(
        usuario_id=usuario_id,
        loja_id=loja.id,
        role=UserRole.DONO, # <- CORRIGIDO
        telefone=telefone_dono,
        is_active=True
        # REMOVIDO: cargo="dono"  <- Não existe essa coluna
    )
    db.add(usuario_loja)

    await db.commit()
    await db.refresh(loja)
    return loja
