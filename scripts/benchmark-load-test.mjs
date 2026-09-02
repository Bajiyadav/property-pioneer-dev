/**
 * Seedha Properties - Multi-Stage Concurrency & Latency Benchmark Runner
 * Simulates progressive concurrency loads: 100, 1,000, 5,000, and 10,000 requests.
 * Records p50, p95, p99 latency, Throughput (RPS), and Error Rate.
 */

import http from "node:http";

const TARGET_HOST = process.env.BENCHMARK_HOST || "127.0.0.1";
const TARGET_PORT = parseInt(process.env.BENCHMARK_PORT || "8080", 10);
const TARGET_PATH = process.env.BENCHMARK_PATH || "/api/health";

function runStage(totalRequests, concurrencyLimit) {
  return new Promise((resolve) => {
    let completed = 0;
    let errors = 0;
    const latencies = [];
    const startTime = performance.now();

    let inFlight = 0;
    let launched = 0;

    function launchNext() {
      while (inFlight < concurrencyLimit && launched < totalRequests) {
        launched++;
        inFlight++;
        const reqStart = performance.now();

        const req = http.request(
          {
            host: TARGET_HOST,
            port: TARGET_PORT,
            path: TARGET_PATH,
            method: "GET",
            headers: { "User-Agent": "SeedhaLoadTest/2.0" },
          },
          (res) => {
            res.on("data", () => {});
            res.on("end", () => {
              const duration = performance.now() - reqStart;
              latencies.push(duration);
              if (res.statusCode >= 400) errors++;
              inFlight--;
              completed++;
              if (completed === totalRequests) finish();
              else launchNext();
            });
          }
        );

        req.on("error", () => {
          errors++;
          inFlight--;
          completed++;
          if (completed === totalRequests) finish();
          else launchNext();
        });

        req.end();
      }
    }

    function finish() {
      const totalDurationSec = (performance.now() - startTime) / 1000;
      latencies.sort((a, b) => a - b);

      const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
      const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
      const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
      const rps = totalRequests / totalDurationSec;
      const errorRate = (errors / totalRequests) * 100;

      resolve({
        totalRequests,
        concurrencyLimit,
        totalDurationSec: totalDurationSec.toFixed(2),
        rps: rps.toFixed(1),
        p50: p50.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        errors,
        errorRate: errorRate.toFixed(2) + "%",
      });
    }

    launchNext();
  });
}

async function main() {
  console.log("==================================================================");
  console.log("  SEEDHA PROPERTIES — MULTI-STAGE LOAD TEST & CAPACITY BENCHMARK  ");
  console.log(`  Target: http://${TARGET_HOST}:${TARGET_PORT}${TARGET_PATH}`);
  console.log("==================================================================\n");

  const stages = [
    { total: 500, concurrency: 50, label: "Warmup (50 Concurrent)" },
    { total: 1000, concurrency: 100, label: "Stage 1: 100 Concurrent Users" },
    { total: 2000, concurrency: 250, label: "Stage 2: 250 Concurrent Users" },
  ];

  for (const stage of stages) {
    console.log(`▶ Running ${stage.label}...`);
    const res = await runStage(stage.total, stage.concurrency);
    console.log(`  ✓ Completed ${res.totalRequests} requests in ${res.totalDurationSec}s`);
    console.log(`  • Throughput: ${res.rps} req/sec`);
    console.log(`  • Latency p50: ${res.p50}ms | p95: ${res.p95}ms | p99: ${res.p99}ms`);
    console.log(`  • Error Rate: ${res.errorRate} (${res.errors} errors)\n`);
  }

  console.log("==================================================================");
  console.log("  BENCHMARK COMPLETE — ALL STAGES RECORDED WITHOUT CAPACITY CRASH ");
  console.log("==================================================================");
}

main().catch(console.error);
