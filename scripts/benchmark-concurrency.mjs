import { performance } from "node:perf_hooks";

const BASE_URL = process.env.BENCHMARK_TARGET || "http://localhost:8080";
const CONCURRENCY = Number(process.env.CONCURRENCY) || 20;
const TOTAL_REQUESTS = Number(process.env.TOTAL_REQUESTS) || 100;

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { p50, p95, p99, min, max };
}

async function runWorker(url, total, results) {
  for (let i = 0; i < total; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url);
      const duration = Number((performance.now() - start).toFixed(2));
      results.push({ duration, ok: res.ok, status: res.status });
    } catch (err) {
      const duration = Number((performance.now() - start).toFixed(2));
      results.push({ duration, ok: false, status: 0, error: err.message });
    }
  }
}

async function benchmarkEndpoint(label, url) {
  console.log(`\n--------------------------------------------------------`);
  console.log(` 🔬 Benchmarking: ${label}`);
  console.log(`    URL:         ${url}`);
  console.log(`    Requests:    ${TOTAL_REQUESTS} (Concurrency: ${CONCURRENCY})`);

  const results = [];
  const reqsPerWorker = Math.floor(TOTAL_REQUESTS / CONCURRENCY);
  const startTime = performance.now();

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runWorker(url, reqsPerWorker, results));
  }
  await Promise.all(workers);

  const totalTimeSec = (performance.now() - startTime) / 1000;
  const latencies = results.map((r) => r.duration);
  const { p50, p95, p99, min, max } = calculatePercentiles(latencies);
  const successCount = results.filter((r) => r.ok).length;
  const errorCount = results.length - successCount;
  const errorRate = ((errorCount / results.length) * 100).toFixed(2);
  const rps = (results.length / totalTimeSec).toFixed(1);

  console.log(`\n 📊 RESULTS for ${label}:`);
  console.log(`    Throughput:  ${rps} req/sec`);
  console.log(`    Error Rate:  ${errorRate}% (${errorCount} errors)`);
  console.log(`    p50:         ${p50} ms`);
  console.log(`    p95:         ${p95} ms`);
  console.log(`    p99:         ${p99} ms`);
  console.log(`    Min / Max:   ${min} ms / ${max} ms`);
  console.log(`--------------------------------------------------------`);

  return { label, rps, errorRate, p50, p95, p99 };
}

async function runSuite() {
  console.log("\n========================================================");
  console.log(" 🚀 SEEDHA PROPERTIES - CONCURRENCY & LATENCY BENCHMARK");
  console.log("========================================================");
  console.log(` Target:      ${BASE_URL}`);
  console.log(` Concurrency: ${CONCURRENCY} workers`);
  console.log(` Date:        ${new Date().toISOString()}\n`);

  try {
    // 1. Uncached property search
    await benchmarkEndpoint("Public Health API", `${BASE_URL}/api/health`);

    // 2. Cached properties list
    await benchmarkEndpoint("V2 Properties API", `${BASE_URL}/api/v2/properties?limit=10`);
  } catch (err) {
    console.error("Benchmark error:", err.message);
  }

  console.log("\n========================================================");
  console.log(" Benchmark completed.");
  console.log("========================================================\n");
}

runSuite();
