import { View } from 'react-native';

import { styles } from '@/components/post/BasicPost';
import MediaCarousel from '@/components/post/MediaCarousel';
import PostActions from '@/components/post/PostActions';
import PostCaption from '@/components/post/PostCaption';
import PostHeader from '@/components/post/PostHeader';
import TrainingCard from '@/components/training/TrainingCard';

// Post about a logged training: training card, then any photos as a carousel.
export default function TrainingPost({ header, actions, content, mediaUrls, training }) {
  return (
    <View style={styles.post}>
      <PostHeader {...header} />
      <PostCaption content={content} />
      <TrainingCard training={training} bordered />
      <MediaCarousel urls={mediaUrls} />
      <PostActions {...actions} />
    </View>
  );
}
