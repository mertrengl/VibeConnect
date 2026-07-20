BEGIN;

-- The existing schema already relies on these extensions for UUIDs and CITEXT.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Do not silently invent missing relationships. Stop before changing the schema
-- if existing messages or direct-message mappings are incomplete.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vibeconnect.messages
    WHERE conversation_id IS NULL OR sender_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Migration cancelled: messages with a NULL conversation_id or sender_id exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM vibeconnect.direct_messages_mapping
    WHERE conversation_id IS NULL
  ) THEN
    RAISE EXCEPTION
      'Migration cancelled: direct-message mappings with a NULL conversation_id exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM vibeconnect.direct_messages_mapping
    GROUP BY conversation_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Migration cancelled: more than one direct-message mapping points to the same conversation.';
  END IF;
END
$$;

-- Replace nullable defaults with explicit values before making operational fields required.
UPDATE vibeconnect.conversations
SET is_group = COALESCE(is_group, FALSE),
    created_at = COALESCE(created_at, NOW());

UPDATE vibeconnect.messages
SET deleted_for_everyone = COALESCE(deleted_for_everyone, FALSE),
    created_at = COALESCE(created_at, NOW());

UPDATE vibeconnect.participants
SET role = COALESCE(role, 'Member'),
    joined_at = COALESCE(joined_at, NOW());

UPDATE vibeconnect.users
SET created_at = COALESCE(created_at, NOW());

-- This is used to order the conversation list by the last activity, not creation time.
ALTER TABLE vibeconnect.conversations
  ADD COLUMN last_message_at TIMESTAMPTZ;

UPDATE vibeconnect.conversations AS conversation
SET last_message_at = COALESCE(
  (
    SELECT MAX(message.created_at)
    FROM vibeconnect.messages AS message
    WHERE message.conversation_id = conversation.id
  ),
  conversation.created_at
);

ALTER TABLE vibeconnect.conversations
  ALTER COLUMN is_group SET DEFAULT FALSE,
  ALTER COLUMN is_group SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN last_message_at SET DEFAULT NOW(),
  ALTER COLUMN last_message_at SET NOT NULL;

ALTER TABLE vibeconnect.messages
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN sender_id SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN deleted_for_everyone SET DEFAULT FALSE,
  ALTER COLUMN deleted_for_everyone SET NOT NULL;

ALTER TABLE vibeconnect.participants
  ALTER COLUMN role SET DEFAULT 'Member',
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN joined_at SET DEFAULT NOW(),
  ALTER COLUMN joined_at SET NOT NULL;

ALTER TABLE vibeconnect.users
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL;

-- A direct-message mapping must identify exactly one real conversation.
ALTER TABLE vibeconnect.direct_messages_mapping
  ALTER COLUMN conversation_id SET NOT NULL,
  ADD CONSTRAINT direct_messages_mapping_conversation_id_key UNIQUE (conversation_id);

-- Indexes match the main chat queries: conversation list, message history, and sender lookups.
CREATE INDEX IF NOT EXISTS participants_user_id_idx
  ON vibeconnect.participants (user_id);

CREATE INDEX IF NOT EXISTS messages_conversation_created_at_id_idx
  ON vibeconnect.messages (conversation_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx
  ON vibeconnect.messages (sender_id);

CREATE INDEX IF NOT EXISTS direct_messages_mapping_user2_id_idx
  ON vibeconnect.direct_messages_mapping (user2_id);

CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx
  ON vibeconnect.conversations (last_message_at DESC);

COMMIT;
