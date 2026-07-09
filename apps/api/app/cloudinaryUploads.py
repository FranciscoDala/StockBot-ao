import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage  # JEITO CERTO de importar
from fastapi import UploadFile  # Faltava isso
from app.core.config import settings

cloudinary.config(
    cloud_name = settings.CLOUDINARY_CLOUD_NAME,
    api_key = settings.CLOUDINARY_API_KEY,
    api_secret = settings.CLOUDINARY_API_SECRET
)

def upload_telegram_photo(file_url: str):
    """Recebe URL do arquivo do Telegram e retorna link otimizado"""
    upload_result = cloudinary.uploader.upload(
        file_url,
        folder="stockbot/apps/uploads/produtos",
        resource_type="image"
    )

    public_id = upload_result['public_id']

    optimized_url = CloudinaryImage(public_id).build_url(  # Sem "cloudinary." na frente
        fetch_format="auto",
        quality="auto"
    )

    return {
        "original_url": upload_result['secure_url'],
        "optimized_url": optimized_url,
        "public_id": public_id,
        "width": upload_result['width'],
        "height": upload_result['height'],
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "format": upload_result['format']
    }

def upload_image_to_cloudinary(file: UploadFile):
    """Recebe UploadFile do FastAPI e retorna link otimizado"""
    upload_result = cloudinary.uploader.upload(
        file.file,  # .file pq é UploadFile do FastAPI
        folder="stockbot/apps/uploads/produtos",
        resource_type="image"
    )

    public_id = upload_result['public_id']

    optimized_url = CloudinaryImage(public_id).build_url(  # Sem "cloudinary." na frente
        fetch_format="auto",
        quality="auto"
    )

    return {
        "original_url": upload_result['secure_url'],
        "optimized_url": optimized_url,
        "public_id": public_id,
        "width": upload_result['width'],
        "height": upload_result['height'],
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "format": upload_result['format']
    }
