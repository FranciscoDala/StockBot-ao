from __future__ import annotations
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"  # <-- ADICIONEI SÓ ISSO
    DONO = "dono"
    GERENTE = "gerente"
    VENDEDOR = "vendedor"
    CAIXA = "caixa"
    ESTOQUISTA = "estoquista"

    def __str__(self) -> str:
        return self.value
