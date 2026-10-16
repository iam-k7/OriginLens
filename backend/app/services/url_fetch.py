"""SSRF-safe image download.

Each hop: allow only http(s) on 80/443, resolve DNS once, reject any non-global address,
then connect to that exact IP (Host header + TLS SNI keep the original name), so a second
DNS answer can't rebind us to an internal address. Redirects are followed manually and re-checked.
"""
import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx

from app.core.errors import AppError

ALLOWED_PORTS = {"http": 80, "https": 443}


def resolve_public_ip(host: str, port: int) -> str:
    try:
        infos = socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)
    except (socket.gaierror, UnicodeError) as exc:
        raise AppError(422, "url_unresolvable", "Could not resolve the image host") from exc
    addrs = {info[4][0] for info in infos}
    for a in addrs:
        ip = ipaddress.ip_address(a.split("%")[0])
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            ip = ip.ipv4_mapped
        if not ip.is_global or ip.is_multicast:
            raise AppError(422, "url_blocked", "That address is not allowed")
    if not addrs:
        raise AppError(422, "url_unresolvable", "Could not resolve the image host")
    return sorted(addrs)[0]


def _check_url(url: str) -> tuple[str, str, int]:
    parts = urlsplit(url)
    if parts.scheme not in ALLOWED_PORTS or not parts.hostname:
        raise AppError(422, "url_invalid", "Only http and https image URLs are allowed")
    if parts.username or parts.password:
        raise AppError(422, "url_invalid", "URLs with credentials are not allowed")
    port = parts.port or ALLOWED_PORTS[parts.scheme]
    if port != ALLOWED_PORTS[parts.scheme]:
        raise AppError(422, "url_blocked", "Only standard ports 80 and 443 are allowed")
    return parts.scheme, parts.hostname, port


def fetch_image(url: str, max_bytes: int, timeout_s: float, max_redirects: int,
                transport: httpx.BaseTransport | None = None) -> bytes:
    if len(url) > 2048:
        raise AppError(422, "url_invalid", "URL is too long")
    with httpx.Client(timeout=timeout_s, follow_redirects=False, transport=transport,
                      headers={"User-Agent": "OriginLens/1.0 (+image-analysis)"}) as client:
        for _ in range(max_redirects + 1):
            scheme, host, port = _check_url(url)
            ip = resolve_public_ip(host, port)
            parts = urlsplit(url)
            netloc = f"[{ip}]" if ":" in ip else ip
            pinned = parts._replace(netloc=f"{netloc}:{port}").geturl()
            req = client.build_request("GET", pinned, headers={"Host": host, "Accept": "image/*"},
                                       extensions={"sni_hostname": host})
            try:
                resp = client.send(req, stream=True)
            except httpx.HTTPError as exc:
                raise AppError(502, "url_fetch_failed", "Could not download the image") from exc
            try:
                if resp.status_code in (301, 302, 303, 307, 308):
                    loc = resp.headers.get("location")
                    if not loc:
                        raise AppError(502, "url_fetch_failed", "Redirect without a location")
                    url = urljoin(url, loc)
                    continue
                if resp.status_code != 200:
                    raise AppError(502, "url_fetch_failed", f"Image host returned HTTP {resp.status_code}")
                declared = resp.headers.get("content-length")
                if declared and declared.isdigit() and int(declared) > max_bytes:
                    raise AppError(413, "file_too_large", "Remote image is too large")
                buf = bytearray()
                for chunk in resp.iter_bytes():
                    buf += chunk
                    if len(buf) > max_bytes:
                        raise AppError(413, "file_too_large", "Remote image is too large")
                return bytes(buf)
            except httpx.HTTPError as exc:
                raise AppError(502, "url_fetch_failed", "Could not download the image") from exc
            finally:
                resp.close()
    raise AppError(422, "too_many_redirects", "Too many redirects")
