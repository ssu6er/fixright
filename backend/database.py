import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from base import Base


def _build_url() -> str:
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    name = os.environ.get("DB_NAME")
    user = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASSWORD")

    missing = [key for key, value in {"DB_NAME": name, "DB_USER": user, "DB_PASSWORD": password}.items() if not value]
    if missing:
        raise RuntimeError(f"Missing env vars: {', '.join(missing)}")

    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"


engine = create_engine(
    _build_url(),
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def _migrate_bookings_table() -> None:
    statements = [
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS appliance_type VARCHAR(50)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ",
        "UPDATE bookings SET appliance_type = 'other' WHERE appliance_type IS NULL",
        "UPDATE bookings SET status = 'new' WHERE status IS NULL",
        "UPDATE bookings SET admin_notes = '' WHERE admin_notes IS NULL",
        "UPDATE bookings SET updated_at = created_at WHERE updated_at IS NULL",
        "ALTER TABLE bookings ALTER COLUMN appliance_type SET DEFAULT 'other'",
        "ALTER TABLE bookings ALTER COLUMN appliance_type SET NOT NULL",
        "ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'new'",
        "ALTER TABLE bookings ALTER COLUMN status SET NOT NULL",
        "ALTER TABLE bookings ALTER COLUMN admin_notes SET DEFAULT ''",
        "ALTER TABLE bookings ALTER COLUMN admin_notes SET NOT NULL",
        "ALTER TABLE bookings ALTER COLUMN updated_at SET DEFAULT NOW()",
        "ALTER TABLE bookings ALTER COLUMN updated_at SET NOT NULL",
        "CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)",
        "CREATE INDEX IF NOT EXISTS ix_bookings_appliance_type ON bookings (appliance_type)",
        "CREATE INDEX IF NOT EXISTS ix_bookings_email ON bookings (email)",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _migrate_bookings_table()
    print("[DB] Schema initialized")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
