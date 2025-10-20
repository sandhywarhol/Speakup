-- Sync signature counts in petitions table with actual signatures
-- This will fix any mismatched signature counts

-- Update all petitions with correct signature counts
UPDATE petitions 
SET signature_count = (
  SELECT COUNT(*) 
  FROM petition_signatures 
  WHERE petition_signatures.petition_id = petitions.id
);

-- Show the results
SELECT 
  id,
  title,
  signature_count,
  (SELECT COUNT(*) FROM petition_signatures WHERE petition_signatures.petition_id = petitions.id) as actual_count
FROM petitions
ORDER BY created_at DESC;
