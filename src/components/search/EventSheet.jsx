import { Image } from 'expo-image';
import { MapPin } from 'phosphor-react-native';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { attendeesText, formatEventDate, openInMaps, shareEvent } from '@/components/search/EventCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

// "View more" on an event card. There's no event page yet (the web linked to
// /event/:id, which didn't exist), so the details open in a sheet.
export default function EventSheet({ event, onClose }) {
  const { height } = useWindowDimensions();
  const joining = event ? attendeesText(event.attendees) : '';

  return (
    <BottomSheet
      variant="popover"
      visible={!!event}
      onClose={onClose}
      title="Event"
      footer={
        event ? (
          <View style={styles.footer}>
            <Button size="big" type="outlined" label="Share" onPress={() => shareEvent(event)} style={styles.half} />
            {event.location_address || event.latitude != null ? (
              <Button size="big" type="primary" label="Directions" onPress={() => openInMaps(event)} style={styles.half} />
            ) : null}
          </View>
        ) : null
      }>
      {event ? (
        <ScrollView style={{ maxHeight: height * 0.6 }} contentContainerStyle={styles.body}>
          <Image source={{ uri: event.image_url }} style={styles.image} contentFit="cover" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatEventDate(event.starts_at, event.ends_at)}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {event.title}
          </Text>
          {event.location_address ? (
            <View style={styles.address}>
              <MapPin size={18} color={colors.neutral[800]} />
              <Text style={styles.addressText}>{event.location_address}</Text>
            </View>
          ) : null}
          {joining ? <Text style={styles.joining}>{joining}</Text> : null}
          {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8, paddingBottom: 8 },
  image: { height: 180, borderRadius: 12, backgroundColor: colors.neutral[200], marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary[100],
  },
  badgeText: { fontFamily: fonts.semiboldItalic, fontSize: 14, textTransform: 'uppercase', color: colors.primary[800] },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, textTransform: 'uppercase', color: colors.black },
  address: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.neutral[800] },
  joining: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[700] },
  description: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.black, marginTop: 4 },
  footer: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
