import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { count, error } = await supabase
    .from("enquiries")
    .select("*, properties!inner(region)", { count: "exact", head: true })
    .in("properties.region", ["Telangana"]);
  console.log("Count:", count, "Error:", error);
}
run();
