"""add server_default to clientes.updated_at

Revision ID: edf8ed5ac175
Revises: 4f61470edc5e
Create Date: 2026-08-17 08:10:03.416525

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'edf8ed5ac175'
down_revision: Union[str, Sequence[str], None] = '4f61470edc5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('clientes', 'updated_at',
               existing_type=sa.DateTime(timezone=True),
               server_default=sa.func.now(),
               existing_nullable=False)

def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('clientes', 'updated_at',
               existing_type=sa.DateTime(timezone=True),
               server_default=None,
               existing_nullable=False)
