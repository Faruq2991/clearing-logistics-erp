"""add composite unique constraint on vin and owner_id

Revision ID: 6c52209db543
Revises: 8afb374ee904
Create Date: 2026-02-18 10:18:35.127696

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c52209db543'
down_revision: Union[str, Sequence[str], None] = '8afb374ee904'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('vehicles') as batch_op:
        batch_op.drop_index('ix_vehicles_vin')
        batch_op.create_index('ix_vehicles_vin', ['vin'], unique=False)
        batch_op.create_unique_constraint('uq_vin_owner', ['vin', 'owner_id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('vehicles') as batch_op:
        batch_op.drop_constraint('uq_vin_owner', type_='unique')
        batch_op.drop_index('ix_vehicles_vin')
        batch_op.create_index('ix_vehicles_vin', ['vin'], unique=1)
