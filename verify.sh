#!/bin/bash

echo "🔍 SEEDHA PROPERTIES - GLOBAL VERIFICATION"
echo "=========================================="

# 1. TypeScript
echo "1️⃣ TypeScript..."
npm run typecheck > /tmp/ts.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ TypeScript: PASS"
else
  echo "❌ TypeScript: FAIL"
  cat /tmp/ts.log
  exit 1
fi

# 2. ESLint
echo "2️⃣ ESLint..."
npm run lint > /tmp/lint.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ ESLint: PASS"
else
  echo "❌ ESLint: FAIL"
  cat /tmp/lint.log
  exit 1
fi

# 3. Tests
echo "3️⃣ Tests..."
npm test -- --run > /tmp/tests.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Tests: PASS"
else
  echo "❌ Tests: FAIL"
  cat /tmp/tests.log
  exit 1
fi

# 4. Build
echo "4️⃣ Build..."
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build: PASS"
else
  echo "❌ Build: FAIL"
  cat /tmp/build.log
  exit 1
fi

# 5. Flutter
echo "5️⃣ Flutter..."
cd apps/mobile && flutter analyze > /tmp/flutter.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Flutter: PASS"
else
  echo "❌ Flutter: FAIL"
  cat /tmp/flutter.log
  exit 1
fi

echo ""
echo "✅ ALL CHECKS PASSED!"
echo "Ready for deployment."
