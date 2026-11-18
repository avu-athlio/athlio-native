import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CaretLeft, DotsThreeVertical } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatSettingsSheet, MessageActionsSheet, PhotoViewer } from '@/components/chat/ChatSheets';
import { CHAT, dayLabel, firstName, sameDay, themeById } from '@/components/chat/chatShared';
import Composer, { TypingIndicator } from '@/components/chat/Composer';
import MessageBubble from '@/components/chat/MessageBubble';
import { pickImages } from '@/components/compose/MediaPicker';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import {
  PAGE,
  chatMissing,
  deleteMessage,
  editMessage,
  fetchConversation,
  fetchMessages,
  markRead,
  sendMessage,
  setBlocked,
  subscribeToChat,
  updateMySettings,
} from '@/lib/chat';
import { colors, fonts } from '@/theme';

const GROUP_GAP_MS = 5 * 60 * 1000; // a new time label after 5 minutes
const TYPING_MS = 3500;
let tempId = 0;

/** Figma chat page: live 1:1 conversation. */
export default function Conversation() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useUser();
  const uid = user?.id;

  const [conv, setConv] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error | gone
  const [messages, setMessages] = useState([]); // oldest → newest
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [banner, setBanner] = useState(null); // { kind: 'reply' | 'edit', message }
  const [actionMsg, setActionMsg] = useState(null);
  const [photos, setPhotos] = useState(null); // { urls, start }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const live = useRef(null);
  const lastTypingSent = useRef(0);

  // ── Load ──
  useEffect(() => {
    if (!id || !uid) return undefined;
    let cancelled = false;
    Promise.all([fetchConversation(id, uid), fetchMessages(id)]).then(
      ([c, msgs]) => {
        if (cancelled) return;
        if (!c) return setStatus('gone');
        setConv(c);
        setMessages(msgs);
        setHasMore(msgs.length === PAGE);
        setStatus('ready');
        markRead(id, uid);
      },
      (e) => !cancelled && setStatus(chatMissing(e) ? 'missing' : 'error'),
    );
    return () => {
      cancelled = true;
    };
  }, [id, uid]);

  // ── Live updates ──
  useEffect(() => {
    if (status !== 'ready') return undefined;
    const sub = subscribeToChat(id, uid, {
      onMessage: (m) => {
        // My own inserts come back from sendMessage; only take updates of them.
        setMessages((prev) => {
          const at = prev.findIndex((x) => x.id === m.id);
          if (at >= 0) return prev.map((x) => (x.id === m.id ? m : x));
          if (m.sender_id === uid) return prev;
          return [...prev, m];
        });
        if (m.sender_id !== uid) {
          setTyping(false);
          markRead(id, uid);
        }
      },
      onReadAt: (readAt) => setConv((c) => (c ? { ...c, otherReadAt: readAt } : c)),
      onTyping: () => {
        setTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), TYPING_MS);
      },
    });
    live.current = sub;
    return () => {
      clearTimeout(typingTimer.current);
      sub.unsubscribe();
      live.current = null;
    };
  }, [status, id, uid]);

  const loadOlder = async () => {
    if (!hasMore || loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const older = await fetchMessages(id, messages[0].created_at);
      setMessages((prev) => [...older.filter((o) => !prev.some((p) => p.id === o.id)), ...prev]);
      setHasMore(older.length === PAGE);
    } catch {
      // keep what we have; scrolling up again retries
    } finally {
      setLoadingOlder(false);
    }
  };

  // ── Sending ──
  const onChangeText = (v) => {
    setText(v);
    const now = Date.now();
    if (v && now - lastTypingSent.current > 2500) {
      lastTypingSent.current = now;
      live.current?.sendTyping();
    }
  };

  const deliver = async (temp) => {
      try {
        const real = await sendMessage({
          conversationId: id,
          uid,
          body: temp.body,
          images: temp.localImages ?? [],
          replyToId: temp.reply_to_id,
        });
        setMessages((prev) => prev.filter((m) => m.id !== real.id).map((m) => (m.id === temp.id ? real : m)));
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...temp, pending: false, failed: true } : m)));
      }
  };

  const send = async () => {
    const body = text.trim();
    if (banner?.kind === 'edit') {
      const original = banner.message;
      if (!body || body === original.body) return setBanner(null);
      setText('');
      setBanner(null);
      setMessages((prev) => prev.map((m) => (m.id === original.id ? { ...m, body, edited_at: new Date().toISOString() } : m)));
      try {
        const saved = await editMessage(original.id, body);
        setMessages((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === original.id ? original : m)));
        Alert.alert('Could not edit the message', 'Try again.');
      }
      return;
    }
    if (!body && !images.length) return;
    const temp = {
      id: `tmp-${Date.now()}-${tempId++}`,
      conversation_id: id,
      sender_id: uid,
      body: body || null,
      image_paths: [],
      localImages: images.length ? images : null,
      reply_to_id: banner?.kind === 'reply' ? banner.message.id : null,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setText('');
    setImages([]);
    setBanner(null);
    setMessages((prev) => [...prev, temp]);
    deliver(temp);
  };

  const retry = (msg) => {
    const again = { ...msg, failed: false, pending: true };
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? again : m)));
    deliver(again);
  };

  const pickPhotos = async () => {
    const picked = await pickImages(10 - images.length);
    if (picked.length) setImages((prev) => [...prev, ...picked].slice(0, 10));
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera access is off', 'Allow camera access in Settings to take photos.');
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setImages((prev) => [...prev, { id: `cam-${Date.now()}`, uri: a.uri, mimeType: a.mimeType }].slice(0, 10));
    }
  };

  // ── Message actions ──
  const confirmDelete = (msg) =>
    Alert.alert('Delete message?', 'It will show as “Message deleted” for both of you.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const gone = await deleteMessage(msg.id);
            setMessages((prev) => prev.map((m) => (m.id === gone.id ? gone : m)));
          } catch {
            Alert.alert('Could not delete the message', 'Try again.');
          }
        },
      },
    ]);

  // ── Settings ──
  const otherName = conv?.other?.full_name || conv?.other?.username || '';
  const saveSetting = async (patch) => {
    const before = conv.me;
    setConv((c) => ({ ...c, me: { ...c.me, ...patch } }));
    try {
      await updateMySettings(id, uid, patch);
    } catch {
      setConv((c) => ({ ...c, me: before }));
      Alert.alert('Could not save', 'Try again.');
    }
  };
  const toggleBlock = () => {
    const blocking = !conv.blockedByMe;
    const apply = async () => {
      setConv((c) => ({ ...c, blockedByMe: blocking }));
      try {
        await setBlocked(uid, conv.other.id, blocking);
      } catch {
        setConv((c) => ({ ...c, blockedByMe: !blocking }));
        Alert.alert('Could not update', 'Try again.');
      }
    };
    if (!blocking) return apply();
    Alert.alert(`Block ${otherName}?`, 'Neither of you will be able to send messages in this chat.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: apply },
    ]);
  };
  const visitProfile = () => {
    setSettingsOpen(false);
    router.push({ pathname: '/profile/[id]', params: { id: conv.other.id } });
  };

  // ── List items (newest first for the inverted list), with day separators ──
  // (React Compiler memoizes these; no manual useMemo/useCallback.)
  const byId = new Map(messages.map((m) => [m.id, m]));
  const items = (() => {
    const out = [];
    const latestSeenMine = [...messages]
      .reverse()
      .find((m) => m.sender_id === uid && !m.pending && !m.failed);
    const seenId =
      latestSeenMine && conv?.otherReadAt && new Date(conv.otherReadAt) >= new Date(latestSeenMine.created_at)
        ? latestSeenMine.id
        : null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const newer = messages[i + 1];
      const older = messages[i - 1];
      const showMeta =
        !newer ||
        newer.sender_id !== m.sender_id ||
        new Date(newer.created_at) - new Date(m.created_at) > GROUP_GAP_MS ||
        !sameDay(newer.created_at, m.created_at) ||
        !!m.edited_at;
      out.push({ type: 'msg', key: m.id, m, showMeta, seen: m.id === seenId });
      if (!older ? !hasMore : !sameDay(older.created_at, m.created_at)) {
        out.push({ type: 'day', key: `day-${m.id}`, label: dayLabel(m.created_at) });
      }
    }
    return out;
  })();

  const nameFor = (senderId) => (senderId === uid ? 'You' : firstName(conv?.other));

  const renderItem = ({ item }) =>
      item.type === 'day' ? (
        <Text style={styles.day}>{item.label}</Text>
      ) : (
        <MessageBubble
          msg={item.m}
          mine={item.m.sender_id === uid}
          showMeta={item.showMeta}
          seen={item.seen}
          reply={item.m.reply_to_id ? byId.get(item.m.reply_to_id) ?? { body: 'Earlier message' } : null}
          replyName={item.m.reply_to_id ? nameFor(byId.get(item.m.reply_to_id)?.sender_id) : ''}
          onLongPress={setActionMsg}
          onOpenPhotos={(urls, start) => setPhotos({ urls, start })}
          onRetry={retry}
        />
      );

  const theme = themeById(conv?.me?.theme);
  const blocked = conv?.blockedByMe || conv?.blockedMe;

  return (
    <View style={styles.screen}>
      {/* Background theme */}
      <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents="none">
        {theme.pattern ? (
          <Image source={theme.background} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.sport}>
            <Image source={theme.background} style={{ width: width * 1.9, height: width * 1.9 }} contentFit="contain" />
          </View>
        )}
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()}>
            <CaretLeft size={28} color={CHAT.theirsText} />
          </Pressable>
          {conv ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${otherName}'s profile`}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: conv.other.id } })}
              style={styles.who}>
              <Avatar uri={conv.other.avatar_url} size="small" />
              <Text style={styles.whoName} numberOfLines={1}>
                {otherName}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {conv ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Chat settings" hitSlop={8} onPress={() => setSettingsOpen(true)}>
            <DotsThreeVertical size={24} weight="bold" color={CHAT.theirsText} />
          </Pressable>
        ) : null}
      </View>

      {status !== 'ready' ? (
        status === 'loading' ? (
          <ActivityIndicator style={styles.loading} color={colors.primary.default} />
        ) : (
          <Text style={styles.message}>
            {status === 'missing'
              ? 'Chat isn’t set up on the server yet.'
              : status === 'gone'
                ? 'This conversation isn’t available.'
                : 'Couldn’t load this chat.'}
          </Text>
        )
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={items}
            inverted
            keyExtractor={(it) => it.key}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onEndReached={loadOlder}
            onEndReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListFooterComponent={loadingOlder ? <ActivityIndicator style={styles.older} color={colors.primary.default} /> : null}
            ListEmptyComponent={
              <Text style={[styles.message, styles.flipped]}>Say hi to {firstName(conv.other)} 👋</Text>
            }
          />

          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(240,240,243,0)', '#f0f0f3']}
              style={styles.fade}
            />
            {typing && !blocked ? <TypingIndicator /> : null}
            {blocked ? (
              <View style={styles.blocked}>
                <Text style={styles.blockedText}>
                  {conv.blockedByMe ? `You blocked ${otherName}.` : 'You can’t reply to this conversation.'}
                </Text>
                {conv.blockedByMe ? <Button size="small" type="outlined" label="Unblock" onPress={toggleBlock} /> : null}
              </View>
            ) : (
              <Composer
                value={text}
                onChangeText={onChangeText}
                onSend={send}
                onPickPhotos={pickPhotos}
                onTakePhoto={takePhoto}
                images={images}
                onRemoveImage={(imgId) => setImages((prev) => prev.filter((x) => x.id !== imgId))}
                banner={
                  banner
                    ? banner.kind === 'edit'
                      ? { kind: 'edit', title: 'Editing message', text: banner.message.body }
                      : { kind: 'reply', title: `Replying to ${nameFor(banner.message.sender_id)}`, text: banner.message.body || 'Photo' }
                    : null
                }
                onCancelBanner={() => {
                  if (banner?.kind === 'edit') setText('');
                  setBanner(null);
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      <MessageActionsSheet
        message={actionMsg}
        mine={actionMsg?.sender_id === uid}
        onClose={() => setActionMsg(null)}
        onReply={(m) => setBanner({ kind: 'reply', message: m })}
        onEdit={(m) => {
          setBanner({ kind: 'edit', message: m });
          setText(m.body ?? '');
        }}
        onCopy={(m) => Clipboard.setStringAsync(m.body ?? '').catch(() => {})}
        onDelete={confirmDelete}
      />
      {conv ? (
        <ChatSettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          other={conv.other}
          muted={conv.me.muted}
          blockedByMe={conv.blockedByMe}
          theme={conv.me.theme}
          onVisitProfile={visitProfile}
          onToggleMute={() => saveSetting({ muted: !conv.me.muted })}
          onToggleBlock={toggleBlock}
          onTheme={(t) => saveSetting({ theme: t })}
        />
      ) : null}
      <PhotoViewer photos={photos} onClose={() => setPhotos(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f0f0f3' },
  flex: { flex: 1 },
  bg: { backgroundColor: '#f0f0f3' },
  sport: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: CHAT.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  whoName: { fontFamily: fonts.medium, fontSize: 14, color: CHAT.theirsText, flexShrink: 1 },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  day: { textAlign: 'center', paddingVertical: 8, fontFamily: fonts.medium, fontSize: 12, color: CHAT.meta },
  older: { paddingVertical: 12 },
  flipped: { transform: [{ scaleY: -1 }] },
  loading: { paddingVertical: 40 },
  message: { paddingVertical: 40, paddingHorizontal: 24, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: CHAT.meta },
  bottom: { paddingHorizontal: 12, paddingTop: 4 },
  fade: { position: 'absolute', left: 0, right: 0, top: -40, bottom: 0 },
  blocked: {
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 24,
    backgroundColor: CHAT.surface,
  },
  blockedText: { fontFamily: fonts.medium, fontSize: 14, color: CHAT.meta, textAlign: 'center' },
});
