# Stop whatever is listening on port 3000 (stale API instance)
$pids = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique
if (-not $pids) {
  Write-Host "Port 3000 is free."
  exit 0
}
foreach ($processId in $pids) {
  Write-Host "Stopping PID $processId ..."
  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}
Write-Host "Port 3000 is now free. Run: npm run dev"
