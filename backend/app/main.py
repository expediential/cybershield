"""Local MVP API. Remote reputation and antivirus engines are deliberately optional."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import PurePath
from urllib.parse import urlparse

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, HttpUrl

app = FastAPI(
    title="CyberShield API",
    version="0.1.0",
    description="Local-first security assessment API. It does not claim to provide a complete antivirus service.",
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
TEST_BLOCKLIST = {"malware.test", "phishing.test", "unsafe.example"}
SHORTENERS = {"bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "rb.gy"}
RISKY_TLDS = {"zip", "mov", "click", "top", "gq", "work", "country"}


class UrlScanRequest(BaseModel):
    url: HttpUrl


class Finding(BaseModel):
    label: str
    detail: str
    severity: str


class UrlScanResponse(BaseModel):
    normalized: str
    verdict: str
    score: int = Field(ge=0, le=100)
    findings: list[Finding]
    checked_at: datetime
    coverage: str
    recommendation: str


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "cybershield-api", "mode": "local"}


@app.post("/api/v1/scans/url", response_model=UrlScanResponse)
async def scan_url(payload: UrlScanRequest) -> UrlScanResponse:
    parsed = urlparse(str(payload.url))
    host = (parsed.hostname or "").lower()
    risk = 0
    findings: list[Finding] = []

    def add(points: int, label: str, detail: str, severity: str) -> None:
        nonlocal risk
        risk += points
        findings.append(Finding(label=label, detail=detail, severity=severity))

    if host in TEST_BLOCKLIST:
        add(100, "Test threat match", "Reserved demonstration host matched the local test list.", "danger")
    if parsed.scheme == "http":
        add(18, "Unencrypted connection", "HTTP permits in-transit modification of page content.", "warning")
    else:
        findings.append(Finding(label="Encrypted transport", detail="HTTPS is present; that does not validate the site.", severity="safe"))
    if host in SHORTENERS:
        add(24, "Shortened link", "The final destination is hidden behind a shortening provider.", "warning")
    if host.startswith("xn--"):
        add(28, "Internationalized hostname", "Punycode hosts can be legitimate but require careful review.", "warning")
    if re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", host):
        add(30, "IP-address host", "Consumer sign-in flows rarely use direct IP addresses.", "warning")
    if parsed.username or parsed.password:
        add(24, "Misleading address structure", "A user-info segment can obscure the actual destination.", "danger")
    if host.split(".")[-1] in RISKY_TLDS:
        add(12, "Higher-abuse TLD signal", "This ending is often present in abuse campaigns; it is not proof.", "warning")

    score = min(100, risk)
    verdict = "malicious" if score >= 85 else "suspicious" if score >= 24 else "safe"
    recommendation = {
        "malicious": "Do not open or share this address. Delete it and report the message source.",
        "suspicious": "Avoid credentials or payments until the sender and registered domain are independently verified.",
        "safe": "No high-risk local signals were found. This is not an absolute safety guarantee.",
    }[verdict]
    return UrlScanResponse(
        normalized=str(payload.url),
        verdict=verdict,
        score=score,
        findings=findings,
        checked_at=datetime.now(timezone.utc),
        coverage="Structural analysis and local test blocklist only; no remote reputation provider is configured.",
        recommendation=recommendation,
    )


@app.post("/api/v1/scans/files")
async def scan_file(file: UploadFile = File(...)) -> dict[str, object]:
    """Accept only a bounded upload for a metadata assessment; never execute it."""
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB MVP limit.")

    name = PurePath(file.filename or "unnamed").name
    suspicious = bool(re.search(r"\.(apk|exe|msi|bat|cmd|scr|js|vbs)$", name, re.IGNORECASE))
    return {
        "job_status": "complete",
        "verdict": "suspicious" if suspicious else "unknown",
        "engine": "metadata-only",
        "filename": name,
        "bytes_received": len(content),
        "findings": [
            {
                "severity": "warning" if suspicious else "info",
                "detail": "Executable or installer extension: configure an isolated scanning worker before opening."
                if suspicious
                else "No malware engine ran. A neutral metadata response is not a clean verdict.",
            }
        ],
        "limitations": "MVP endpoint; no executable content is run and no antivirus or YARA engine is installed.",
    }
