import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const BUCKET = 'post-images';

const isRemoteUrl = (uri: string): boolean => uri.startsWith('http://') || uri.startsWith('https://');

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

export const imageUploadService = {
  async uploadPostImage(localUri: string, userId: string): Promise<string> {
    if (isRemoteUrl(localUri)) return localUri;

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      return localUri;
    }

    const ext = getExtension(localUri);
    const filePath = `${userId}/${Date.now()}.${ext}`;
    const contentType = getContentType(ext);

    const response = await fetch(localUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, {
      contentType,
      upsert: false,
    });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  },
};
