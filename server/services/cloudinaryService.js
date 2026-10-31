import { createHash } from 'node:crypto';

const signatureFor = (params, secret) => {
  const canonical = Object.entries(params).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join('&');
  return createHash('sha1').update(`${canonical}${secret}`).digest('hex');
};

export const uploadProfileImage = async ({ userId, bytes, contentType }) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error('Profile image storage is not configured. Set Cloudinary credentials on the server.');
    error.statusCode = 503;
    throw error;
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { overwrite: 'true', public_id: `medico/profiles/${userId}`, timestamp: String(timestamp) };
  const signature = signatureFor(params, apiSecret);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), `profile.${contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'}`);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('public_id', params.public_id);
  form.append('overwrite', 'true');
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(30_000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.secure_url !== 'string') {
    const error = new Error('Profile image upload failed. Check the configured storage credentials.');
    error.statusCode = 502;
    throw error;
  }
  return { url: result.secure_url, publicId: result.public_id };
};
