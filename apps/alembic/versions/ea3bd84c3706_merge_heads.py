"""merge heads

Revision ID: ea3bd84c3706
Revises: 3adcd1cf9aca, 3b9a723532c6
Create Date: 2026-07-16 20:39:43.495714

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea3bd84c3706'
down_revision: Union[str, Sequence[str], None] = ('3adcd1cf9aca', '3b9a723532c6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
