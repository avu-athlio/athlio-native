import { View } from 'react-native';

import { styles } from '@/components/post/BasicPost';
import MatchCard from '@/components/post/MatchCard';
import MediaCarousel from '@/components/post/MediaCarousel';
import PostActions from '@/components/post/PostActions';
import PostCaption from '@/components/post/PostCaption';
import PostHeader from '@/components/post/PostHeader';

// Post with a match result. One photo goes inside the match card; two or more
// show as a carousel under it (same rule as the web).
export default function MatchPost({ header, actions, content, mediaUrls, match }) {
  const cardImageUrl = mediaUrls.length === 1 ? mediaUrls[0] : null;
  const carouselUrls = mediaUrls.length >= 2 ? mediaUrls : [];

  return (
    <View style={styles.post}>
      <PostHeader {...header} />
      <PostCaption content={content} />
      <MatchCard imageUrl={cardImageUrl} {...match} />
      <MediaCarousel urls={carouselUrls} />
      <PostActions {...actions} />
    </View>
  );
}
