import fs from "node:fs";
import path from "node:path";

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === "node_modules" || file === ".git" || file === ".output" || file === "build" || file === "dist" || file === ".wrangler") {
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".dart") || file.endsWith(".js")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function scanDependencies() {
  console.log("================================================================");
  console.log(" 🔍 SCANNING CODEBASE FOR RUNTIME SUPABASE DEPENDENCIES");
  console.log("================================================================");

  const rootDir = process.cwd();
  const allFiles = walkDir(rootDir);

  const findings = [];

  for (const file of allFiles) {
    const relativePath = path.relative(rootDir, file);
    // Ignore migration scripts or test mocks that explicitly test migration compatibility
    if (relativePath.includes("supabase/migrations") || relativePath.includes("scripts/")) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      if (
        (line.includes("from '@supabase/supabase-js'") ||
          line.includes('from "@supabase/supabase-js"') ||
          line.includes("package:supabase_flutter")) &&
        !line.trim().startsWith("//") &&
        !line.trim().startsWith("*")
      ) {
        findings.push({
          file: relativePath,
          line: index + 1,
          code: line.trim(),
        });
      }
    });
  }

  console.log(`\n📁 Total source files scanned: ${allFiles.length}`);
  console.log(`🎯 Active Supabase Runtime Import Call Sites: ${findings.length}\n`);

  if (findings.length > 0) {
    console.log("Found direct Supabase imports in:");
    findings.forEach((f) => {
      console.log(`  - ${f.file}:${f.line} -> ${f.code}`);
    });
  } else {
    console.log("✅ ZERO direct runtime Supabase dependencies detected in application code!");
  }

  console.log("\n================================================================");
}

scanDependencies();
