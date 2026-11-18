import { Image } from 'expo-image';
import { MapPin, ShareFat } from 'phosphor-react-native';
import { Linking, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');

// "Sat, 1 Nov at 14:00", or "23 - 25 Nov" for a multi-day event (shown uppercase).
export function formatEventDate(startsAt, endsAt) {
  if (!startsAt) return '';
  const s = new Date(startsAt);
  const e = endsAt ? new Date(endsAt) : null;
  if (e && e.toDateString() !== s.toDateString()) {
    const sameMonth = e.getMonth() === s.getMonth();
    return sameMonth
      ? `${s.getDate()} - ${e.getDate()} ${MONTHS[s.getMonth()]}`
      : `${s.getDate()} ${MONTHS[s.getMonth()]} - ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  return `${DAYS[s.getDay()]}, ${s.getDate()} ${MONTHS[s.getMonth()]} at ${pad2(s.getHours())}:${pad2(s.getMinutes())}`;
}

// "Mikkel S. and Dan Ø. will join"
export function attendeesText(people = []) {
  const short = (n = '') => {
    const [first, ...rest] = n.trim().split(/\s+/);
    return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
  };
  const names = people.map((p) => short(p.full_name)).filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return `${names[0]} will join`;
  if (names.length === 2) return `${names[0]} and ${names[1]} will join`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more will join`;
}

export function openInMaps(event) {
  const q = encodeURIComponent(event.location_address || `${event.latitude},${event.longitude}`);
  const url = Platform.OS === 'ios' ? `https://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
  Linking.openURL(url).catch(() => {});
}

export function shareEvent(event) {
  const when = formatEventDate(event.starts_at, event.ends_at);
  const message = [event.title, when, event.location_address].filter(Boolean).join('\n');
  Share.share({ message }).catch(() => {});
}

function DateBadge({ event, small }) {
  return (
    <View style={[styles.badge, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, small && styles.badgeTextSmall]}>{formatEventDate(event.starts_at, event.ends_at)}</Text>
    </View>
  );
}

function Address({ event, small }) {
  if (!event.location_address) return null;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${event.location_address}, open in maps`}
      onPress={() => openInMaps(event)}
      hitSlop={6}
      style={styles.address}>
      <MapPin size={small ? 16 : 18} color={colors.neutral[800]} />
      <Text style={[styles.addressText, small && styles.addressTextSmall]} numberOfLines={1}>
        {event.location_address}
      </Text>
    </Pressable>
  );
}

function Actions({ event, onMore }) {
  return (
    <View style={styles.actions}>
      <Button size="small" type="primary" label="View more" onPress={onMore} style={styles.more} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Share ${event.title}`}
        onPress={() => shareEvent(event)}
        style={({ pressed }) => [styles.share, pressed && styles.pressed]}>
        <ShareFat size={20} color={colors.black} />
      </Pressable>
    </View>
  );
}

/** Figma event card. variant "big" (All tab) | "small" (Events tab, image on the left). */
export default function EventCard({ event, variant = 'big', onMore }) {
  if (variant === 'small') {
    return (
      <View style={styles.small}>
        <Image source={{ uri: event.image_url }} style={styles.smallImage} contentFit="cover" transition={150} />
        <View style={styles.smallBody}>
          <View style={styles.smallText}>
            <DateBadge event={event} small />
            <Text style={styles.smallTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Address event={event} small />
          </View>
          <Actions event={event} onMore={onMore} />
        </View>
      </View>
    );
  }

  const joining = attendeesText(event.attendees);
  return (
    <View style={styles.big}>
      <View>
        <Image source={{ uri: event.image_url }} style={styles.bigImage} contentFit="cover" transition={150} />
        <View style={styles.bigBadge}>
          <DateBadge event={event} />
        </View>
      </View>
      <View style={styles.bigBody}>
        <View style={styles.bigText}>
          <Text style={styles.bigTitle}>{event.title}</Text>
          <Address event={event} />
        </View>
        {joining ? (
          <View style={styles.joining}>
            <View style={styles.faces}>
              {event.attendees.slice(0, 2).map((p, i) => (
                <View key={p.id} style={[styles.face, i > 0 && styles.faceOverlap]}>
                  <Avatar uri={p.avatar_url} size="small" />
                </View>
              ))}
            </View>
            <Text style={styles.joiningText} numberOfLines={1}>
              {joining}
            </Text>
          </View>
        ) : null}
        <Actions event={event} onMore={onMore} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary[100],
  },
  badgeSmall: { paddingHorizontal: 6 },
  badgeText: {
    fontFamily: fonts.semiboldItalic,
    fontSize: 14,
    letterSpacing: -0.14,
    textTransform: 'uppercase',
    color: colors.primary[800],
  },
  badgeTextSmall: { fontSize: 10, letterSpacing: -0.1 },
  address: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral[800],
    textDecorationLine: 'underline',
  },
  addressTextSmall: { fontFamily: fonts.medium, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  more: { flex: 1 },
  share: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },

  big: {
    gap: 11,
    paddingBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    boxShadow: '0 0 21px rgba(0,0,0,0.08)',
  },
  bigImage: { height: 153, borderRadius: 12, backgroundColor: colors.neutral[200] },
  bigBadge: { position: 'absolute', top: 10, right: 10 },
  bigBody: { gap: 12, paddingHorizontal: 16 },
  bigText: { gap: 4 },
  bigTitle: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, textTransform: 'uppercase', color: colors.black },
  joining: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faces: { flexDirection: 'row' },
  face: { borderWidth: 2, borderColor: colors.white, borderRadius: 999 },
  faceOverlap: { marginLeft: -10 },
  joiningText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[700] },

  small: { flexDirection: 'row', gap: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.white },
  smallImage: { width: 141, alignSelf: 'stretch', minHeight: 140, backgroundColor: colors.neutral[200] },
  smallBody: { flex: 1, minWidth: 0, justifyContent: 'space-between', gap: 12, paddingVertical: 8, paddingRight: 8 },
  smallText: { gap: 4 },
  smallTitle: { fontFamily: fonts.condensedBoldItalic, fontSize: 20, textTransform: 'uppercase', color: colors.black },
});
