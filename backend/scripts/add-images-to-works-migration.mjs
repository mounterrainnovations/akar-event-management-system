/**
 * Migration script: Add images column to works table
 * Run with: node scripts/add-images-to-works-migration.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running migration: add images column to works table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE works ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';"
  });

  if (error) {
    // Try direct query approach
    console.log('RPC method failed, trying alternative...');
    const { data, error: error2 } = await supabase
      .from('works')
      .select('images')
      .limit(1);
    
    if (error2 && error2.message.includes('does not exist')) {
      console.error('Column does not exist and migration failed:', error2.message);
      console.log('\nPlease run the following SQL directly in your Supabase dashboard SQL editor:');
      console.log("ALTER TABLE works ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';");
      process.exit(1);
    } else {
      console.log('Column already exists or migration succeeded via another means!');
    }
  } else {
    console.log('Migration applied successfully!');
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  console.log('\nPlease run the following SQL in Supabase SQL Editor:');
  console.log("ALTER TABLE works ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';");
});
