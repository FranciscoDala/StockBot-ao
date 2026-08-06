"""add modo and theme fields to lojas

Revision ID: ccc8116508e2
Revises: 7399e324d395
Create Date: 2026-08-06 08:33:47.324013

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'ccc8116508e2'
down_revision: Union[str, Sequence[str], None] = '7399e324d395'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

modoloja_enum = postgresql.ENUM('venda', 'cliente', 'completo', name='modoloja')

def upgrade() -> None:
    modoloja_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('lojas', sa.Column('modo', modoloja_enum, server_default='completo', nullable=False))

def downgrade() -> None:
    op.drop_column('lojas', 'modo')
    modoloja_enum.drop(op.get_bind(), checkfirst=True)
