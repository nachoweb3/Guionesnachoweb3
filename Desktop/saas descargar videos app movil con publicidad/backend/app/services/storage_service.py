import boto3
from botocore.exceptions import ClientError
import os
from typing import Optional
from ..config import get_settings
import uuid

settings = get_settings()


class StorageService:
    def __init__(self):
        self.s3_client = None
        self.bucket_name = settings.s3_bucket_name

        # Initialize S3 client if credentials are provided
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region
            )

    async def upload_file(self, filepath: str, object_name: Optional[str] = None) -> str:
        """Upload file to S3 and return public URL"""
        if not self.s3_client:
            # Fallback to local storage if S3 not configured
            return f"/tmp/videos/{os.path.basename(filepath)}"

        if object_name is None:
            object_name = f"videos/{uuid.uuid4()}_{os.path.basename(filepath)}"

        try:
            self.s3_client.upload_file(
                filepath,
                self.bucket_name,
                object_name,
                ExtraArgs={'ContentType': 'video/mp4', 'ACL': 'public-read'}
            )

            # Generate public URL
            url = f"https://{self.bucket_name}.s3.{settings.aws_region}.amazonaws.com/{object_name}"
            return url
        except ClientError as e:
            raise Exception(f"Error uploading to S3: {str(e)}")

    async def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """Generate presigned URL for temporary access"""
        if not self.s3_client:
            return f"/tmp/videos/{object_name}"

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Error generating presigned URL: {str(e)}")

    async def delete_file(self, object_name: str) -> bool:
        """Delete file from S3"""
        if not self.s3_client:
            # Try to delete from local storage
            try:
                os.remove(f"/tmp/videos/{object_name}")
                return True
            except:
                return False

        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            return True
        except ClientError as e:
            raise Exception(f"Error deleting from S3: {str(e)}")


storage_service = StorageService()
