-- Enable Realtime for DM functionality
-- Jalankan script ini di Supabase SQL Editor

-- 1. Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Enable Realtime for conversations table (optional, for conversation updates)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 3. Create a function to handle real-time message updates
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called automatically when a new message is inserted
  -- The real-time subscription will pick up the change
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for new messages
DROP TRIGGER IF EXISTS new_message_trigger ON messages;
CREATE TRIGGER new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 5. Verify Realtime is enabled
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename IN ('messages', 'conversations')
AND schemaname = 'public';

-- 6. Check if tables are in the realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'conversations');

SELECT 'Realtime enabled successfully for DM functionality!' as status;
