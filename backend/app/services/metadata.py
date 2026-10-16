import hashlib
import io
import json
import re
import shutil
import subprocess  # noqa: S404 - fixed argv only, used for optional ExifTool
from fractions import Fraction

from defusedxml import ElementTree
from PIL import ExifTags, Image, ImageCms, IptcImagePlugin, TiffImagePlugin

from app.core.config import get_settings
from app.services import containers
from app.services.image_validation import MIME

MAX_STR = 500
GPS_IFD, EXIF_IFD = 0x8825, 0x8769
IPTC_NAMES = {(2, 5): "ObjectName", (2, 25): "Keywords", (2, 55): "DateCreated", (2, 80): "By-line",
              (2, 90): "City", (2, 101): "Country", (2, 105): "Headline", (2, 110): "Credit",
              (2, 115): "Source", (2, 116): "CopyrightNotice", (2, 120): "Caption"}
SENSITIVE_HINTS = ("gps", "serial", "owner", "artist", "author", "creator", "copyright",
                   "datetime", "make", "model", "lens", "software")


def _clean(value):
    """Make metadata values JSON-safe and bounded."""
    if isinstance(value, (TiffImagePlugin.IFDRational, Fraction)):
        return None if value.denominator == 0 else round(float(value), 6)
    if isinstance(value, bytes):
        text = value.rstrip(b"\x00")
        if text and all(32 <= c < 127 for c in text[:200]):
            return text.decode("ascii")[:MAX_STR]
        return f"<{len(value)} bytes binary>"
    if isinstance(value, (tuple, list)):
        return [_clean(v) for v in value[:32]]
    if isinstance(value, str):
        return value.replace("\x00", "").strip()[:MAX_STR]
    if isinstance(value, (int, float, bool)) or value is None:
        return value
    return str(value)[:MAX_STR]


def _gps_decimal(gps: dict) -> dict | None:
    def dms(vals, ref):
        try:
            d, m, s = (float(v) for v in vals)
        except (TypeError, ValueError):
            return None
        dec = d + m / 60 + s / 3600
        return round(-dec if ref in ("S", "W") else dec, 6)

    lat = dms(gps.get("GPSLatitude"), gps.get("GPSLatitudeRef"))
    lon = dms(gps.get("GPSLongitude"), gps.get("GPSLongitudeRef"))
    if lat is None or lon is None:
        return None
    out = {"latitude": lat, "longitude": lon}
    if isinstance(gps.get("GPSAltitude"), (int, float)):
        out["altitude_m"] = round(float(gps["GPSAltitude"]), 1)
    return out


def read_exif(exif: Image.Exif) -> dict[str, dict]:
    groups: dict[str, dict] = {"IFD0": {}, "ExifIFD": {}, "GPS": {}}
    for tag, val in exif.items():
        if tag not in (GPS_IFD, EXIF_IFD):
            groups["IFD0"][ExifTags.TAGS.get(tag, f"Tag{tag:#06x}")] = _clean(val)
    for tag, val in exif.get_ifd(EXIF_IFD).items():
        name = ExifTags.TAGS.get(tag, f"Tag{tag:#06x}")
        groups["ExifIFD"][name] = "<maker note omitted>" if name == "MakerNote" else _clean(val)
    for tag, val in exif.get_ifd(GPS_IFD).items():
        groups["GPS"][ExifTags.GPSTAGS.get(tag, f"Tag{tag:#06x}")] = _clean(val)
    return {k: v for k, v in groups.items() if v}


def read_xmp(data: bytes) -> dict[str, str]:
    m = re.search(rb"<x:xmpmeta[\s\S]*?</x:xmpmeta>", data)
    if not m:
        return {}
    try:
        root = ElementTree.fromstring(m.group(0))  # defusedxml: no entities, no external refs
    except Exception:
        return {"_error": "XMP packet present but not parseable"}

    def local(tag: str) -> str:
        ns, _, name = tag.rpartition("}")
        prefix = ns.strip("{").rstrip("/#").rsplit("/", 1)[-1] if ns else ""
        return f"{prefix}:{name}" if prefix else name

    parent = {c: p for p in root.iter() for c in p}
    flat: dict[str, str] = {}
    for el in root.iter():
        for k, v in el.attrib.items():
            if not k.endswith("}about"):
                flat.setdefault(local(k), v[:MAX_STR])
        if el.text and el.text.strip() and len(el) == 0:
            key = local(el.tag)
            if key.endswith(":li") and el in parent and parent[el] in parent:
                key = local(parent[parent[el]].tag)  # rdf:Bag/Seq/Alt item -> owning property
                flat[key] = (flat[key] + "; " if key in flat else "") + el.text.strip()[:MAX_STR]
            else:
                flat.setdefault(key, el.text.strip()[:MAX_STR])
        if len(flat) >= 200:
            break
    return flat


def read_iptc(img: Image.Image) -> dict:
    try:
        info = IptcImagePlugin.getiptcinfo(img) or {}
    except Exception:
        return {}
    out = {}
    for key, val in info.items():
        vals = val if isinstance(val, list) else [val]
        out[IPTC_NAMES.get(key, f"{key[0]}:{key[1]}")] = "; ".join(str(_clean(v)) for v in vals if v)[:MAX_STR]
    return out


def read_exiftool(data: bytes) -> dict | None:
    """Optional deep read with ExifTool if installed. Bytes are piped via stdin; nothing hits disk."""
    exe = shutil.which(get_settings().exiftool_path)
    if not exe:
        return None
    try:
        proc = subprocess.run([exe, "-j", "-G1", "-struct", "-q", "-"], input=data,  # noqa: S603
                              capture_output=True, timeout=10, check=False)
        items = json.loads(proc.stdout or b"[]")
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        return None
    if not items:
        return None
    skip = ("SourceFile", "ExifTool:", "System:", "File:")
    return {k: _clean(v) for k, v in items[0].items() if not k.startswith(skip)}


def _color_info(img: Image.Image) -> dict:
    info: dict = {"mode": img.mode, "bands": list(img.getbands()),
                  "has_alpha": img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info,
                  "icc_profile": None}
    icc = img.info.get("icc_profile")
    if icc:
        try:
            desc = ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc))).strip()
        except Exception:
            desc = "embedded (unreadable)"
        info["icc_profile"] = {"description": desc, "bytes": len(icc)}
    thumb = img.convert("RGB")
    thumb.thumbnail((64, 64))
    colors = thumb.quantize(colors=5).convert("RGB").getcolors(64 * 64) or []
    info["dominant_colors"] = ["#{:02x}{:02x}{:02x}".format(*c) for _, c in sorted(colors, reverse=True)]
    return info


def inspect(data: bytes, fmt: str) -> dict:
    with Image.open(io.BytesIO(data)) as img:
        exif = read_exif(img.getexif())
        ifd0, sub = exif.get("IFD0", {}), exif.get("ExifIFD", {})
        comment = img.info.get("comment")
        result = {
            "technical": {
                "format": fmt, "mime_type": MIME[fmt], "width": img.width, "height": img.height,
                "megapixels": round(img.width * img.height / 1e6, 2), "file_size_bytes": len(data),
                "frames": getattr(img, "n_frames", 1), "dpi": _clean(img.info.get("dpi")),
                "progressive": bool(img.info.get("progressive") or img.info.get("progression")),
                "interlaced": bool(img.info.get("interlace")),
                "sha256": hashlib.sha256(data).hexdigest(),
            },
            "color": _color_info(img),
            "highlights": {
                "camera_make": ifd0.get("Make"), "camera_model": ifd0.get("Model"),
                "lens": sub.get("LensModel"), "software": ifd0.get("Software"),
                "author": ifd0.get("Artist"), "copyright": ifd0.get("Copyright"),
                "captured_at": sub.get("DateTimeOriginal") or ifd0.get("DateTime"),
                "gps": _gps_decimal(exif.get("GPS", {})),
            },
            "exif": exif,
            "xmp": read_xmp(data),
            "iptc": read_iptc(img) if fmt == "JPEG" else {},
            "text_chunks": {k: _clean(v) for k, v in img.info.items()
                            if fmt == "PNG" and isinstance(v, str) and k != "XML:com.adobe.xmp"},
            "comment": _clean(comment) if comment else None,
        }
    result["blocks"] = containers.block_summary(fmt, data)
    result["exiftool"] = read_exiftool(data)
    result["sensitive_fields"] = sorted(
        f"{g}.{k}" for g, fields in exif.items() for k in fields
        if g == "GPS" or any(h in k.lower() for h in SENSITIVE_HINTS))
    return result
