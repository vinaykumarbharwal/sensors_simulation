#!/usr/bin/env bash
# ============================================================================
# Vanrakshak backend — API load test
#
# Prereqs on YOUR machine (not this sandbox):
#   - Backend running: mvn spring-boot:run -Dspring-boot.run.profiles=benchmark
#   - Apache Bench installed: sudo apt-get install apache2-utils
#
# What it does:
#   Logs in as the seeded 'employee' user to get a JWT, then runs `ab`
#   against each of the 5 most meaningful endpoints at the concurrency /
#   request counts requested (50 & 100 users, 1000-5000 requests), and
#   prints a results table in the exact format the report needs.
#
# Nothing here fabricates numbers — every value comes straight from `ab`.
# ============================================================================
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8081}"
OUT_DIR="./benchmark_results"
mkdir -p "$OUT_DIR"

echo "== Logging in to get JWT =="
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"employee","password":"employee123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed — is the backend running with the 'benchmark' profile on $BASE_URL ?"
  exit 1
fi
echo "Token acquired."

AUTH_HEADER="Authorization: Bearer $TOKEN"

# Endpoint list: name | path | concurrency | total_requests
# Adjust concurrency/requests down if the box can't sustain them —
# note in the report if you do.
declare -a TESTS=(
  "Sensor_Readings|/api/v1/sensors/readings|50|2000"
  "Alerts_Active|/api/v1/alerts|50|2000"
  "Dashboard|/api/v1/dashboard|100|3000"
  "Readings_History|/api/v1/readings/history?limit=100|100|2000"
  "Zones|/api/v1/zones|50|2000"
)

SUMMARY="$OUT_DIR/summary.md"
echo "| Test | Users | Requests | Avg (ms) | Median (ms) | P90 (ms) | P95 (ms) | Max (ms) | Throughput (req/s) | Errors |" > "$SUMMARY"
echo "|------|------:|---------:|---------:|------------:|---------:|---------:|---------:|--------------------:|-------:|" >> "$SUMMARY"

for t in "${TESTS[@]}"; do
  IFS='|' read -r NAME PATH_ CONC N <<< "$t"
  RAW="$OUT_DIR/${NAME}.txt"
  echo ""
  echo "== Running $NAME : $N requests, $CONC concurrent =="
  ab -n "$N" -c "$CONC" -H "$AUTH_HEADER" "$BASE_URL$PATH_" > "$RAW" 2>&1 || true

  TOTAL=$(grep "Complete requests:" "$RAW" | awk '{print $3}')
  FAILED=$(grep "Failed requests:" "$RAW" | awk '{print $3}')
  RPS=$(grep "Requests per second:" "$RAW" | awk '{print $4}')
  AVG=$(grep "Time per request.*mean\)$" "$RAW" | head -1 | awk '{print $4}')
  P50=$(grep "  50%" "$RAW" | awk '{print $2}')
  P90=$(grep "  90%" "$RAW" | awk '{print $2}')
  P95=$(grep "  95%" "$RAW" | awk '{print $2}')
  PMAX=$(grep " 100%" "$RAW" | awk '{print $2}')

  if [ -z "$TOTAL" ]; then
    echo "  !! ab did not complete for $NAME — see $RAW for the error."
    echo "| $NAME | $CONC | ERROR | - | - | - | - | - | - | - |" >> "$SUMMARY"
    continue
  fi

  ERR_PCT=$(awk -v f="$FAILED" -v t="$TOTAL" 'BEGIN{ if (t>0) printf "%.2f", (f/t)*100; else print "0.00" }')

  echo "| $NAME | $CONC | $TOTAL | $AVG | $P50 | $P90 | $P95 | $PMAX | $RPS | ${ERR_PCT}% |" >> "$SUMMARY"
  echo "  Requests=$TOTAL  Failed=$FAILED  RPS=$RPS  Avg=${AVG}ms  P95=${P95}ms"
done

echo ""
echo "===================================================================="
echo "Done. Raw ab output per endpoint is in $OUT_DIR/*.txt"
echo "Formatted results table:"
echo "===================================================================="
cat "$SUMMARY"
