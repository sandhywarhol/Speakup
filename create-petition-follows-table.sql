-- Buat tabel untuk menyimpan petisi yang diikuti user (pinned petisi)
CREATE TABLE IF NOT EXISTS petition_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, petition_id)
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_petition_follows_user_id ON petition_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_follows_petition_id ON petition_follows(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_follows_created_at ON petition_follows(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE petition_follows ENABLE ROW LEVEL SECURITY;

-- Policy untuk user hanya bisa melihat follow mereka sendiri
CREATE POLICY "Users can view their own petition follows" ON petition_follows
    FOR SELECT USING (auth.uid() = user_id);

-- Policy untuk user hanya bisa menambah follow mereka sendiri
CREATE POLICY "Users can insert their own petition follows" ON petition_follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy untuk user hanya bisa menghapus follow mereka sendiri
CREATE POLICY "Users can delete their own petition follows" ON petition_follows
    FOR DELETE USING (auth.uid() = user_id);

-- Policy untuk admin bisa melihat semua
CREATE POLICY "Admins can view all petition follows" ON petition_follows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy untuk admin bisa menghapus semua
CREATE POLICY "Admins can delete all petition follows" ON petition_follows
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

