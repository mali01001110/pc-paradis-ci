"""Lightweight arithmetic CAPTCHA (no external service, spec §45).

A challenge is a simple operation whose answer is signed with a timestamp. The
server never stores state: the signed token carries the answer, is single-purpose
and expires after TTL_SECONDS. A hidden honeypot field complements this on the
frontend (bots filling it are rejected).
"""
import operator
import random
import secrets

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

TTL_SECONDS = 10 * 60
_SIGNER = TimestampSigner(salt="pcparadis-captcha")

_OPERATIONS = {"+": operator.add, "-": operator.sub}


def generate_challenge():
    """Return (question, token). The answer only exists inside the signed token."""
    a = random.randint(2, 9)
    b = random.randint(1, 9)
    symbol = random.choice(["+", "-"])
    if symbol == "-":
        a, b = max(a, b), min(a, b)
    answer = _OPERATIONS[symbol](a, b)
    question = f"{a} {symbol} {b}"
    token = _SIGNER.sign(str(answer))
    return question, token


def verify_challenge(token, answer) -> bool:
    """True when the answer matches the signed challenge and the token is fresh."""
    if not token or answer is None or str(answer).strip() == "":
        return False
    try:
        expected = _SIGNER.unsign(str(token), max_age=TTL_SECONDS)
    except (BadSignature, SignatureExpired):
        return False
    return secrets.compare_digest(str(expected), str(answer).strip())
