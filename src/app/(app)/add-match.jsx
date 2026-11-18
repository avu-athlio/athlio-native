import { useRouter } from 'expo-router';
import { LinkSimple, ShareNetwork, X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClubPickerSheet from '@/components/compose/ClubPickerSheet';
import MatchPostEditor from '@/components/compose/MatchPostEditor';
import { ChipGroup, DateField, FieldBox, SelectField, StepperField, WheelField } from '@/components/compose/Pickers';
import SuccessSheet from '@/components/compose/SuccessSheet';
import { finishCompose } from '@/components/compose/finish';
import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { formatMatchDate } from '@/lib/format';
import { createMatch, createPost, fetchClub } from '@/lib/posts';
import { colors, fonts } from '@/theme';

const opts = (values, label = String) => values.map((v) => ({ value: v, label: label(v) }));
const MATCH_TYPES = opts([
  'League match',
  'Cup match',
  'Friendly match',
  'National teams match',
  'National teams match (friendly)',
]);
// "Hobro IK - Superliga", as in the design.
const clubLabel = (club) => (club ? [club.name, club.league].filter(Boolean).join(' - ') : '');

const MINUTES = Array.from({ length: 121 }, (_, i) => i);
const CARDS = [
  { value: 'none', label: 'None' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
];

/**
 * Port of pages/AddMatch: the match form, then "Make a post" (optional),
 * then "Match is added". Unlike the web, a failed save or post shows an
 * error instead of silently moving on.
 */
export default function AddMatch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();

  const [form, setForm] = useState({
    homeOrAway: null,
    league: 'League match',
    date: '',
    yourTeam: null,
    opponent: null,
    yourScore: null,
    opponentScore: null,
    participation: 'full',
    minutes: 90,
    goals: 0,
    assists: 0,
    cards: 'none',
  });
  const [errors, setErrors] = useState({});
  const [sheet, setSheet] = useState(null); // 'your-team' | 'opponent'
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('form'); // form | make-post | between | added
  const [matchId, setMatchId] = useState(null);

  const patch = (v) => setForm((f) => ({ ...f, ...v }));

  // iOS can't present a modal while another is still animating out, so let
  // "Make a post" finish closing before "Match is added" opens.
  const afterMakePost = () => {
    setStep('between');
    setTimeout(() => setStep('added'), 400);
  };
  const clearError = (key) => setErrors((e) => ({ ...e, [key]: null }));

  // Prefill "Your team" with my club.
  useEffect(() => {
    if (!profile?.club_id) return undefined;
    let cancelled = false;
    fetchClub(profile.club_id).then((club) => {
      if (!cancelled && club) setForm((f) => (f.yourTeam ? f : { ...f, yourTeam: club }));
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.club_id]);

  const save = async () => {
    const e = {};
    if (!form.homeOrAway) e.homeOrAway = 'Please select Home or Away match';
    if (!form.date) e.date = 'Date is required';
    if (!form.yourTeam) e.yourTeam = 'Your team is required';
    if (!form.opponent) e.opponent = 'Opponent team is required';
    if (form.yourScore == null || form.opponentScore == null) e.score = 'Enter both scores';
    setErrors(e);
    if (Object.keys(e).length || saving) return;

    setSaving(true);
    try {
      setMatchId(await createMatch(user.id, form));
      setStep('make-post');
    } catch (err) {
      Alert.alert('Could not add the match', err?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const card = {
    yourTeam: form.yourTeam?.name || '—',
    yourTeamLogoUrl: form.yourTeam?.logo_url,
    yourScore: form.yourScore ?? 0,
    opponent: form.opponent?.name || '—',
    opponentLogoUrl: form.opponent?.logo_url,
    opponentScore: form.opponentScore ?? 0,
    league: form.league,
    date: formatMatchDate(form.date),
    goalsCount: form.goals,
    assistsCount: form.assists,
    minCount: form.minutes,
    yellowCards: form.cards === 'yellow' ? 1 : 0,
    redCards: form.cards === 'red' ? 1 : 0,
  };

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Add your match"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.group}>
          <ChipGroup
            options={[
              { value: 'home', label: 'Home match' },
              { value: 'away', label: 'Away match' },
            ]}
            value={form.homeOrAway}
            onChange={(v) => {
              patch({ homeOrAway: v });
              clearError('homeOrAway');
            }}
            error={errors.homeOrAway}
          />
          <SelectField label="Type" title="Pick the type" value={form.league} options={MATCH_TYPES} onChange={(v) => patch({ league: v })} />
          <DateField
            label="Date"
            required
            value={form.date}
            onChange={(v) => {
              patch({ date: v });
              clearError('date');
            }}
            error={errors.date}
          />
          <FieldBox
            label="Your team"
            required
            value={clubLabel(form.yourTeam)}
            placeholder="Choose your team"
            onPress={() => setSheet('your-team')}
            error={errors.yourTeam}
          />
          <FieldBox
            label="Opponent team"
            required
            value={clubLabel(form.opponent)}
            placeholder="Choose opponent team"
            onPress={() => setSheet('opponent')}
            error={errors.opponent}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.section}>Result</Text>
          <View>
            <View style={styles.scoreRow}>
              <StepperField
                label="Score"
                required
                title="Your team score"
                placeholder="Your team"
                value={form.yourScore}
                onChange={(v) => {
                  patch({ yourScore: v });
                  clearError('score');
                }}
                style={styles.cell}
              />
              <View style={styles.dash} />
              <StepperField
                label="Score"
                required
                title="Your opponent score"
                placeholder="Opponent"
                value={form.opponentScore}
                onChange={(v) => {
                  patch({ opponentScore: v });
                  clearError('score');
                }}
                style={styles.cell}
              />
            </View>
            {errors.score ? <Text style={styles.error}>{errors.score}</Text> : null}
          </View>
        </View>

        <View style={styles.performance}>
          <Text style={styles.section}>Your performance</Text>
          <View style={styles.group}>
            <ChipGroup
              options={[
                { value: 'full', label: 'Full match' },
                { value: 'subbed_off', label: 'Subbed off' },
                { value: 'subbed_on', label: 'Subbed on' },
              ]}
              value={form.participation}
              onChange={(v) => patch({ participation: v })}
            />
            <View style={styles.row}>
              <WheelField
                label="Minutes played"
                required
                value={form.minutes}
                items={MINUTES}
                format={(m) => `${m} min`}
                onChange={(v) => patch({ minutes: v })}
                style={styles.cell}
              />
              <StepperField
                label="Goals"
                required
                title="Your goals"
                value={form.goals}
                onChange={(v) => patch({ goals: v })}
                style={styles.cell}
              />
            </View>
            <View style={styles.row}>
              <StepperField
                label="Assists"
                required
                title="Your assists"
                value={form.assists}
                onChange={(v) => patch({ assists: v })}
                style={styles.cell}
              />
              <SelectField
                label="Cards"
                required
                title="Cards"
                value={form.cards}
                options={CARDS}
                onChange={(v) => patch({ cards: v })}
                style={styles.cell}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label={saving ? 'Adding…' : 'Add match'} type="primary" size="big" disabled={saving} onPress={save} />
      </View>

      <ClubPickerSheet
        visible={sheet === 'your-team'}
        title="Pick your team"
        manualLabel="Add your team manually"
        searchPlaceholder="Search for your team"
        country={profile?.country}
        value={form.yourTeam}
        onChange={(club) => {
          patch({ yourTeam: club });
          clearError('yourTeam');
        }}
        onClose={() => setSheet(null)}
      />
      <ClubPickerSheet
        visible={sheet === 'opponent'}
        title="Pick opponent team"
        manualLabel="Add opponent team manually"
        searchPlaceholder="Search for opponent team"
        country={profile?.country}
        value={form.opponent}
        onChange={(club) => {
          patch({ opponent: club });
          clearError('opponent');
        }}
        onClose={() => setSheet(null)}
      />

      <MakePostSheet
        visible={step === 'make-post'}
        card={card}
        uid={user.id}
        matchId={matchId}
        onDone={afterMakePost}
      />

      <SuccessSheet
        visible={step === 'added'}
        title="Match is added"
        subtitle="Share link with your coach to get verification badge"
        autoClose={false}
        onClose={() => finishCompose(router)}>
        <MatchLink matchId={matchId} />
      </SuccessSheet>
    </View>
  );
}

// AddMatch's "Make a post" sheet: Skip, or Publish a match post.
function MakePostSheet({ visible, card, uid, matchId, onDone }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      await createPost({ uid, type: 'match', content: caption, images, matchId });
      onDone();
    } catch (e) {
      Alert.alert('Could not publish the post', e?.message ?? 'The match is saved. Try again or skip.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDone} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { maxHeight: height * 0.9 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              Make a post
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onDone} style={styles.sheetClose}>
              <X size={20} color={colors.black} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            <MatchPostEditor
              card={card}
              images={images}
              onImagesChange={setImages}
              caption={caption}
              onCaptionChange={setCaption}
            />
          </ScrollView>
          <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <Pressable accessibilityRole="button" onPress={onDone} disabled={publishing} hitSlop={8} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Button label={publishing ? 'Publishing…' : 'Publish'} type="primary" size="medium" disabled={publishing} onPress={publish} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// NOTE: athlio.app/match/<id> is the web's link; that page doesn't exist yet.
function MatchLink({ matchId }) {
  const link = `https://athlio.app/match/${matchId ?? ''}`;
  return (
    <View style={styles.linkRow}>
      <LinkSimple size={18} color={colors.primary.default} />
      <Text style={styles.linkText} numberOfLines={1}>
        {link}
      </Text>
      <IconButton
        size="small"
        icon={ShareNetwork}
        color={colors.neutral[700]}
        accessibilityLabel="Share match link"
        onPress={() => Share.share({ message: link }).catch(() => {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 32 },
  group: { gap: 16 },
  performance: { gap: 12 },
  section: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cell: { flex: 1 },
  dash: { width: 8, height: 1.5, marginHorizontal: 4, borderRadius: 1, backgroundColor: colors.neutral[300] },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.negative.default, marginTop: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: colors.neutral.bg },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white, overflow: 'hidden' },
  sheetHeader: { alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingHorizontal: 16 },
  sheetTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  sheetClose: { position: 'absolute', right: 16, top: 20, padding: 4 },
  sheetBody: { padding: 16 },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  skip: { paddingVertical: 10, paddingHorizontal: 8 },
  skipText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary.default },

  linkRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
  },
  linkText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.primary.default },
});
