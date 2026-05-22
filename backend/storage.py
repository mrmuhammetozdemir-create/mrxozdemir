import os
import boto3
from botocore.client import Config

APP_NAME = "proptech-turkey"

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "pdf": "application/pdf",
    "json": "application/json", "csv": "text/csv", "txt": "text/plain",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "kml": "application/vnd.google-earth.kml+xml",
    "kmz": "application/vnd.google-earth.kmz",
    "geojson": "application/geo+json",
}

_s3_client = None


def _get_client():
    global _s3_client
    if _s3_client:
        return _s3_client
    account_id = os.environ.get("R2_ACCOUNT_ID")
    _s3_client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ.get("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    return _s3_client


def init_storage():
    """Validate R2 connection at startup."""
    client = _get_client()
    bucket = os.environ.get("R2_BUCKET_NAME")
    client.head_bucket(Bucket=bucket)
    return True


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to R2. Returns {"path": path, "size": len(data)}"""
    client = _get_client()
    bucket = os.environ.get("R2_BUCKET_NAME")
    client.put_object(
        Bucket=bucket,
        Key=path,
        Body=data,
        ContentType=content_type,
    )
    return {"path": path, "size": len(data)}


def get_object(path: str):
    """Download file from R2. Returns (content_bytes, content_type)."""
    client = _get_client()
    bucket = os.environ.get("R2_BUCKET_NAME")
    resp = client.get_object(Bucket=bucket, Key=path)
    data = resp["Body"].read()
    content_type = resp.get("ContentType", "application/octet-stream")
    return data, content_type


def get_public_url(path: str) -> str:
    """Return direct public R2 URL for a file path."""
    base = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")
    return f"{base}/{path}"


def delete_object(path: str):
    """Delete file from R2."""
    client = _get_client()
    bucket = os.environ.get("R2_BUCKET_NAME")
    client.delete_object(Bucket=bucket, Key=path)
