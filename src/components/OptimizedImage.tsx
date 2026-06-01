import React, { memo } from 'react';
import { Image, ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

type ImagePriority = 'low' | 'normal' | 'high';

interface OptimizedImageProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  priority?: ImagePriority;
  recyclingKey?: string;
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  contentFit = 'cover',
  priority = 'normal',
  recyclingKey,
}) => {
  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={150}
      recyclingKey={recyclingKey ?? uri}
      priority={priority}
    />
  );
};

const OptimizedImage = memo(OptimizedImageComponent);
OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
