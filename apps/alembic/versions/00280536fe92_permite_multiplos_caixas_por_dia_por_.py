"""permite multiplos caixas por dia por loja

Revision ID: 00280536fe92
Revises: c443d29cdb7a
Create Date: 2026-07-23 11:04:27.501510

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '00280536fe92'
down_revision: Union[str, Sequence[str], None] = 'c443d29cdb7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # Remove a constraint que só deixava 1 caixa por loja por dia
    op.drop_constraint('uq_caixa_loja_dia', 'caixa', type_='unique')

def downgrade() -> None:
    """Downgrade schema."""
    # Se precisar voltar atrás, recria a constraint
    op.create_unique_constraint('uq_caixa_loja_dia', 'caixa', ['loja_id', 'data_caixa'])
