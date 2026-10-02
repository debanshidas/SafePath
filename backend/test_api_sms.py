"""End-to-end check that the HTTP routes really send SMS when configured.

Drives the API through FastAPI's TestClient with a stubbed Twilio client, so
the whole path -- route -> notifications service -> provider -- is exercised
without spending Twilio credits.

Run: .venv/Scripts/python.exe test_api_sms.py
"""

import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mktemp(suffix='.db').replace(os.sep, '/')}"

from fastapi.testclient import TestClient  # noqa: E402

from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.services import notifications  # noqa: E402

SENT: list[dict] = []


class FakeMessages:
    def create(self, to, from_, body):
        SENT.append({"to": to, "body": body})
        return type("Msg", (), {"sid": f"SM{len(SENT):032d}"})()


class FakeClient:
    messages = FakeMessages()


failures = []


def check(label, actual, expected):
    ok = actual == expected
    print(f"{'PASS' if ok else 'FAIL'}  {label}: {actual!r}")
    if not ok:
        failures.append(f"{label}: expected {expected!r}, got {actual!r}")


def main() -> int:
    settings.twilio_account_sid = "ACtest"
    settings.twilio_auth_token = "token"
    settings.twilio_from_number = "+15005550006"
    notifications._client = FakeClient()
    notifications._client_error = None

    with TestClient(app) as client:
        print("-- status reports SMS as live --")
        check("smsConfigured", client.get("/api/sos/status").json()["smsConfigured"], True)

        contacts = client.get("/api/contacts").json()
        check("seeded contacts", len(contacts), 3)

        print("\n-- test alert actually sends --")
        SENT.clear()
        res = client.post(f"/api/contacts/{contacts[0]['id']}/test-alert").json()
        check("ok", res["ok"], True)
        check("status", res["status"], "sent")
        check("messages sent", len(SENT), 1)
        check("marked as a test", "TEST ALERT" in SENT[0]["body"], True)

        print("\n-- journey start notifies opted-in contacts --")
        SENT.clear()
        journey = client.post(
            "/api/journeys",
            json={"origin": "Connaught Place", "destination": "Greenwood Heights"},
        ).json()
        # Two of the three seeded contacts have notifyOnStart enabled.
        check("notified on start", len(SENT), 2)
        check("carries tracking link", journey["shareToken"] in SENT[0]["body"], True)

        print("\n-- SOS texts every contact --")
        SENT.clear()
        sos = client.post(
            "/api/sos",
            json={"location": "Connaught Place, New Delhi", "coords": [28.6289, 77.2190]},
        ).json()
        check("deliveryStatus", sos["deliveryStatus"], "sent")
        check("deliveredCount", sos["deliveredCount"], 3)
        check("recipientCount", sos["recipientCount"], 3)
        check("status label", sos["status"], "Alert Dispatched")
        check("messages sent", len(SENT), 3)
        check("includes live tracking", journey["shareToken"] in SENT[0]["body"], True)
        check("per-recipient results", len(sos["deliveries"]), 3)

        print("\n-- a provider outage is reported, not hidden --")
        SENT.clear()

        class BrokenMessages:
            def create(self, to, from_, body):
                raise RuntimeError("Twilio is unreachable")

        notifications._client = type("C", (), {"messages": BrokenMessages()})()
        broken = client.post("/api/sos", json={"location": "Somewhere"}).json()
        check("deliveryStatus", broken["deliveryStatus"], "failed")
        check("deliveredCount", broken["deliveredCount"], 0)
        check("status label", broken["status"], "Alert Recorded")

    print("-" * 52)
    if failures:
        print(f"{len(failures)} FAILURE(S):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("All API delivery checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
