# MSU Online - Professional Port Cleanup Utility
# Powerfully kills any "ghost" processes hanging on your dev ports.

Write-Host "Checking core ports (5173, 4000, 8000)..." -ForegroundColor Cyan

$ports = @(5173, 4000, 8000)

foreach ($port in $ports) {
    # Use netstat to find actual PIDs, which is more reliable than Get-NetTCPConnection
    $netstat = netstat -ano | findstr ":$port" | findstr "LISTENING"
    if ($netstat) {
        foreach ($line in $netstat) {
            $parts = $line.trim().split(" ") | Where-Object { $_ -ne "" }
            $targetPid = $parts[-1]
            if ($targetPid -gt 0) {
                Write-Host "Found process (PID: $targetPid) listening on port $port. Terminating..." -ForegroundColor Yellow
                try {
                    Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
                    Write-Host "Port $port cleared (killed PID $targetPid)." -ForegroundColor Green
                }
                catch {
                    Write-Host "Failed to kill PID $targetPid. You may need Admin rights." -ForegroundColor Red
                }
            }
        }
    }
    else {
        Write-Host "Port $port is clear." -ForegroundColor Gray
    }
}

Write-Host "`nSystem Ready." -ForegroundColor Green
