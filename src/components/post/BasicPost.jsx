import { StyleSheet, View } from 'react-native';

import MediaCarousel from '@/components/post/MediaCarousel';
import PostActions from '@/components/post/PostActions';
import PostCaption from '@/components/post/PostCaption';
import PostHeader from '@/components/post/PostHeader';
import { colors } from '@/theme';

// Text / photo post. `header` and `actions` are the props for PostHeader / PostActions.
export default function BasicPost({ header, actions, content, mediaUrls }) {
  return (
    <View style={styles.post}>
      <PostHeader {...header} />
      <PostCaption content={content} />
      <MediaCarousel urls={mediaUrls} />
      <PostActions {...actions} />
    </View>
  );
}

export const styles = StyleSheet.create({
  post: {
    gap: 16,
    alignItems: 'flex-start',
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
});
