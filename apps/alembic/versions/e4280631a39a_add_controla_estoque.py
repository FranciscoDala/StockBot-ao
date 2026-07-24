"""add controla_estoque

Revision ID: e4280631a39a
Revises: f518a275c156
Create Date: 2026-07-24 08:59:56.850645

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4280631a39a'
down_revision: Union[str, Sequence[str], None] = 'f518a275c156'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('produtos', sa.Column('controla_estoque', sa.Boolean(), server_default='true', nullable=False))

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('produtos', 'controla_estoque')
