"""Scan-Freigabe und Schutzregeln.

Legales Scannen heißt: nur Ziele, die man besitzt oder für die eine
ausdrückliche Erlaubnis vorliegt. Dieser öffentliche Dienst darf deshalb
NICHT beliebige Hosts scannen. Erlaubte Ziele stehen in ALLOWED_TARGETS
(Komma-getrennt) und werden hier streng geprüft.
"""
import ipaddress
import os
import time

# scanme.nmap.org ist das offizielle, ausdrücklich zum Testen freigegebene
# Ziel von Nmap. Localhost ist immer erlaubt. Eigene Ziele per Env ergänzen.
DEFAULT_TARGETS = "scanme.nmap.org,127.0.0.1,localhost,::1"

# Private-/Testnetze, die man als eigenes Labor freischalten kann.
_OPTIONAL_PRIVATE = os.getenv("ALLOW_PRIVATE_RANGES", "").strip().lower() in ("1", "true", "yes")
_PRIVATE_NETS = [ipaddress.ip_network(c) for c in (
    "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8",
)]

# Eine CIDR darf höchstens so viele Adressen umfassen (gegen Massen-Scans).
MAX_HOSTS = int(os.getenv("MAX_SCAN_HOSTS", "256"))


def _allowed_entries():
    raw = os.getenv("ALLOWED_TARGETS", DEFAULT_TARGETS)
    return [e.strip().lower() for e in raw.split(",") if e.strip()]


def _as_network(value):
    try:
        return ipaddress.ip_network(value, strict=False)
    except ValueError:
        return None


class TargetNotAllowed(Exception):
    """Ziel ist nicht freigegeben oder zu groß."""


def validate_target(target: str) -> str:
    """Gibt das normalisierte Ziel zurück oder wirft TargetNotAllowed."""
    t = (target or "").strip().lower()
    if not t or len(t) > 100:
        raise TargetNotAllowed("Kein oder zu langes Ziel.")

    allowed = _allowed_entries()

    # 1) Exakter Treffer auf einen Hostnamen (z. B. scanme.nmap.org).
    if t in allowed:
        return t

    net = _as_network(t)
    if net is None:
        raise TargetNotAllowed(
            "Dieses Ziel ist nicht freigegeben. Erlaubt sind nur: "
            + ", ".join(allowed)
        )

    # 2) IP/CIDR: Größe begrenzen.
    if net.num_addresses > MAX_HOSTS:
        raise TargetNotAllowed(
            f"Der Bereich ist zu groß (max. {MAX_HOSTS} Adressen)."
        )

    def contained_in(inner, outer):
        return outer is not None and inner.version == outer.version and inner.subnet_of(outer)

    # 3) IP/CIDR muss in einem erlaubten Netz liegen …
    for entry in allowed:
        if contained_in(net, _as_network(entry)):
            return str(net)

    # 4) … oder, wenn als Labor erlaubt, in einem privaten Netz.
    if _OPTIONAL_PRIVATE and any(contained_in(net, p) for p in _PRIVATE_NETS):
        return str(net)

    raise TargetNotAllowed(
        "Dieses Ziel ist nicht freigegeben. Erlaubt sind nur: "
        + ", ".join(allowed)
    )


# ── Einfaches Ratenlimit pro IP (im Arbeitsspeicher) ──────────────────────
_hits: dict[str, list[float]] = {}
RATE_LIMIT = int(os.getenv("SCAN_RATE_LIMIT", "5"))      # Scans
RATE_WINDOW = int(os.getenv("SCAN_RATE_WINDOW", "600"))  # pro Sekunden


def check_rate(ip: str) -> bool:
    now = time.time()
    hits = [h for h in _hits.get(ip, []) if now - h < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        _hits[ip] = hits
        return False
    hits.append(now)
    _hits[ip] = hits
    return True
