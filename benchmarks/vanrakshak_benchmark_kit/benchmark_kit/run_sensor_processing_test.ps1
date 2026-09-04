param(
  [int]$SensorCount = 10,
  [int]$WindowSeconds = 130
)

$BaseUrl = "http://localhost:8081"
$OutDir = "./benchmark_results"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

Write-Output "== Logging in =="
try {
  $login = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body (@{username='employee';password='employee123'} | ConvertTo-Json) -ErrorAction Stop
} catch {
  Write-Error "Login failed - check backend is up on $BaseUrl"
  exit 1
}
$token = $login.token
if (-not $token) { Write-Error "Login failed - no token"; exit 1 }
$headers = @{ Authorization = "Bearer $token" }

Write-Output "== Creating $SensorCount sensors (mixed THERMAL/SMOKE) =="
$zones = @("North India","South India","East India","West India","Central India")
$types = @("THERMAL","SMOKE")
$created = 0
for ($i=1; $i -le $SensorCount; $i++) {
  $zone = $zones[($i % 5)]
  $type = $types[($i % 2)]
  $body = @{ zoneName = $zone; sensorType = $type; model = 'BenchSensor'; location = "bench-node-$i"; latitude = 20.0; longitude = 78.0; coverageRadiusKm = 5.0 } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "$BaseUrl/api/v1/admin/sensors" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -ErrorAction Stop
    $created++
  } catch {
    # ignore failures per original script
  }
}
Write-Output "Created $created / $SensorCount sensors."

function CountReadings {
  param([int]$limit=500)
  try {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/v1/readings/history?limit=$limit" -Headers $headers -ErrorAction Stop
    if ($r -is [System.Array]) { return $r.Length } else { return ($r | Measure-Object).Count }
  } catch { return 0 }
}
function CountAlerts {
  param([int]$limit=500)
  try {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/v1/alerts/history?limit=$limit" -Headers $headers -ErrorAction Stop
    if ($r -is [System.Array]) { return $r.Length } else { return ($r | Measure-Object).Count }
  } catch { return 0 }
}

Write-Output "== Baseline snapshot =="
$START_READINGS = CountReadings
$START_ALERTS = CountAlerts
$START_TS = [int]((Get-Date).ToUniversalTime().Subtract([datetime]'1970-01-01').TotalSeconds)
Write-Output "  readings=$START_READINGS  alerts=$START_ALERTS  at t=0"

Write-Output "== Waiting ${WindowSeconds}s (~$([Math]::Floor($WindowSeconds/20)) scheduler cycles at 20s each) =="
Start-Sleep -Seconds $WindowSeconds

$END_READINGS = CountReadings
$END_ALERTS = CountAlerts
$END_TS = [int]((Get-Date).ToUniversalTime().Subtract([datetime]'1970-01-01').TotalSeconds)
$ELAPSED = $END_TS - $START_TS

$DELTA_READINGS = $END_READINGS - $START_READINGS
$DELTA_ALERTS = $END_ALERTS - $START_ALERTS

$CAPPED = ""
if ($END_READINGS -ge 500 -or $DELTA_READINGS -ge 500) { $CAPPED = " (WARNING: hit the 500-row API cap - re-run with a shorter window or query the DB directly for the true count)" }

if ($ELAPSED -gt 0) {
  $READINGS_PER_SEC = "{0:N3}" -f ($DELTA_READINGS / $ELAPSED)
  $READINGS_PER_MIN = "{0:N1}" -f (($DELTA_READINGS / $ELAPSED) * 60)
  $READINGS_PER_HOUR = "{0:N0}" -f (($DELTA_READINGS / $ELAPSED) * 3600)
} else {
  $READINGS_PER_SEC = "n/a"; $READINGS_PER_MIN = "n/a"; $READINGS_PER_HOUR = "n/a"
}

$RESULT_FILE = "$OutDir/sensor_processing_${SensorCount}.md"
@"
## Sensor processing test — $SensorCount sensors

- Window: ${ELAPSED}s (requested ${WindowSeconds}s)
- Persisted readings delta: $DELTA_READINGS$CAPPED
- Alerts delta: $DELTA_ALERTS
- Measured throughput: $READINGS_PER_SEC readings/sec, $READINGS_PER_MIN readings/min, $READINGS_PER_HOUR readings/hour

Reminder: HUMIDITY-type readings are simulated and evaluated for alerts
but are NOT written to sensor_readings (verified in SensorSimulationService.
persistReadings - humidity is explicitly skipped). This throughput reflects
THERMAL + SMOKE persisted rows only, not total sensor activity.
"@ | Out-File -FilePath $RESULT_FILE -Encoding utf8

Write-Output "Saved to $RESULT_FILE"
