"""C2PA / Content Credentials verification, built on the reference c2pa_tool.detect()."""
import io
import json
import logging

from app.services import containers

log = logging.getLogger("originlens.c2pa")

try:
    from c2pa import Reader
except ImportError:  # pragma: no cover - dependency is pinned; keep the API alive without it
    Reader = None

AI_SOURCE_TYPES = ("trainedAlgorithmicMedia", "compositeWithTrainedAlgorithmicMedia", "algorithmicMedia")


def _digital_source_types(manifest: dict) -> list[str]:
    found = []
    for assertion in manifest.get("assertions", []):
        if not str(assertion.get("label", "")).startswith("c2pa.actions"):
            continue
        for action in assertion.get("data", {}).get("actions", []):
            if action.get("digitalSourceType"):
                found.append(action["digitalSourceType"])
    return found


def inspect(fmt: str, mime: str, data: bytes) -> dict:
    marker_present = any(b.category == "c2pa" for b in containers.parse(fmt, data))
    result: dict = {"supported": Reader is not None, "present": marker_present, "verified": False,
                    "validation_state": None, "manifest": None, "error": None}
    if Reader is None:
        result["error"] = "C2PA library unavailable"
        return result
    try:
        reader = Reader.try_create(mime, io.BytesIO(data))
    except Exception as exc:  # malformed manifests raise C2paError
        log.info("c2pa_read_failed", extra={"fields": {"error": type(exc).__name__}})
        result["error"] = "A Content Credentials manifest was found but could not be read"
        return result
    if reader is None:
        return result
    try:
        store = json.loads(reader.json())
        active = store.get("manifests", {}).get(store.get("active_manifest"), {})
        state = reader.get_validation_state()
        sig = active.get("signature_info") or {}
        result.update(
            present=True,
            validation_state=state,
            verified=state in ("Valid", "Trusted"),
            manifest={
                "claim_generator": active.get("claim_generator"),
                "claim_generator_info": active.get("claim_generator_info"),
                "title": active.get("title"),
                "is_embedded": reader.is_embedded(),
                "num_manifests": len(store.get("manifests", {})),
                "signature_issuer": sig.get("issuer"),
                "signed_at": sig.get("time"),
                "assertions": sorted({a.get("label", "") for a in active.get("assertions", [])}),
                "digital_source_types": _digital_source_types(active),
                "validation_issues": [s.get("code") for s in store.get("validation_status") or []][:20],
            },
        )
    finally:
        reader.close()
    return result
