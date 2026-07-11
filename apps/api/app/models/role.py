from __future__ import annotations
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DONO = "DONO"
    GERENTE = "GERENTE"
    VENDEDOR = "VENDEDOR"
    CAIXA = "CAIXA"
    ESTOQUISTA = "ESTOQUISTA"
    MULTI_LOJA = "MULTI_LOJA" # <- ADICIONA ISSO

    @classmethod
    def _missing_(cls, value):
        # aceita maiusculo e minusculo
        for member in cls:
            if member.value.lower() == str(value).lower():
                return member
        return None
