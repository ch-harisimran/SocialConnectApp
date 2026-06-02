import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const POST_IMAGES_BUCKET = 'post-images';
const PROFILE_IMAGES_BUCKET = 'profile-images';

const isRemoteUrl = (uri: string): boolean =>
  uri.startsWith('http://') || uri.startsWith('https://');

const getExtension = (uri: string): string => {
  const match = uri.match(/\.(\w+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
};

const getContentType = (ext: string): string => {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

const uploadToBucket = async (
  bucket: string,
  localUri: string,
  filePath: string
): Promise<string> => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return localUri;
  }

  const ext = getExtension(localUri);
  const contentType = getContentType(ext);

  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn('Image upload failed, using local URI:', error.message);
      return localUri;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (err) {
    console.warn('Image upload failed, using local URI:', err);
    return localUri;
  }
};

export const imageUploadService = {
  async uploadPostImage(localUri: string, userId: string): Promise<string> {
    if (isRemoteUrl(localUri)) return localUri;

    const ext = getExtension(localUri);
    const filePath = `${userId}/${Date.now()}.${ext}`;
    return uploadToBucket(POST_IMAGES_BUCKET, localUri, filePath);
  },

  async uploadProfileImage(localUri: string, userId: string): Promise<string> {
    if (isRemoteUrl(localUri)) return localUri;

    const ext = getExtension(localUri);
    const filePath = `${userId}/avatar.${ext}`;
    return uploadToBucket(PROFILE_IMAGES_BUCKET, localUri, filePath);
  },
};
