import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data: cols, error: err2 } = await supabase
    .from("event_registrations")
    .select("payment_status")
    .limit(1);
  console.log("Cols:", cols, err2);

  // Try to insert a test record with a fake status to see if it throws an ENUM error
  // We'll use a transaction id that doesn't matter, or just the required fields
  console.log("Inserting fake record...");
  const { error: err3 } = await supabase.from("event_registrations").insert({
    event_id: "00000000-0000-0000-0000-000000000000",
    user_id: "00000000-0000-0000-0000-000000000001",
    total_amount: "0",
    final_amount: "0",
    payment_status: "FAKE_STATUS",
    name: "Test Record",
  });
  console.log("Insert Error:", err3);
}

main();
