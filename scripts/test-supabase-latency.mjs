import { performance } from "node:perf_hooks";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://iyttetfaavokzyexvqam.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_gcIp8Q5STuoIZf-d7pJnGA_CuqPEo2x";

async function measureRequest(label, url, headers = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, { headers });
    const end = performance.now();
    const data = await res.json().catch(() => null);
    const duration = (end - start).toFixed(1);
    const rowCount = Array.isArray(data) ? data.length : data ? 1 : 0;
    return { label, status: res.status, duration: Number(duration), rows: rowCount, ok: res.ok };
  } catch (err) {
    const end = performance.now();
    return { label, status: 0, duration: Number((end - start).toFixed(1)), error: err.message, ok: false };
  }
}

async function runBenchmark() {
  console.log("\n========================================================");
  console.log(" 🚀 SEEDHA PROPERTIES - SUPABASE LATENCY BENCHMARK");
  console.log("========================================================");
  console.log(` Target Host: ${SUPABASE_URL}`);
  console.log(` Time:        ${new Date().toLocaleTimeString()}\n`);

  // 1. Raw Root Ping (Network + TLS Handshake)
  console.log("1️⃣  Testing Network & TLS Handshake...");
  const ping = await measureRequest("Raw HTTPS Handshake", `${SUPABASE_URL}/rest/v1/`);
  console.log(`   ⏱️  Ping / Handshake: ${ping.duration} ms [Status: ${ping.status}]`);

  // 2. Cold Query (properties table)
  console.log("\n2️⃣  Testing Property Query (First / Cold Request)...");
  const queryHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
  const coldQuery = await measureRequest(
    "Cold Properties Query",
    `${SUPABASE_URL}/rest/v1/properties?select=id,title,price,city,status&limit=10`,
    queryHeaders
  );
  console.log(`   ⏱️  Cold Query:       ${coldQuery.duration} ms (${coldQuery.rows} properties returned)`);

  // 3. Warm Query (Consecutive immediate request to test DB cache)
  console.log("\n3️⃣  Testing Property Query (Second / Warm Request)...");
  const warmQuery = await measureRequest(
    "Warm Properties Query",
    `${SUPABASE_URL}/rest/v1/properties?select=id,title,price,city,status&limit=10`,
    queryHeaders
  );
  console.log(`   ⏱️  Warm Query:       ${warmQuery.duration} ms (${warmQuery.rows} properties returned)`);

  // 4. Repeated 3-sample average
  console.log("\n4️⃣  Running 3-Sample Warm Benchmark...");
  const samples = [];
  for (let i = 1; i <= 3; i++) {
    const s = await measureRequest(
      `Sample #${i}`,
      `${SUPABASE_URL}/rest/v1/properties?select=id,title,price&limit=5`,
      queryHeaders
    );
    samples.push(s.duration);
    console.log(`   Sample ${i}: ${s.duration} ms`);
  }
  const avg = (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1);
  console.log(`   📊 Average Warm Response: ${avg} ms`);

  // 5. Analysis & Diagnosis
  console.log("\n========================================================");
  console.log(" 🔍 LATENCY DIAGNOSIS & BOTTLENECK REPORT");
  console.log("========================================================");
  
  if (coldQuery.duration > 1000) {
    console.log(` ⚠️  COLD START DETECTED: Initial request took ${coldQuery.duration} ms.`);
    console.log("    Cause: Supabase free projects sleep idle database processes.");
    console.log("    Fix 1: Keep-alive cron or Edge SWR caching (drops to ~20ms).");
  } else {
    console.log(` ✅  Cold start within acceptable bounds (${coldQuery.duration} ms).`);
  }

  if (Number(avg) > 250) {
    console.log(` ⚠️  HIGH WARM LATENCY: Warm queries average ${avg} ms.`);
    console.log("    Cause: Geographical distance from server or missing query caching.");
    console.log("    Fix: Cache public feeds in memory (staleTime: 5m) or Cloudflare Edge.");
  } else {
    console.log(` ✅  Warm queries are performant (${avg} ms).`);
  }
  console.log("========================================================\n");
}

runBenchmark();
