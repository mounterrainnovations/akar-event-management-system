// Run: npx tsx --env-file=.env scripts/add-past-events-enum.ts
// This runs the ALTER TYPE using Supabase's pg-meta endpoint (part of supabase-js admin)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string) {
  // Supabase's internal pg-meta endpoint for running raw SQL
  const projectRef = SUPABASE_URL.replace("https://", "").replace(
    ".supabase.co",
    "",
  );

  // Try the internal /rest/v1/ query endpoint available via service role
  const endpoints = [
    {
      url: `${SUPABASE_URL}/pg/query`,
      body: { query: sql },
    },
    {
      url: `https://${projectRef}.supabase.co/pg/query`,
      body: { query: sql },
    },
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
      body: JSON.stringify(ep.body),
    });
    console.log(`${ep.url} → ${res.status}`);
    if (res.ok) {
      return await res.json();
    }
  }
  return null;
}

async function main() {
  console.log("Adding 'past-events' to website_section enum...\n");

  const sql =
    "ALTER TYPE website_section ADD VALUE IF NOT EXISTS 'past-events'";
  const result = await runSQL(sql);
  console.log("Result:", result);

  // Verify using REST API
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("website_media")
    .select("id")
    .eq("section", "past-events" as any)
    .limit(1);

  if (error?.code === "22P02") {
    console.log("\n❌ Enum still does not include 'past-events'.");
    console.log("You need to run this SQL in your Supabase SQL Editor:");
    console.log("\n  ALTER TYPE website_section ADD VALUE 'past-events';\n");
  } else {
    console.log(
      "\n✅ Success! 'past-events' is now a valid website_section enum value.",
    );
    console.log("Result:", data);
  }
}

main().catch(console.error);
