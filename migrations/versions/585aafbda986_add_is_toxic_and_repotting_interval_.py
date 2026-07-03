from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '585aafbda986'
down_revision: Union[str, Sequence[str], None] = 'a1ee3780092b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_plant', sa.Column('repotting_interval_months', sa.Integer(), nullable=True))
    op.add_column('user_plant', sa.Column('is_toxic', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('user_plant', 'is_toxic')
    op.drop_column('user_plant', 'repotting_interval_months')
