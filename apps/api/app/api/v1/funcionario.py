from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from  app.db.session import get_db
from  app.models.usuario import Usuario
from  app.models.usuario_loja import UsuarioLoja, Role
from  app.schemas.funcionario import FuncionarioCreate, FuncionarioRead # <- IMPORTA DO SCHEMA
from  app.core.deps import require_role, get_current_loja_id
from  app.core.security import get_password_hash

router = APIRouter()

# ROTA: GET /funcionarios
# LISTAR FUNCIONARIOS: Só dono/gerente pode listar da própria loja
@router.get("/", response_model=List[FuncionarioRead])
async def list_funcionarios(
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(Role.dono, Role.gerente))
):
    stmt = select(Usuario, UsuarioLoja).join(UsuarioLoja).where(
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.is_active == True
    )
    result = await db.execute(stmt)
    return [FuncionarioRead(
        id=u.id, nome=u.nome, email=u.email,
        role=ul.role, is_active=ul.is_active, loja_id=ul.loja_id
    ) for u, ul in result.all()]

# ROTA: POST /funcionarios
# CRIAR FUNCIONARIO: Só dono/gerente. Gerente só cria vendedor
@router.post("/", response_model=FuncionarioRead, status_code=status.HTTP_201_CREATED)
async def create_funcionario(
    f_in: FuncionarioCreate, # <- Usa schema separado
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(Role.dono, Role.gerente))
):
    current_role: Role = m["role"]
    if current_role == Role.gerente and f_in.role!= Role.vendedor:
        raise HTTPException(status_code=403, detail="gerente só pode criar vendedor")

    result = await db.execute(select(Usuario).where(Usuario.email == f_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="email já existe")

    novo_user = Usuario(nome=f_in.nome, email=f_in.email, senha_hash=get_password_hash(f_in.senha), is_active=True)
    db.add(novo_user)
    await db.flush()

    vinculo = UsuarioLoja(usuario_id=novo_user.id, loja_id=loja_id, role=f_in.role, is_active=True)
    db.add(vinculo)
    await db.commit()
    await db.refresh(novo_user)

    return FuncionarioRead(id=novo_user.id, nome=novo_user.nome, email=novo_user.email, role=vinculo.role, is_active=vinculo.is_active, loja_id=vinculo.loja_id)

# ROTA: DELETE /funcionarios/{id}
# APAGAR FUNCIONARIO: Só dono/gerente da mesma loja
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_funcionario(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(Role.dono, Role.gerente))
):
    stmt = select(UsuarioLoja).where(UsuarioLoja.usuario_id == id, UsuarioLoja.loja_id == loja_id)
    vinculo = (await db.execute(stmt)).scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="funcionario não encontrado nesta loja")

    if vinculo.usuario_id == m["user"].id:
        raise HTTPException(status_code=400, detail="você não pode se remover")
    if m["role"] == Role.gerente and vinculo.role in [Role.gerente, Role.dono]:
        raise HTTPException(status_code=403, detail="gerente não pode remover gerente ou dono")

    vinculo.is_active = False # Soft delete
    await db.commit()
    return
