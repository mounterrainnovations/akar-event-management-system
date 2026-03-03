// Run with: npx tsx scripts/fix-past-events-constraint.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1. Check what constraints exist on website_media.section
  const { data: constraintData, error: constraintError } = await supabase.rpc(
    "query" as any,
    {
      query: `
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'website_media'::regclass
        AND contype = 'c'
    `,
    },
  );

  if (constraintError) {
    console.log("RPC query not available, trying direct approach...");
  } else {
    console.log("Constraints:", JSON.stringify(constraintData, null, 2));
  }

  // 2. Try to see the column definition
  const { data: colData, error: colError } = await supabase
    .from("information_schema.check_constraints" as any)
    .select("*")
    .ilike("constraint_name" as any, "%section%");

  console.log("Column constraint data:", colData, colError);

  // 3. Try querying past-events to confirm error
  const { data, error } = await supabase
    .from("website_media")
    .select("id")
    .eq("section", "past-events")
    .limit(1);

  console.log("Test query result:", data, error);
}

main().catch(console.error);
