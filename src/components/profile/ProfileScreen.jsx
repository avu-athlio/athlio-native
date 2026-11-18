import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BookmarkSimple, GearSix, Plus, ShareNetwork } from 'phosphor-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/navigation/TabBar';
import { PageTopbar, TransparentTopbar } from '@/components/navigation/Topbar';
import CommentsSheet from '@/components/post/CommentsSheet';
import MatchCard from '@/components/post/MatchCard';
import PostSwitcher from '@/components/post/PostSwitcher';
import CareerHistory from '@/components/profile/CareerHistory';
import InfoCard from '@/components/profile/InfoCard';
import ProfessionalInfo from '@/components/profile/ProfessionalInfo';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SeasonPicker from '@/components/profile/SeasonPicker';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import PillTabs from '@/components/ui/PillTabs';
import { useUser } from '@/context/UserContext';
import { chatMissing, openDm } from '@/lib/chat';
import { useProfile } from '@/hooks/useProfile';
import { useProfilePosts } from '@/hooks/useProfilePosts';
import { formatMatchDate } from '@/lib/format';
import { fetchExperiences, fetchInfo, fetchMatches, saveProfile } from '@/lib/profile';
import { seasonStartYear } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';
import { isProfessional } from '@/utils/roles';

const noop = () => {};

/**
 * Port of pages/ProfileMe + ProfileOther: header, pill tabs and the tab body
 * in one FlatList, so the whole page scrolls and posts are virtualized.
 * Tabs: Posts · Info · Matches (athletes only). The web's Performance tab
 * (pros viewing athletes) comes with the Progress port.
 */
export default function ProfileScreen({ profileId, showBack = false }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { user, profile: myProfile, setProfile: setMyProfile, isScout } = useUser();
  const viewerId = user?.id ?? null;

  const page = useProfile(profileId, viewerId, profileId === viewerId ? myProfile : null);
  const { profile, isMe } = page;
  const posts = useProfilePosts(profileId, viewerId);

  const [tab, setTab] = useState('posts');
  const [season, setSeason] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [commentsTarget, setCommentsTarget] = useState(null);
  const [uploading, setUploading] = useState(false);

  const info = useLazy(useCallback(() => loadInfo(profileId, profile?.role), [profileId, profile?.role]));
  const matches = useLazy(useCallback(() => fetchMatches(profileId), [profileId]));

  const pro = isProfessional(profile?.role);
  const tabs = pro
    ? [
        { id: 'posts', label: 'Posts' },
        { id: 'info', label: 'Info' },
      ]
    : [
        { id: 'posts', label: 'Posts' },
        { id: 'info', label: 'Info' },
        { id: 'matches', label: 'Matches' },
      ];
  const currentTab = tabs.some((t) => t.id === tab) ? tab : 'posts';

  const changeTab = (id) => {
    setTab(id);
    if (id === 'info') info.ensure();
    if (id === 'matches') matches.ensure();
  };

  const seasons = useMemo(() => {
    const years = new Set((matches.data ?? []).map((m) => seasonStartYear(m.date_of_game)).filter((y) => y != null));
    return [...years].sort((a, b) => b - a);
  }, [matches.data]);

  const shownMatches = useMemo(
    () =>
      season === 'all'
        ? (matches.data ?? [])
        : (matches.data ?? []).filter((m) => seasonStartYear(m.date_of_game) === season),
    [matches.data, season],
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      page.load(),
      currentTab === 'posts' ? posts.load() : null,
      currentTab === 'info' ? info.reload() : null,
      currentTab === 'matches' ? matches.reload() : null,
    ]);
    setRefreshing(false);
  };

  const openProfile = useCallback(
    (id) => {
      if (!id || id === profileId) return;
      if (id === viewerId) router.navigate('/profile');
      else router.push({ pathname: '/profile/[id]', params: { id } });
    },
    [router, profileId, viewerId],
  );
  const openComments = useCallback((postId, authorId) => setCommentsTarget({ postId, authorId }), []);
  const openEdit = () => router.push('/profile/edit');

  // Open (or start) my chat with this person.
  const message = async () => {
    try {
      const id = await openDm(profileId);
      router.push({ pathname: '/chat/[id]', params: { id } });
    } catch (e) {
      Alert.alert('Could not open the chat', chatMissing(e) ? 'Chat isn’t set up on the server yet.' : e?.message ?? 'Try again.');
    }
  };

  const share = () => {
    const name = profile?.full_name || profile?.username || 'this athlete';
    Share.share({ message: `${name} on Athlio\nathlio://profile/${profileId}` }).catch(noop);
  };

  // No picture yet: pick and upload straight away. Otherwise go to Edit (as on web).
  const onAvatarPress = async () => {
    if (profile?.avatar_url) return openEdit();
    if (uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const saved = await saveProfile(viewerId, {}, { uri: asset.uri, mimeType: asset.mimeType });
      setMyProfile(saved);
      page.setProfile((p) => ({ ...p, avatar_url: saved.avatar_url }));
    } catch (e) {
      Alert.alert('Could not update photo', e?.message ?? 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderItem = useCallback(
    ({ item }) => {
      if (item.kind === 'match') {
        const m = item.match;
        return (
          <View style={styles.item}>
            <MatchCard
              yourTeam={m.your_team || profile?.club?.name || '—'}
              yourTeamLogoUrl={profile?.club?.logo_url}
              yourScore={Number(m.your_score) || 0}
              opponent={m.opponent ?? ''}
              opponentLogoUrl={m.opponent_club?.logo_url}
              opponentScore={Number(m.opponent_score) || 0}
              league={m.league ?? ''}
              date={formatMatchDate(m.date_of_game)}
              goalsCount={Number(m.goals) || 0}
              assistsCount={Number(m.assists) || 0}
              minCount={Number(m.minutes_played) || 0}
              yellowCards={Number(m.yellow_cards) || 0}
              redCards={Number(m.red_cards) || 0}
            />
          </View>
        );
      }
      return (
        <View style={styles.item}>
          <PostSwitcher
            post={item.post}
            liked={posts.likedIds.has(item.post.id)}
            showFollow={false}
            onToggleLike={posts.toggleLike}
            onToggleFollow={noop}
            onOpenComments={openComments}
            onOpenProfile={openProfile}
          />
        </View>
      );
    },
    [profile?.club, posts.likedIds, posts.toggleLike, openComments, openProfile],
  );

  const data = useMemo(() => {
    if (currentTab === 'posts') return posts.posts.map((p) => ({ key: `p-${p.id}`, kind: 'post', post: p }));
    if (currentTab === 'matches') return shownMatches.map((m) => ({ key: `m-${m.id}`, kind: 'match', match: m }));
    return [];
  }, [currentTab, posts.posts, shownMatches]);

  // ---- top bar ----
  const topbar = isMe ? (
    <TransparentTopbar
      showBack={showBack}
      right={
        <IconButton
          size="small"
          icon={GearSix}
          color={colors.white}
          onPress={() => router.push('/settings')}
          accessibilityLabel="Settings"
        />
      }
    />
  ) : (
    <TransparentTopbar
      showBack={showBack}
      right={
        <>
          {isScout && profile && !pro ? (
            <IconButton
              size="small"
              icon={BookmarkSimple}
              color={colors.white}
              onPress={page.toggleWatchlist}
              weight={page.watchlisted ? 'fill' : 'regular'}
              accessibilityLabel={page.watchlisted ? 'Remove from watchlist' : 'Save to watchlist'}
            />
          ) : null}
          <IconButton size="small" icon={ShareNetwork} color={colors.white} onPress={share} accessibilityLabel="Share profile" />
        </>
      }
    />
  );

  if (!profile) {
    return (
      <View style={styles.screen}>
        <PageTopbar showBack={showBack} />
        <View style={styles.center}>
          {page.status === 'loading' ? (
            <ActivityIndicator color={colors.primary.default} />
          ) : (
            <>
              <Text style={styles.message}>
                {page.status === 'notfound' ? 'Profile not found.' : "Couldn't load profile."}
              </Text>
              {page.status === 'error' ? (
                <Button type="secondary" size="small" label="Try again" onPress={page.retry} />
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  const header = (
    <View>
      <ProfileHeader
        profile={profile}
        isMe={isMe}
        following={page.following}
        followBusy={page.followBusy}
        onToggleFollow={page.toggleFollow}
        onMessage={message}
        onEdit={openEdit}
        onShare={share}
        onAvatarPress={onAvatarPress}
        onOpenFollowing={() => router.push('/profile/following')}
      />
      <PillTabs tabs={tabs} activeTab={currentTab} onTabChange={changeTab} />
      {currentTab === 'matches' && matches.data?.length ? (
        <View style={styles.seasonRow}>
          <SeasonPicker seasons={seasons} value={season} onChange={setSeason} />
        </View>
      ) : null}
    </View>
  );

  const empty = (() => {
    if (currentTab === 'posts') {
      if (posts.status === 'loading') return <Loading />;
      if (posts.status === 'error') return <Retry onPress={posts.retry} />;
      return isMe ? (
        <EmptyState title="Your feed is empty." subtitle="Add your first post." onAdd={() => router.push('/add-post')} />
      ) : (
        <EmptyState title="No posts yet." />
      );
    }
    if (currentTab === 'matches') {
      if (matches.status !== 'ready') return matches.status === 'error' ? <Retry onPress={matches.reload} /> : <Loading />;
      if (matches.data.length) return <EmptyState title="No matches this season." />;
      return isMe ? (
        <EmptyState
          title="Your match history is empty."
          subtitle="Add your first match."
          onAdd={() => router.push('/add-match')}
        />
      ) : (
        <EmptyState title="No match history yet." />
      );
    }
    // Info
    if (info.status !== 'ready') return info.status === 'error' ? <Retry onPress={info.reload} /> : <Loading />;
    return (
      <View style={styles.infoTab}>
        {pro ? (
          <ProfessionalInfo profile={profile} experiences={info.data.experiences} isMe={isMe} onEdit={openEdit} />
        ) : (
          <>
            <InfoCard
              info={info.data.info}
              location={[profile.city, profile.country].filter(Boolean).join(', ') || null}
              isMe={isMe}
              onAddInfo={openEdit}
            />
            <CareerHistory club={profile.club} experiences={info.data.experiences} />
          </>
        )}
      </View>
    );
  })();

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          currentTab === 'posts' && posts.loadingMore ? (
            <ActivityIndicator style={styles.footer} color={colors.primary.default} />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: isMe && !showBack ? tabBarSpace : insets.bottom + 24 }}
        onEndReached={currentTab === 'posts' ? posts.loadMore : undefined}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary.default}
            colors={[colors.primary.default]}
            progressViewOffset={insets.top}
          />
        }
        windowSize={7}
      />
      {topbar}
      {uploading ? (
        <View style={styles.uploading} pointerEvents="none">
          <ActivityIndicator color={colors.white} />
        </View>
      ) : null}

      <CommentsSheet
        target={commentsTarget}
        onClose={() => setCommentsTarget(null)}
        onCommentAdded={posts.commentAdded}
        onOpenProfile={openProfile}
      />
    </View>
  );
}

async function loadInfo(profileId, role) {
  const [info, experiences] = await Promise.all([
    isProfessional(role) ? null : fetchInfo(profileId),
    fetchExperiences(profileId),
  ]);
  return { info, experiences };
}

// Loads on first `ensure()` (when its tab opens), `reload()` on pull-to-refresh.
function useLazy(fetcher) {
  const [state, setState] = useState({ status: 'idle', data: null });
  const startedRef = useRef(false);

  const reload = useCallback(
    () =>
      fetcher().then(
        (data) => setState({ status: 'ready', data }),
        (e) => {
          console.warn('profile tab', e?.message);
          setState((s) => (s.status === 'ready' ? s : { status: 'error', data: null }));
        },
      ),
    [fetcher],
  );

  const ensure = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setState((s) => ({ ...s, status: 'loading' }));
    reload();
  }, [reload]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
    return reload();
  }, [reload]);

  return { ...state, ensure, reload: state.status === 'error' ? retry : reload };
}

function Loading() {
  return <ActivityIndicator style={styles.loading} color={colors.primary.default} />;
}

function Retry({ onPress }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.message}>Couldn&apos;t load this.</Text>
      <Button type="secondary" size="small" label="Try again" onPress={onPress} />
    </View>
  );
}

function EmptyState({ title, subtitle, onAdd }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {onAdd ? <IconButton size="medium" type="primary" icon={Plus} onPress={onAdd} accessibilityLabel="Add" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  item: { paddingHorizontal: 16, paddingBottom: 8 },
  seasonRow: { paddingHorizontal: 16, paddingBottom: 8, zIndex: 1 },
  infoTab: { paddingHorizontal: 16, gap: 24 },
  footer: { paddingVertical: 16 },
  loading: { paddingVertical: 32 },
  message: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, textAlign: 'center' },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700], marginBottom: 8 },
  uploading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
});
