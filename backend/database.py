import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()


def _normalize_database_url(url: str) -> str:
    """Railway / Neon URLs: ensure postgresql scheme; public proxy often needs SSL."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if "sslmode=" not in url and (
        "rlwy.net" in url or "neon.tech" in url or "supabase.co" in url
    ):
        url = url + ("&" if "?" in url else "?") + "sslmode=require"
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL")
    or os.getenv("DATABASE_PUBLIC_URL")
    or "sqlite:///./hackai_dev.db"
)

# On Railway, never silently use SQLite — it hides miswired env vars and looks like an "empty" cloud DB.
_is_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"))
if _is_railway and DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "DATABASE_URL is missing or still set to SQLite on Railway. "
        "On the MapScribe service, set DATABASE_URL from Postgres (use Variable Reference "
        "to the Postgres plugin's DATABASE_URL)."
    )

# connect_args only needed for SQLite (for local dev without Docker)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=not DATABASE_URL.startswith("sqlite"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Add new columns to existing tables (safe to run multiple times)."""
    with engine.connect() as conn:
        if conn.dialect.name == "sqlite":
            r = conn.execute(text("PRAGMA table_info(nodes)"))
            cols = [row[1] for row in r.fetchall()]
            if "goal_id" not in cols:
                conn.execute(text("ALTER TABLE nodes ADD COLUMN goal_id INTEGER"))
                conn.commit()
            r = conn.execute(text("PRAGMA table_info(user_goals)"))
            cols = [row[1] for row in r.fetchall()]
            if "goal_id" not in cols:
                conn.execute(text("ALTER TABLE user_goals ADD COLUMN goal_id INTEGER"))
                conn.commit()
        else:
            has_nodes = conn.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'nodes'
                    """
                )
            ).fetchone()
            if not has_nodes:
                return
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'nodes' AND column_name = 'goal_id'
            """))
            if r.fetchone() is None:
                conn.execute(text("ALTER TABLE nodes ADD COLUMN goal_id INTEGER REFERENCES learning_goals(id) ON DELETE CASCADE"))
                conn.commit()
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'user_goals' AND column_name = 'goal_id'
            """))
            if r.fetchone() is None:
                conn.execute(text("ALTER TABLE user_goals ADD COLUMN goal_id INTEGER REFERENCES learning_goals(id) ON DELETE SET NULL"))
                conn.commit()