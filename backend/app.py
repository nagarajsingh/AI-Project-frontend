from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel, Field

app = FastAPI(title="Document Intake API", version="1.0.0")


class UploadMetadata(BaseModel):
    pipeline: str
    project: str
    notes: str | None = None


class DocumentDetails(BaseModel):
    filename: str
    content_type: str | None
    size_bytes: int


class ExtractedData(BaseModel):
    summary: str
    detected_entities: list[str] = Field(default_factory=list)
    extracted_at: str


class UploadResponse(BaseModel):
    metadata: UploadMetadata
    document: DocumentDetails
    extracted_data: ExtractedData


class ValidationRequest(BaseModel):
    metadata: UploadMetadata
    extracted_data: dict[str, Any]


class ValidationResult(BaseModel):
    valid: bool
    checks: list[str]
    validated_at: str
    extracted_data: dict[str, Any]


@app.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    document: UploadFile = File(...),
    pipeline: str = Form(...),
    project: str = Form(...),
    notes: str | None = Form(default=None),
) -> UploadResponse:
    content = await document.read()
    extracted_data = ExtractedData(
        summary=f"Received {len(content)} bytes from {document.filename}.",
        detected_entities=["pipeline", "project", "notes"],
        extracted_at=datetime.now(timezone.utc).isoformat(),
    )
    metadata = UploadMetadata(pipeline=pipeline, project=project, notes=notes)
    details = DocumentDetails(
        filename=document.filename or "unknown",
        content_type=document.content_type,
        size_bytes=len(content),
    )
    return UploadResponse(metadata=metadata, document=details, extracted_data=extracted_data)


@app.post("/documents/validate", response_model=ValidationResult)
async def validate_document(payload: ValidationRequest) -> ValidationResult:
    checks = []
    checks.append(
        "pipeline provided" if payload.metadata.pipeline.strip() else "pipeline missing"
    )
    checks.append(
        "project provided" if payload.metadata.project.strip() else "project missing"
    )
    valid = all("missing" not in check for check in checks)
    return ValidationResult(
        valid=valid,
        checks=checks,
        validated_at=datetime.now(timezone.utc).isoformat(),
        extracted_data=payload.extracted_data,
    )
