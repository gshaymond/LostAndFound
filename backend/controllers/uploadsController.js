const { getPresignedUploadUrl } = require('../utils/s3');

const presign = async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const key = `uploads/${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    const { url, publicUrl } = await getPresignedUploadUrl(key, contentType);

    res.json({ url, key, publicUrl });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ error: 'Presign error' });
  }
};

module.exports = { presign };