$ErrorActionPreference = 'Stop'
$ab = 'C:\Users\nikk4\AppData\Local\Microsoft\WinGet\Packages\ApacheLounge.httpd_Microsoft.Winget.Source_8wekyb3d8bbwe\Apache24\bin\ab.exe'
$base = 'http://localhost:8081'
$outdir = 'D:\update vansrakshak\sensors_simulation\benchmark_results'
if (!(Test-Path $outdir)) { New-Item -ItemType Directory -Path $outdir | Out-Null }

Write-Output "Logging in to get JWT..."
$login = Invoke-RestMethod -Method Post -Uri "$base/api/v1/auth/login" -ContentType 'application/json' -Body '{"username":"employee","password":"employee123"}' -ErrorAction Stop
$token = $login.token
if (-not $token) { Write-Error "Login failed"; exit 1 }
$hdr = "Authorization: Bearer $token"

$tests = @(
    @{name='Sensor_Readings'; path='/api/v1/sensors/readings'; c=50; n=2000},
    @{name='Alerts_Active'; path='/api/v1/alerts'; c=50; n=2000},
    @{name='Dashboard'; path='/api/v1/dashboard'; c=100; n=3000},
    @{name='Readings_History'; path='/api/v1/readings/history?limit=100'; c=100; n=2000},
    @{name='Zones'; path='/api/v1/zones'; c=50; n=2000}
)

$summaryPath = Join-Path $outdir 'summary.md'
"| Test | Users | Requests | Avg (ms) | Median (ms) | P90 (ms) | P95 (ms) | Max (ms) | Throughput (req/s) | Errors |" | Out-File -FilePath $summaryPath -Encoding utf8
"|------|------:|---------:|---------:|------------:|---------:|---------:|---------:|--------------------:|-------:|" | Out-File -FilePath $summaryPath -Append -Encoding utf8

foreach ($t in $tests) {
    $raw = Join-Path $outdir ("$($t.name).txt")
    Write-Output "== Running $($t.name): $($t.n) requests, $($t.c) concurrent =="
    $cmd = '"' + $ab + '" -n ' + $t.n + ' -c ' + $t.c + ' -H "' + $hdr + '" ' + $base + $t.path
    $arg1 = '/c'
    $arg2 = $cmd + ' > "' + $raw + '" 2>&1'
    & cmd.exe $arg1 $arg2

    Start-Sleep -Milliseconds 200

    $text = Get-Content -Raw -Path $raw -ErrorAction SilentlyContinue
    if (-not $text) {
        "| $($t.name) | $($t.c) | ERROR | - | - | - | - | - | - | - |" | Out-File -FilePath $summaryPath -Append -Encoding utf8
        continue
    }

    $total = ([regex]::Match($text,'Complete requests:\s*(\d+)')).Groups[1].Value
    $failed = ([regex]::Match($text,'Failed requests:\s*(\d+)')).Groups[1].Value
    $rps = ([regex]::Match($text,'Requests per second:\s*([0-9\.]+)')).Groups[1].Value
    $avg = ([regex]::Match($text,'Time per request:\s*([0-9\.]+)')).Groups[1].Value
    $p50 = ([regex]::Match($text,'^\s*50%\s+(\d+)', 'Multiline')).Groups[1].Value
    $p90 = ([regex]::Match($text,'^\s*90%\s+(\d+)', 'Multiline')).Groups[1].Value
    $p95 = ([regex]::Match($text,'^\s*95%\s+(\d+)', 'Multiline')).Groups[1].Value
    $p100 = ([regex]::Match($text,'^\s*100%\s+(\d+)', 'Multiline')).Groups[1].Value

    if (-not $total) {
        "| $($t.name) | $($t.c) | ERROR | - | - | - | - | - | - | - |" | Out-File -FilePath $summaryPath -Append -Encoding utf8
        continue
    }

    $errpct = '0.00'
    if ($total -ne '' -and $failed -ne '') {
        $errpct = [string]::Format("{0:N2}", ([double]$failed / [double]$total * 100))
    }

    "| $($t.name) | $($t.c) | $total | $avg | $p50 | $p90 | $p95 | $p100 | $rps | ${errpct}% |" | Out-File -FilePath $summaryPath -Append -Encoding utf8
    "  Requests=$total  Failed=$failed  RPS=$rps  Avg=${avg}ms  P95=${p95}ms" | Write-Output
}

Write-Output 'Done. Summary written to ' $summaryPath
