import io
import warnings

from PIL import Image

from app.core.errors import AppError

MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp", "GIF": "image/gif"}


def sniff_format(data: bytes) -> str | None:
    """Identify the real format from magic bytes; never trust filename or Content-Type."""
    if data[:3] == b"\xff\xd8\xff":
        return "JPEG"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WEBP"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "GIF"
    return None


def _looks_like_svg(data: bytes) -> bool:
    head = data[:1024].lstrip().lower()
    return head.startswith(b"<svg") or (head.startswith(b"<?xml") and b"<svg" in data[:4096].lower())


def validate_image(data: bytes, max_bytes: int, max_pixels: int) -> str:
    """Return the detected format or raise. Decodes fully to catch corrupt or bomb files."""
    if not data:
        raise AppError(400, "empty_file", "The file is empty")
    if len(data) > max_bytes:
        raise AppError(413, "file_too_large", f"Images must be at most {max_bytes // (1024 * 1024)} MB")
    fmt = sniff_format(data)
    if fmt is None:
        if _looks_like_svg(data):
            # SVG can carry scripts and external references; we don't render or process it.
            raise AppError(415, "svg_not_supported", "SVG files are not supported for security reasons")
        raise AppError(415, "unsupported_format", "Supported formats: JPEG, PNG, WEBP, GIF")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as img:
                if img.format != fmt:
                    raise AppError(415, "format_mismatch", "File contents do not match a supported image format")
                if img.width * img.height > max_pixels:
                    raise AppError(413, "too_many_pixels", "Image dimensions are too large")
                img.load()
    except AppError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise AppError(413, "too_many_pixels", "Image dimensions are too large") from exc
    except Exception as exc:
        raise AppError(422, "corrupt_image", "The image could not be decoded") from exc
    return fmt
