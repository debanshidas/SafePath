"""Verify SMS delivery wiring without spending real Twilio credits.

Stubs the Twilio client so the full send path -- number normalisation, message
body, per-recipient results, and the rolled-up status -- is exercised exactly
as it would be against the live API.

Run: .venv/Scripts/python.exe test_sms.py
"""

from app.config import settings
from app.services import notifications

SENT: list[dict] = []


class FakeMessage:
    def __init__(self, sid):
        self.sid = sid


class FakeMessages:
    def create(self, to, from_, body):
        if "0000000" in to:
            raise RuntimeError("The 'To' number is unverified (trial account)")
        SENT.append({"to": to, "from": from_, "body": body})
        return FakeMessage(f"SM{len(SENT):032d}")


class FakeClient:
    messages = FakeMessages()


def main() -> int:
    settings.twilio_account_sid = "ACtest"
    settings.twilio_auth_token = "token"
    settings.twilio_from_number = "+15005550006"
    notifications._client = FakeClient()
    notifications._client_error = None

    failures = []

    def check(label, actual, expected):
        ok = actual == expected
        print(f"{'PASS' if ok else 'FAIL'}  {label}: {actual!r}")
        if not ok:
            failures.append(f"{label}: expected {expected!r}, got {actual!r}")

    print("-- configured status --")
    check("smsConfigured", notifications.status()["smsConfigured"], True)

    print("\n-- number normalisation --")
    check("spaced local number", notifications._normalise("+91 98765 43210"), "+919876543210")
    check("no country code", notifications._normalise("9876543210"), "+919876543210")
    check("leading zero", notifications._normalise("09876543210"), "+919876543210")
    check("00 prefix", notifications._normalise("0091 98765 43210"), "+919876543210")

    print("\n-- single send --")
    result = notifications.send_sms("+91 98765 43210", "hello")
    check("ok", result.ok, True)
    check("status", result.status, "sent")
    check("delivered to", SENT[-1]["to"], "+919876543210")

    print("\n-- rejected number --")
    bad = notifications.send_sms("abc", "hello")
    check("status", bad.status, "invalid_number")

    print("\n-- provider error surfaces as failure --")
    err = notifications.send_sms("+91 00000 00077", "hello")
    check("ok", err.ok, False)
    check("status", err.status, "failed")

    print("\n-- bulk send --")
    before = len(SENT)
    results = notifications.send_bulk(["+919812345678", "+919765432109"], "bulk")
    check("all delivered", all(r.ok for r in results), True)
    check("messages sent", len(SENT) - before, 2)

    print("\n-- SOS message body --")
    body = notifications.sos_message("Priya Sharma", "Connaught Place", "safe_abc123", "84%")
    check("names the user", "Priya Sharma" in body, True)
    check("carries tracking link", notifications.share_url("safe_abc123") in body, True)
    print(f"\n{body}\n")

    print(f"{'-' * 50}")
    if failures:
        print(f"{len(failures)} FAILURE(S):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("All SMS delivery checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
