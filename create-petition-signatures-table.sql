-- Create petition_signatures table if not exists
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(petition_id, user_id) -- Prevent duplicate signatures
);

-- Enable RLS
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;

-- Create policies for petition_signatures
CREATE POLICY "Users can view all signatures" ON petition_signatures
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own signatures" ON petition_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures" ON petition_signatures
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON petition_signatures TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_petition_signatures_petition_id ON petition_signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_user_id ON petition_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_created_at ON petition_signatures(created_at DESC);
