import io
import os
import time

import fakeredis
import jwt
import pytest
from PIL import Image

os.environ.update(
    DATABASE_URL="sqlite:///./test.db",
    SUPABASE_JWT_SECRET="test-secret-for-hs256-at-least-32-bytes!!",
    FX_API_URL="",
    OPENROUTER_API_KEY="",
    GROQ_API_KEY="",
)

from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.ratelimit import get_redis  # noqa: E402
from app.db.models import Base  # noqa: E402
from app.db.session import get_engine  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture()
def app():
    engine = get_engine()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    application = create_app()
    r = fakeredis.FakeRedis()
    application.dependency_overrides[get_redis] = lambda: r
    yield application


@pytest.fixture()
def client(app):
    return TestClient(app)


def token(sub: str = "11111111-1111-1111-1111-111111111111", email: str = "a@example.com") -> str:
    return jwt.encode({"sub": sub, "email": email, "aud": "authenticated", "exp": int(time.time()) + 600},
                      get_settings().supabase_jwt_secret, algorithm="HS256")


def jpeg_with_gps() -> bytes:
    ex = Image.Exif()
    ex[0x010F], ex[0x0110], ex[0x0131] = "Canon", "EOS R5", "Lightroom"
    gps = ex.get_ifd(0x8825)
    gps.update({1: "N", 2: (12.0, 58.0, 1.5), 3: "E", 4: (77.0, 35.0, 40.0)})
    sub = ex.get_ifd(0x8769)
    sub.update({0x829A: 0.01, 0x829D: 2.8})  # ExposureTime, FNumber
    buf = io.BytesIO()
    Image.new("RGB", (64, 48), (200, 100, 50)).save(buf, "JPEG", exif=ex, comment=b"secret note")
    return buf.getvalue()
