// Lazy-load AWS SDK so tests can run without the dependency installed or env vars set
const getPresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET || !process.env.S3_REGION) {
    throw new Error('S3 not configured');
  }

  // require lazily
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read'
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  return { url, publicUrl };
};

module.exports = { getPresignedUploadUrl };