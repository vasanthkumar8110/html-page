import axios from 'axios';
import { apiClient } from './client';

export const uploadFile = async (file: { name: string; uri: string; type: string; size: number }) => {
  // 1. Request pre-signed URL from our backend
  const { data: { uploadUrl, fileId } } = await apiClient.post('/files/upload-url', {
    name: file.name,
    mimeType: file.type,
    size: file.size,
  });

  // 2. Upload directly to S3/R2 using the signed URL
  await axios.put(uploadUrl, {
    uri: file.uri,
    type: file.type,
  }, {
    headers: {
      'Content-Type': file.type,
    },
    // For large files, you'd use a chunked approach or RNS3
  });

  // 3. Confirm upload with our backend
  await apiClient.post(`/files/${fileId}/complete`);

  return fileId;
};
