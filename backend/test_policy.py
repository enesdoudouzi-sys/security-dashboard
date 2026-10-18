"""Tests für die Scan-Freigabe. Ausführen: pytest  (im Ordner backend/)"""
import importlib
import pytest
import policy
from policy import validate_target, TargetNotAllowed, check_rate


@pytest.mark.parametrize("target", [
    "scanme.nmap.org", "SCANME.NMAP.ORG", "127.0.0.1", "127.0.0.1/32", "::1", "localhost",
])
def test_allowed(target):
    assert validate_target(target)


@pytest.mark.parametrize("target", [
    "google.com", "8.8.8.8", "192.168.1.0/24", "0.0.0.0/0", "::/0",
    "'; rm -rf /", "", "x" * 200, "10.0.0.0/8",
])
def test_blocked(target):
    with pytest.raises(TargetNotAllowed):
        validate_target(target)


def test_lab_private_ranges(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_RANGES", "1")
    importlib.reload(policy)
    try:
        assert policy.validate_target("192.168.1.0/24")
        assert policy.validate_target("10.0.0.5")
    finally:
        monkeypatch.delenv("ALLOW_PRIVATE_RANGES", raising=False)
        importlib.reload(policy)


def test_cidr_too_large(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_RANGES", "1")
    importlib.reload(policy)
    try:
        with pytest.raises(policy.TargetNotAllowed):
            policy.validate_target("10.0.0.0/8")  # viel zu groß
    finally:
        monkeypatch.delenv("ALLOW_PRIVATE_RANGES", raising=False)
        importlib.reload(policy)


def test_rate_limit(monkeypatch):
    monkeypatch.setenv("SCAN_RATE_LIMIT", "3")
    importlib.reload(policy)
    try:
        ip = "203.0.113.9"
        assert all(policy.check_rate(ip) for _ in range(3))
        assert not policy.check_rate(ip)  # das vierte wird abgelehnt
    finally:
        monkeypatch.delenv("SCAN_RATE_LIMIT", raising=False)
        importlib.reload(policy)
