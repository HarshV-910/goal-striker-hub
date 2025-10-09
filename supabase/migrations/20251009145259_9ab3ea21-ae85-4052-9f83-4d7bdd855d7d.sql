-- Enable realtime for the profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Ensure the table has replica identity full for complete row data
ALTER TABLE profiles REPLICA IDENTITY FULL;