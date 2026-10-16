"""Privacy Clean: remove selected metadata categories without re-encoding pixels."""
import io

from PIL import Image

from app.core.errors import AppError
from app.services import containers
from app.services.containers import REMOVABLE, Block
from app.services.metadata import GPS_IFD

LIMITATIONS = [
    "ICC color profiles are always kept so colors render the same.",
    "Pixel data is copied byte-for-byte; visible content (watermarks, faces, text) is not changed.",
    "Removing metadata does not change where an image came from. AI-generated images stay AI-generated.",
    "Removing GPS only rewrites the EXIF block; vendor maker-notes inside EXIF may lose internal offsets.",
    "Data appended after the JPEG end marker (e.g. multi-picture or motion-photo payloads) is kept as-is.",
]


def _without_gps(exif_bytes: bytes) -> bytes:
    prefix = b"Exif\x00\x00" if exif_bytes.startswith(b"Exif\x00\x00") else b""
    exif = Image.Exif()
    exif.load(exif_bytes)
    exif.get_ifd(0x8769)  # materialize sub-IFDs so tobytes() writes them back
    if GPS_IFD in exif:
        del exif[GPS_IFD]
    out = exif.tobytes()  # always "Exif\0\0" + TIFF
    return prefix + out[6:]


def _filter(blocks: list[Block], remove: set[str]) -> tuple[list[Block], list[dict]]:
    kept, removed = [], []
    for b in blocks:
        if b.category in remove:
            removed.append({"category": b.category, "bytes": len(b.data)})
            continue
        if b.category == "exif" and "gps" in remove:
            new = _without_gps(b.data)
            if new != b.data:
                removed.append({"category": "gps", "bytes": len(b.data) - len(new)})
            b = Block(b.kind, new, b.category)
        kept.append(b)
    return kept, removed


def clean(data: bytes, fmt: str, categories: list[str]) -> tuple[bytes, list[dict]]:
    remove = set(categories)
    unknown = remove - set(REMOVABLE)
    if unknown or not remove:
        raise AppError(422, "invalid_categories", f"Choose from: {', '.join(REMOVABLE)}")
    if "exif" in remove:
        remove.add("gps")  # GPS lives inside EXIF
    if fmt == "JPEG":
        blocks, tail = containers.parse_jpeg(data)
        kept, removed = _filter(blocks, remove)
        out = containers.build_jpeg(kept, tail)
    elif fmt == "PNG":
        kept, removed = _filter(containers.parse_png(data), remove)
        out = containers.build_png(kept)
    elif fmt == "WEBP":
        kept, removed = _filter(containers.parse_webp(data), remove)
        out = containers.build_webp(kept)
    else:
        raise AppError(415, "clean_unsupported", f"Privacy Clean supports JPEG, PNG and WEBP (got {fmt})")

    # Safety net: the cleaned file must decode to identical dimensions and mode.
    try:
        with Image.open(io.BytesIO(data)) as a, Image.open(io.BytesIO(out)) as b:
            b.load()
            if (a.size, a.mode) != (b.size, b.mode):
                raise ValueError("geometry changed")
    except Exception as exc:
        raise AppError(500, "clean_failed", "Could not produce a valid cleaned image") from exc
    return out, removed
