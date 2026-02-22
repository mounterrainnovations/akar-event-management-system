import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createSupabaseAdminClient } from "./lib/supabase/admin";

async function run() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("event_tickets")
    .select("id, description")
    .limit(10);
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
