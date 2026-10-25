import json

from app.services import c2pa_service

AI = "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"

# Shape of a Google Generative AI image: the AI step sits in the parent manifest,
# and the active (latest) manifest only records an added watermark.
STORE = {
    "active_manifest": "urn:latest",
    "manifests": {
        "urn:parent": {"assertions": [{"label": "c2pa.actions.v2", "data": {"actions": [
            {"action": "c2pa.opened"}, {"action": "c2pa.resized", "digitalSourceType": AI}]}}]},
        "urn:latest": {"assertions": [{"label": "c2pa.actions.v2", "data": {"actions": [
            {"action": "c2pa.edited", "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/composite"}]}}]},
    },
}


class FakeReader:
    @staticmethod
    def try_create(mime, stream):
        return FakeReader()

    def json(self):
        return json.dumps(STORE)

    def get_validation_state(self):
        return "Valid"

    def is_embedded(self):
        return True

    def close(self):
        pass


def test_ai_source_type_in_parent_manifest_is_found(monkeypatch):
    monkeypatch.setattr(c2pa_service, "Reader", FakeReader)
    result = c2pa_service.inspect("PNG", "image/png", b"\x89PNG\r\n\x1a\n")
    types = result["manifest"]["digital_source_types"]
    assert AI in types
    assert types.count(AI) == 1
