import io
import os
import re
import time
import requests
import boto3
import pillow_avif  # noqa: F401 — registers AVIF support with Pillow as a side effect
from PIL import Image
from dotenv import load_dotenv

load_dotenv(os.path.join('Backend', '.env'))

BANNER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://redacted-site.com/',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
}

R2_FOLDER = 'visual_novel'

def _get_r2_client():
    account_id = os.getenv('R2_ACCOUNT_ID')
    return boto3.client(
        's3',
        endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
        aws_access_key_id=os.getenv('R2_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('R2_SECRET_KEY'),
        region_name='auto',
    )

def format_game_filename(game_name: str) -> str:
    """Replicates frontend formatUnderscoreName(removeSpecialCharacters(game)) logic"""
    cleaned = re.sub(r'[^a-zA-Z0-9 ]', '', game_name)
    return cleaned.replace(' ', '_').lower()

def download_banner(banner_url: str, game_name: str, retries: int = 3) -> dict:
    """
    Download a banner image, convert to JPG, and upload to R2.
    Retries up to `retries` times on timeout. Raises on failure.
    """
    print(f"Downloading banner from: {banner_url}")
    last_error = None
    img_response = None
    for attempt in range(1, retries + 1):
        try:
            img_response = requests.get(banner_url, headers=BANNER_HEADERS, timeout=120)
            img_response.raise_for_status()
            break
        except requests.exceptions.Timeout as e:
            print(f"Attempt {attempt}/{retries} timed out, waiting before retry...")
            last_error = e
            if attempt < retries:
                time.sleep(5)
    if img_response is None:
        raise last_error

    print(f"Downloaded {len(img_response.content)} bytes, Content-Type: {img_response.headers.get('Content-Type')}")

    # Convert to JPG — raises if conversion fails (no fallback, DB only accepts .jpg)
    img = Image.open(io.BytesIO(img_response.content))
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    jpg_buffer = io.BytesIO()
    img.save(jpg_buffer, format='JPEG', quality=85)
    jpg_buffer.seek(0)

    filename = f"{format_game_filename(game_name)}.jpg"
    r2_key = f"{R2_FOLDER}/{filename}"

    r2 = _get_r2_client()
    bucket = os.getenv('BUCKET')
    r2.upload_fileobj(
        jpg_buffer,
        bucket,
        r2_key,
        ExtraArgs={'ContentType': 'image/jpeg'},
    )
    print(f"Uploaded to R2: {r2_key}")

    return {'filename': filename, 'r2_key': r2_key}
