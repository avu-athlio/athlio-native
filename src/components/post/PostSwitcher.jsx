import { memo } from 'react';

import BasicPost from '@/components/post/BasicPost';
import MatchPost from '@/components/post/MatchPost';
import { formatMatchDate, formatPostDate } from '@/lib/format';

// Maps a joined `posts` row to BasicPost / MatchPost. Memoized so a like on one
// post doesn't re-render the others — pass stable (useCallback) handlers.
function PostSwitcher({ post, liked, showFollow, onToggleLike, onToggleFollow, onOpenComments, onOpenProfile }) {
  const prof = post.profiles || {};
  const club = prof.club || {};
  const authorId = prof.id || post.author_id;
  const mediaUrls = post.media_urls?.length ? post.media_urls : post.media ? [post.media] : [];

  const header = {
    name: prof.full_name || prof.username || '',
    avatarUrl: prof.avatar_url,
    position: prof.position,
    club: club.name,
    date: formatPostDate(post.created_at),
    showFollow,
    onFollow: () => onToggleFollow(authorId, false),
    onOpenProfile: () => onOpenProfile(authorId),
  };

  const actions = {
    liked,
    likesCount: Number(post.likes_count) || 0,
    commentsCount: Number(post.comments_count) || 0,
    onToggleLike: () => onToggleLike(post.id, authorId, liked),
    onOpenComments: () => onOpenComments(post.id, authorId),
  };

  if (post.type === 'match') {
    const m = post.match || {};
    const match = {
      yourTeam: m.your_team || club.name,
      yourTeamLogoUrl: club.logo_url,
      yourScore: Number(m.your_score) || 0,
      opponent: m.opponent ?? '',
      opponentLogoUrl: m.opponent_club?.logo_url,
      opponentScore: Number(m.opponent_score) || 0,
      league: m.league ?? '',
      date: formatMatchDate(m.date_of_game),
      goalsCount: Number(m.goals) || 0,
      assistsCount: Number(m.assists) || 0,
      minCount: Number(m.minutes_played) || 0,
      yellowCards: Number(m.yellow_cards) || 0,
      redCards: Number(m.red_cards) || 0,
    };
    return <MatchPost header={header} actions={actions} content={post.content} mediaUrls={mediaUrls} match={match} />;
  }

  return <BasicPost header={header} actions={actions} content={post.content} mediaUrls={mediaUrls} />;
}

export default memo(PostSwitcher);
