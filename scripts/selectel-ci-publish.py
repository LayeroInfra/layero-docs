"""Publish the current docs build with the S3 SDK and verify its marker."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import mimetypes
import os
from pathlib import Path

import boto3
from botocore.config import Config


def metadata(path):
    suffix = path.suffix.lower()
    types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".json": "application/json",
        ".xml": "application/xml",
        ".md": "text/markdown; charset=utf-8",
        ".txt": "text/plain; charset=utf-8",
        ".map": "text/plain; charset=utf-8",
        ".svg": "image/svg+xml",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ico": "image/x-icon",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }
    ct = (
        types.get(suffix)
        or mimetypes.guess_type(str(path))[0]
        or "application/octet-stream"
    )
    if suffix in {".html", ".xml", ".txt", ".md"}:
        cc = "no-cache"
    elif path.parts[0] == "assets":
        cc = "public, max-age=31536000, immutable"
    else:
        cc = "public, max-age=3600"
    return ct, cc


def publish(client, directory, bucket, revision):
    marker = directory / "build-id.txt"
    if marker.read_text().strip() != revision:
        raise ValueError("build marker differs from requested revision")
    files = sorted(p for p in directory.rglob("*") if p.is_file() and p != marker)

    def put(path):
        ct, cc = metadata(path.relative_to(directory))
        with path.open("rb") as stream:
            client.put_object(
                Bucket=bucket,
                Key=path.relative_to(directory).as_posix(),
                Body=stream,
                ContentType=ct,
                CacheControl=cc,
            )

    # SDK signs payloads consistently, reuses connections and does not put
    # credentials in curl argv. No object ACL: the existing bucket is public.
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(put, files))
    # A failed transfer must never publish a success marker.
    put(marker)
    body = client.get_object(Bucket=bucket, Key="build-id.txt")["Body"].read()
    if body.decode().strip() != revision:
        raise ValueError("stored build marker mismatch")
    return len(files) + 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build", type=Path, default=Path("build"))
    args = parser.parse_args()
    access = os.environ["SELECTEL_S3_ACCESS_KEY"]
    secret = os.environ["SELECTEL_S3_SECRET_KEY"]
    if not access or not secret:
        raise ValueError(
            "Selectel credentials missing; current docs origin requires them"
        )
    client = boto3.client(
        "s3",
        endpoint_url="https://s3.ru-6.storage.selcloud.ru",
        region_name="ru-6",
        aws_access_key_id=access,
        aws_secret_access_key=secret,
        config=Config(
            signature_version="s3v4",
            max_pool_connections=8,
            s3={"addressing_style": "path"},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )
    count = publish(client, args.build, "layero-docs", os.environ["BUILD_ID"])
    print(f"Selectel: {count} files published; stored build marker verified")


if __name__ == "__main__":
    main()
