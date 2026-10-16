"""Evidence-based AI-generation signals.

There is no validated pixel-level detector here, so we never output a probability score.
We report what the file itself declares (C2PA, IPTC/XMP, generator fingerprints) and weak
technical hints, each labelled with its strength and limits.
"""
from app.services.c2pa_service import AI_SOURCE_TYPES

GENERATORS = ("midjourney", "dall-e", "dall·e", "dalle", "stable diffusion", "stablediffusion", "sdxl",
              "firefly", "imagen", "novelai", "comfyui", "automatic1111", "invokeai", "flux", "leonardo",
              "ideogram", "gpt-4o", "chatgpt", "openai", "gemini", "bing image creator", "playground ai",
              "runway", "krea")
GEN_SIZES = {512, 576, 640, 704, 768, 832, 896, 960, 1024, 1152, 1216, 1280, 1344, 1536, 1792, 2048}

LIMITATIONS = [
    "No validated pixel-level AI detector is integrated, so no AI probability score is shown.",
    "Metadata and Content Credentials can be stripped or forged; their absence proves nothing.",
    "Camera EXIF can be copied onto generated images; treat it as weak evidence.",
    "Screenshots, re-uploads and social platforms usually remove all of these signals.",
]


def _ev(source: str, signal: str, detail: str, strength: str, direction: str) -> dict:
    return {"source": source, "signal": signal, "detail": detail, "strength": strength, "direction": direction}


def _generator_hit(text: str | None) -> str | None:
    t = (text or "").lower()
    return next((g for g in GENERATORS if g in t), None)


def analyze(meta: dict, c2pa: dict) -> dict:
    ev: list[dict] = []
    manifest = c2pa.get("manifest") or {}

    for dst in manifest.get("digital_source_types", []):
        if any(dst.endswith(t) for t in AI_SOURCE_TYPES):
            verified = "verified signature" if c2pa.get("verified") else "signature NOT verified"
            ev.append(_ev("C2PA", "AI digital source type", f"{dst.rsplit('/', 1)[-1]} ({verified})",
                          "strong" if c2pa.get("verified") else "moderate", "ai"))
    hit = _generator_hit(manifest.get("claim_generator"))
    if hit:
        ev.append(_ev("C2PA", "Generator tool", f"Claim generator mentions '{hit}'", "moderate", "ai"))
    if c2pa.get("present") and not manifest:
        ev.append(_ev("C2PA", "Unreadable manifest", "Content Credentials present but unreadable", "weak", "neutral"))

    xmp = meta.get("xmp", {})
    dst = next((v for k, v in xmp.items() if k.endswith("DigitalSourceType")), None)
    if dst and any(t in dst for t in AI_SOURCE_TYPES):
        ev.append(_ev("XMP/IPTC", "AI digital source type", dst.rsplit("/", 1)[-1], "moderate", "ai"))

    for source, text in (("EXIF Software", meta["highlights"].get("software")),
                         ("XMP CreatorTool", next((v for k, v in xmp.items() if k.endswith("CreatorTool")), None))):
        hit = _generator_hit(text)
        if hit:
            ev.append(_ev(source, "Generator tool", f"Mentions '{hit}'", "moderate", "ai"))

    chunks = meta.get("text_chunks", {})
    if "parameters" in chunks:
        ev.append(_ev("PNG text", "Diffusion parameters", "Stable Diffusion WebUI 'parameters' block present",
                      "strong", "ai"))
    if {"prompt", "workflow"} & set(chunks):
        ev.append(_ev("PNG text", "ComfyUI workflow", "ComfyUI prompt/workflow block present", "strong", "ai"))

    h = meta["highlights"]
    exif_sub = meta.get("exif", {}).get("ExifIFD", {})
    if h.get("camera_make") and ("ExposureTime" in exif_sub or "FNumber" in exif_sub):
        ev.append(_ev("EXIF", "Camera capture data",
                      f"{h.get('camera_make')} {h.get('camera_model') or ''}".strip() + " with exposure settings",
                      "weak", "camera"))

    t = meta["technical"]
    if t["width"] in GEN_SIZES and t["height"] in GEN_SIZES and t["width"] % 64 == 0 and t["height"] % 64 == 0:
        ev.append(_ev("Technical", "Generator-typical dimensions", f"{t['width']}×{t['height']} (multiples of 64)",
                      "weak", "ai"))
    if not meta.get("blocks") and not meta.get("exif"):
        ev.append(_ev("Technical", "No embedded metadata",
                      "Common after screenshots or social uploads; not evidence either way", "weak", "neutral"))

    ai = [e for e in ev if e["direction"] == "ai"]
    cam = [e for e in ev if e["direction"] == "camera"]
    if any(e["strength"] == "strong" for e in ai):
        verdict, confidence = "declared_ai", "high"
    elif any(e["strength"] == "moderate" for e in ai):
        verdict, confidence = "ai_indicators", "medium"
    elif cam and not ai:
        verdict, confidence = "camera_indicators", "low"
    else:
        verdict, confidence = "inconclusive", "low"

    return {
        "detector": {"status": "unavailable", "score": None,
                     "reason": "No validated pixel-level AI-image detector is configured."},
        "verdict": verdict,
        "confidence": confidence,
        "evidence": ev,
        "limitations": LIMITATIONS,
    }
