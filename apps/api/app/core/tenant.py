from contextvars import ContextVar
from uuid import UUID

# ContextVar = Caixa segura. Cada request tem a sua. Não mistura.
current_loja_id: ContextVar = ContextVar("current_loja_id", default=None)

def get_current_loja_id() -> UUID | None:
    return current_loja_id.get()

def set_current_loja_id(loja_id: UUID):
    current_loja_id.set(loja_id)