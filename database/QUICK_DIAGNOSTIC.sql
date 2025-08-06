-- Quick diagnostic - what exists in the database right now?

-- Show all tables
\dt

-- Show structure of user_profiles table if it exists
\d user_profiles

-- Show current data in user_profiles
SELECT * FROM user_profiles LIMIT 5;

-- Show structure of agencies table if it exists  
\d agencies

-- Show current data in agencies
SELECT * FROM agencies LIMIT 5;

-- Show all columns in user_profiles
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test if we can create a simple table
CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT);
INSERT INTO test_table (name) VALUES ('test');
SELECT * FROM test_table;
DROP TABLE test_table;

SELECT 'Diagnostic complete!' as status;