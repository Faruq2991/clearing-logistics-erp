"""add_cost_fields_to_vehicle

Revision ID: 7cdfd87709e9
Revises: a9045a2d95ea
Create Date: 2026-02-15 12:29:23.071795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7cdfd87709e9'
down_revision: Union[str, Sequence[str], None] = 'a9045a2d95ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('agencies', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('examination', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('release', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('disc', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('gate', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('ciu', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('monitoring', sa.Float(), nullable=True))

    with op.batch_alter_table('financials', schema=None) as batch_op:
        batch_op.alter_column('vehicle_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.drop_column('monitoring')
        batch_op.drop_column('ciu')
        batch_op.drop_column('gate')
        batch_op.drop_column('disc')
        batch_op.drop_column('release')
        batch_op.drop_column('examination')
        batch_op.drop_column('agencies')

    with op.batch_alter_table('financials', schema=None) as batch_op:
        batch_op.alter_column('vehicle_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)
