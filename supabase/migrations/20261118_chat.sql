-- Chat: one-to-one conversations, messages (text + photos, reply / edit /
-- delete), read state, mute, per-chat theme, blocking, private photo storage
-- and live updates. Run once in the Supabase SQL editor. Safe to re-run.

-- ── Tables ──────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  dm_key     text unique,                       -- "<smaller uuid>:<larger uuid>" for 1:1 chats
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz,
  muted           boolean not null default false,
  theme           text not null default 'default',
  created_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text,
  image_paths     text[] not null default '{}',  -- paths in the private chat-media bucket
  reply_to_id     uuid references public.messages(id) on delete set null,
  edited_at       timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ── Helpers (security definer so policies don't recurse) ────────────────
create or replace function public.is_conversation_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversation_members where conversation_id = c and user_id = auth.uid());
$$;

-- True if either person in the conversation has blocked the other.
create or replace function public.conversation_blocked(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from conversation_members me
    join conversation_members other on other.conversation_id = me.conversation_id and other.user_id <> me.user_id
    join user_blocks b on (b.blocker_id = me.user_id and b.blocked_id = other.user_id)
                       or (b.blocker_id = other.user_id and b.blocked_id = me.user_id)
    where me.conversation_id = c and me.user_id = auth.uid()
  );
$$;

-- Open (or create) my 1:1 chat with `other`. Returns the conversation id.
create or replace function public.get_or_create_dm(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me  uuid := auth.uid();
  key text;
  cid uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  if other is null or other = me then raise exception 'pick someone else to message'; end if;
  key := least(me::text, other::text) || ':' || greatest(me::text, other::text);
  insert into conversations (dm_key) values (key) on conflict (dm_key) do nothing;
  select id into cid from conversations where dm_key = key;
  insert into conversation_members (conversation_id, user_id) values (cid, me), (cid, other)
    on conflict do nothing;
  return cid;
end;
$$;

-- Inbox: my conversations that have messages, newest first, with the other
-- person, the last message and my unread count.
create or replace function public.my_conversations()
returns table (
  conversation_id uuid, other_id uuid,
  last_message_id uuid, last_body text, last_has_images boolean, last_deleted boolean,
  last_sender_id uuid, last_at timestamptz, unread_count int, muted boolean
)
language sql stable security definer set search_path = public as $$
  select c.id, o.user_id,
         lm.id, lm.body, coalesce(array_length(lm.image_paths, 1), 0) > 0, lm.deleted_at is not null,
         lm.sender_id, lm.created_at,
         (select count(*) from messages m
           where m.conversation_id = c.id and m.sender_id <> me.user_id and m.deleted_at is null
             and m.created_at > coalesce(me.last_read_at, 'epoch'::timestamptz))::int,
         me.muted
  from conversation_members me
  join conversations c on c.id = me.conversation_id
  join conversation_members o on o.conversation_id = c.id and o.user_id <> me.user_id
  join lateral (
    select * from messages m where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  where me.user_id = auth.uid()
  order by lm.created_at desc;
$$;

grant execute on function public.is_conversation_member(uuid), public.conversation_blocked(uuid),
  public.get_or_create_dm(uuid), public.my_conversations() to authenticated;

-- Keep conversations.last_message_at current.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return null;
end;
$$;
drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute procedure public.touch_conversation();

-- ── Row level security (new tables only) ────────────────────────────────
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.user_blocks          enable row level security;

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations
  for select to authenticated using (public.is_conversation_member(id));

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members
  for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists conversation_members_update on public.conversation_members;
create policy conversation_members_update on public.conversation_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
    and not public.conversation_blocked(conversation_id)
  );
-- Edit / delete (soft) your own messages.
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

drop policy if exists user_blocks_select on public.user_blocks;
create policy user_blocks_select on public.user_blocks
  for select to authenticated using (blocker_id = auth.uid() or blocked_id = auth.uid());
drop policy if exists user_blocks_insert on public.user_blocks;
create policy user_blocks_insert on public.user_blocks
  for insert to authenticated with check (blocker_id = auth.uid());
drop policy if exists user_blocks_delete on public.user_blocks;
create policy user_blocks_delete on public.user_blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- ── Private photo storage: chat-media/<conversation id>/<file> ──────────
insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', false)
  on conflict (id) do nothing;

drop policy if exists chat_media_read on storage.objects;
create policy chat_media_read on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-media' and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );
drop policy if exists chat_media_write on storage.objects;
create policy chat_media_write on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-media' and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

-- ── Live updates ────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'conversation_members') then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
end $$;

notify pgrst, 'reload schema';
