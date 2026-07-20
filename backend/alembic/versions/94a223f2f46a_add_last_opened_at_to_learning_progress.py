"""Add last_opened_at to learning_progress

Revision ID: 94a223f2f46a
Revises: c93c13310de3
Create Date: 2026-07-20 11:03:36.062684

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94a223f2f46a'
down_revision: Union[str, None] = 'c93c13310de3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('learning_progress', sa.Column('last_opened_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('learning_progress', 'last_opened_at')
