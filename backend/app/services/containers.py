"""Lossless, container-level parsing of JPEG segments, PNG chunks and WebP RIFF chunks.

Metadata lives in discrete blocks, so we can drop or rewrite those blocks and copy the
compressed pixel data byte-for-byte. No re-encoding, no quality loss.
"""
import struct
import zlib
from dataclasses import dataclass

from app.core.errors import AppError

# Categories a user may remove. ICC profiles and structural blocks are always kept.
REMOVABLE = ("gps", "exif", "xmp", "iptc", "c2pa", "comments")

XMP_JPEG = b"http://ns.adobe.com/xap/1.0/\x00"
XMP_EXT_JPEG = b"http://ns.adobe.com/xmp/extension/\x00"


@dataclass
class Block:
    kind: bytes  # JPEG: marker byte as 1 byte; PNG/WebP: 4-char chunk type
    data: bytes
    category: str  # exif | xmp | iptc | c2pa | comments | icc | structure


# ---------------- JPEG ----------------

def _jpeg_category(marker: int, payload: bytes) -> str:
    if marker == 0xE1 and payload.startswith(b"Exif\x00\x00"):
        return "exif"
    if marker == 0xE1 and (payload.startswith(XMP_JPEG) or payload.startswith(XMP_EXT_JPEG)):
        return "xmp"
    if marker == 0xE2 and payload.startswith(b"ICC_PROFILE\x00"):
        return "icc"
    # Same JUMBF/C2PA test as the reference c2pa_tool.py (APP11 carrying jumb/c2pa boxes).
    if marker == 0xEB and (b"jumb" in payload[:60] or b"c2pa" in payload[:120]):
        return "c2pa"
    if marker == 0xED and payload.startswith(b"Photoshop 3.0\x00"):
        return "iptc"
    if marker == 0xFE:
        return "comments"
    return "structure"


def parse_jpeg(data: bytes) -> tuple[list[Block], bytes]:
    """Return header blocks and the verbatim remainder starting at SOS (scan data + trailer)."""
    if data[:2] != b"\xff\xd8":
        raise AppError(422, "corrupt_image", "Not a JPEG")
    blocks: list[Block] = []
    i, n = 2, len(data)
    while i < n:
        if data[i] != 0xFF:
            raise AppError(422, "corrupt_image", "Malformed JPEG segment")
        marker = data[i + 1]
        if marker == 0xFF:  # fill byte
            i += 1
            continue
        if marker == 0xDA:
            return blocks, data[i:]
        if marker in (0x01, 0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            blocks.append(Block(bytes([marker]), b"", "structure"))
            i += 2
            continue
        if i + 4 > n:
            break
        seg_len = struct.unpack(">H", data[i + 2:i + 4])[0]
        payload = data[i + 4:i + 2 + seg_len]
        blocks.append(Block(bytes([marker]), payload, _jpeg_category(marker, payload)))
        i += 2 + seg_len
    raise AppError(422, "corrupt_image", "JPEG has no image data")


def build_jpeg(blocks: list[Block], tail: bytes) -> bytes:
    out = bytearray(b"\xff\xd8")
    for b in blocks:
        out += b"\xff" + b.kind
        if b.kind[0] not in (0x01, 0xD8, 0xD9) and not 0xD0 <= b.kind[0] <= 0xD7:
            if len(b.data) + 2 > 0xFFFF:
                raise AppError(422, "metadata_too_large", "Rewritten metadata segment is too large")
            out += struct.pack(">H", len(b.data) + 2) + b.data
    return bytes(out + tail)


# ---------------- PNG ----------------

def _png_category(ctype: bytes, cdata: bytes) -> str:
    if ctype == b"eXIf":
        return "exif"
    if ctype == b"iTXt" and cdata.startswith(b"XML:com.adobe.xmp\x00"):
        return "xmp"
    if ctype in (b"tEXt", b"zTXt", b"iTXt", b"tIME"):
        return "comments"
    if ctype == b"caBX":
        return "c2pa"
    if ctype == b"iCCP":
        return "icc"
    return "structure"


def parse_png(data: bytes) -> list[Block]:
    blocks, i = [], 8
    while i + 8 <= len(data):
        length, ctype = struct.unpack(">I4s", data[i:i + 8])
        cdata = data[i + 8:i + 8 + length]
        blocks.append(Block(ctype, cdata, _png_category(ctype, cdata)))
        i += 12 + length
        if ctype == b"IEND":
            break
    return blocks


def build_png(blocks: list[Block]) -> bytes:
    out = bytearray(b"\x89PNG\r\n\x1a\n")
    for b in blocks:
        out += struct.pack(">I", len(b.data)) + b.kind + b.data
        out += struct.pack(">I", zlib.crc32(b.kind + b.data) & 0xFFFFFFFF)
    return bytes(out)


# ---------------- WebP ----------------

_WEBP_CAT = {b"EXIF": "exif", b"XMP ": "xmp", b"C2PA": "c2pa", b"ICCP": "icc"}
_VP8X_FLAG = {"exif": 0x08, "xmp": 0x04}


def parse_webp(data: bytes) -> list[Block]:
    blocks, i = [], 12
    while i + 8 <= len(data):
        fourcc, size = data[i:i + 4], struct.unpack("<I", data[i + 4:i + 8])[0]
        blocks.append(Block(fourcc, data[i + 8:i + 8 + size], _WEBP_CAT.get(fourcc, "structure")))
        i += 8 + size + (size & 1)
    return blocks


def build_webp(blocks: list[Block]) -> bytes:
    present = {b.category for b in blocks}
    body = bytearray(b"WEBP")
    for b in blocks:
        data = b.data
        if b.kind == b"VP8X":  # keep feature flags consistent with the chunks we kept
            flags = data[0]
            for cat, bit in _VP8X_FLAG.items():
                flags = flags | bit if cat in present else flags & ~bit
            data = bytes([flags]) + data[1:]
        body += b.kind + struct.pack("<I", len(data)) + data + (b"\x00" if len(data) & 1 else b"")
    return b"RIFF" + struct.pack("<I", len(body)) + bytes(body)


# ---------------- common ----------------

def parse(fmt: str, data: bytes) -> list[Block]:
    if fmt == "JPEG":
        return parse_jpeg(data)[0]
    if fmt == "PNG":
        return parse_png(data)
    if fmt == "WEBP":
        return parse_webp(data)
    return []


def block_summary(fmt: str, data: bytes) -> list[dict]:
    """Metadata blocks present in the file: category, container label, byte size."""
    out = []
    for b in parse(fmt, data):
        if b.category == "structure":
            continue
        label = f"APP{b.kind[0] - 0xE0}" if fmt == "JPEG" and 0xE0 <= b.kind[0] <= 0xEF else (
            "COM" if fmt == "JPEG" else b.kind.decode("latin-1").strip())
        out.append({"category": b.category, "container": label, "bytes": len(b.data)})
    return out
