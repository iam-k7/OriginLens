import base64
import io
import struct
import zlib

import httpx
import pytest
from PIL import Image, ImageCms

from app.core.errors import AppError
from app.services import ai_signals, metadata, sanitize, url_fetch
from app.services.containers import REMOVABLE
from app.services.image_validation import validate_image
from tests.conftest import jpeg_with_gps


def _pixels(data: bytes) -> bytes:
    return Image.open(io.BytesIO(data)).tobytes()


def test_validate_rejects_svg_and_spoofed_files():
    with pytest.raises(AppError) as e:
        validate_image(b"<svg xmlns='http://www.w3.org/2000/svg'><script/></svg>", 10**6, 10**7)
    assert e.value.code == "svg_not_supported"
    with pytest.raises(AppError) as e:
        validate_image(b"\x89PNG\r\n\x1a\nnot really a png", 10**6, 10**7)
    assert e.value.code == "corrupt_image"
    with pytest.raises(AppError) as e:
        validate_image(jpeg_with_gps(), 100, 10**7)
    assert e.value.code == "file_too_large"


def test_metadata_reads_gps_and_camera():
    meta = metadata.inspect(jpeg_with_gps(), "JPEG")
    assert meta["highlights"]["camera_make"] == "Canon"
    assert meta["highlights"]["gps"] == {"latitude": 12.967083, "longitude": 77.594444}
    assert meta["comment"] == "secret note"


@pytest.mark.parametrize("fmt", ["JPEG", "PNG", "WEBP"])
def test_clean_gps_only_is_lossless(fmt):
    src = jpeg_with_gps()
    if fmt != "JPEG":
        buf = io.BytesIO()
        img = Image.open(io.BytesIO(src))
        img.save(buf, fmt, exif=img.getexif(), **({"lossless": True} if fmt == "WEBP" else {}))
        src = buf.getvalue()
    out, removed = sanitize.clean(src, fmt, ["gps"])
    after = metadata.inspect(out, fmt)
    assert after["highlights"]["gps"] is None
    assert after["highlights"]["camera_make"] == "Canon"  # other EXIF kept
    assert {r["category"] for r in removed} == {"gps"}
    assert _pixels(out) == _pixels(src)


def test_clean_all_removes_everything_and_keeps_icc():
    profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    img = Image.open(io.BytesIO(jpeg_with_gps()))
    buf = io.BytesIO()
    img.save(buf, "JPEG", exif=img.getexif(), icc_profile=profile, quality=90)
    src = buf.getvalue()
    out, _ = sanitize.clean(src, "JPEG", list(REMOVABLE))
    after = metadata.inspect(out, "JPEG")
    assert after["exif"] == {} and after["comment"] is None
    assert after["color"]["icc_profile"] is not None
    assert _pixels(out) == _pixels(src)


def test_clean_rejects_unknown_category():
    with pytest.raises(AppError):
        sanitize.clean(jpeg_with_gps(), "JPEG", ["icc"])


def _png_with_text(key: str, value: str) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (512, 512)).save(buf, "PNG")
    data = buf.getvalue()
    chunk = key.encode() + b"\x00" + value.encode()
    tex = struct.pack(">I", len(chunk)) + b"tEXt" + chunk + struct.pack(">I", zlib.crc32(b"tEXt" + chunk))
    return data[:33] + tex + data[33:]


def test_ai_signals_never_scores_and_reads_sd_parameters():
    data = _png_with_text("parameters", "a cat, Steps: 20, Sampler: Euler a")
    meta = metadata.inspect(data, "PNG")
    out = ai_signals.analyze(meta, {"present": False, "manifest": None})
    assert out["detector"]["score"] is None
    assert out["verdict"] == "declared_ai"
    camera = ai_signals.analyze(metadata.inspect(jpeg_with_gps(), "JPEG"), {"present": False})
    assert camera["verdict"] == "camera_indicators" and camera["confidence"] == "low"


def test_ai_signals_reads_generator_from_claim_generator_info():
    meta = metadata.inspect(_png_with_text("Comment", "hello"), "PNG")
    c2pa = {"present": True, "manifest": {"claim_generator": None, "claim_generator_info": [{"name": "ChatGPT"}]}}
    out = ai_signals.analyze(meta, c2pa)
    assert any(e["signal"] == "Generator tool" for e in out["evidence"])
    assert out["verdict"] == "ai_indicators"


@pytest.mark.parametrize("url", ["http://127.0.0.1/x.png", "http://169.254.169.254/latest", "http://10.0.0.1/a",
                                 "http://[::1]/a", "file:///etc/passwd", "http://example.com:8080/a.png",
                                 "http://user:pw@example.com/a.png", "gopher://example.com/"])
def test_ssrf_blocked(url):
    with pytest.raises(AppError):
        url_fetch.fetch_image(url, 10**6, 2, 2)


def test_ssrf_redirect_to_private_blocked(monkeypatch):
    monkeypatch.setattr(url_fetch, "resolve_public_ip",
                        lambda host, port: (_ for _ in ()).throw(AppError(422, "url_blocked", "x"))
                        if host == "internal.test" else "93.184.216.34")

    def handler(req: httpx.Request):
        assert req.headers["host"] == "example.com"  # pinned IP, original Host header
        return httpx.Response(302, headers={"location": "http://internal.test/secret"})

    with pytest.raises(AppError) as e:
        url_fetch.fetch_image("http://example.com/a.png", 10**6, 2, 3, transport=httpx.MockTransport(handler))
    assert e.value.code == "url_blocked"


def test_api_clean_roundtrip(client):
    src = jpeg_with_gps()
    r = client.post("/api/images/clean", files={"file": ("p.jpg", src, "image/jpeg")}, data={"categories": "gps"})
    assert r.status_code == 200, r.text
    body = r.json()
    out = base64.b64decode(body["file"]["base64"])
    assert body["after"]["highlights"]["gps"] is None and body["before"]["highlights"]["gps"]
    assert _pixels(out) == _pixels(src)
    assert r.headers["x-content-type-options"] == "nosniff"


def test_api_analyze_and_errors(client):
    r = client.post("/api/images/analyze", files={"file": ("p.jpg", jpeg_with_gps(), "image/jpeg")})
    assert r.status_code == 200 and r.json()["c2pa"]["present"] is False
    r = client.post("/api/images/analyze", files={"file": ("x.png", b"nope", "image/png")})
    assert r.status_code == 415 and r.json()["error"]["code"] == "unsupported_format"
    assert r.json()["error"]["request_id"]


def test_no_daily_image_limit(client):
    codes = [client.post("/api/images/analyze", files={"file": ("p.jpg", jpeg_with_gps(), "image/jpeg")}).status_code
             for _ in range(12)]
    assert codes == [200] * 12  # the old anonymous cap was 10 a day
