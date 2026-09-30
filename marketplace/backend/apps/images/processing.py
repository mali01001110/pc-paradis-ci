"""Server-side image processing (spec §40: compression + resize)."""
from io import BytesIO

from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image

MAX_DIMENSION = 1920
JPEG_QUALITY = 85
WEBP_QUALITY = 85

# Formats we accept and their Pillow save parameters.
_FORMATS = {
    "JPEG": ("JPEG", {"quality": JPEG_QUALITY, "optimize": True}),
    "PNG": ("PNG", {"optimize": True}),
    "WEBP": ("WEBP", {"quality": WEBP_QUALITY}),
}


class UnsupportedImageFormat(ValueError):
    pass


def process_image(file) -> InMemoryUploadedFile:
    """Re-encode and downscale an uploaded image in place.

    - Longest side capped at MAX_DIMENSION (aspect preserved, no upscale)
    - Re-encoded at reduced quality (compression)
    - Format preserved (JPEG/PNG/WebP); anything else is rejected
    """
    img = Image.open(file)
    img_format = (img.format or "").upper()
    if img_format not in _FORMATS:
        raise UnsupportedImageFormat(f"Unsupported image format: {img_format or 'unknown'}")

    if img.mode not in ("RGB", "RGBA", "L"):
        img = img.convert("RGBA" if img.mode == "P" and "transparency" in img.info else "RGB")

    width, height = img.size
    longest = max(width, height)
    if longest > MAX_DIMENSION:
        scale = MAX_DIMENSION / longest
        img = img.resize(
            (round(width * scale), round(height * scale)),
            Image.LANCZOS,
        )

    buffer = BytesIO()
    save_format, save_kwargs = _FORMATS[img_format]
    img.save(buffer, format=save_format, **save_kwargs)
    buffer.seek(0)

    name = file.name
    content_type = file.content_type or f"image/{img_format.lower()}"
    return InMemoryUploadedFile(
        buffer,
        "image",
        name,
        content_type,
        buffer.getbuffer().nbytes,
        file.charset,
    )
