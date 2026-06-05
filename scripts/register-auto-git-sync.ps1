param(
  [string]$RepositoryPath = "D:/VC/P1/linjedev",
  [string]$TaskName = "LinjedevAutoGitSync",
  [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"

$syncScript = Join-Path $RepositoryPath "scripts/auto-git-sync.ps1"
$startTime = (Get-Date).AddMinutes(1)
$taskCommand = if (Get-Command "pwsh.exe" -ErrorAction SilentlyContinue) { "pwsh.exe" } else { "powershell.exe" }

$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $startTime `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$action = New-ScheduledTaskAction `
  -Execute $taskCommand `
  -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$syncScript`""

$principal = New-ScheduledTaskPrincipal `
  -UserId $env:USERNAME `
  -LogonType S4U `
  -RunLevel Highest

try {
  Register-ScheduledTask `
    -TaskName $TaskName `
    -Trigger $trigger `
    -Action $action `
    -Principal $principal `
    -Description "Auto commit and push repository changes every $IntervalMinutes minutes." `
    -ErrorAction Stop `
    -Force | Out-Null

  Write-Output "Task '$TaskName' registered for this user at interval $IntervalMinutes minutes."
  Write-Output "Action: $($syncScript)"
  return
}
catch {
  Write-Output "Register-ScheduledTask failed: $($_.Exception.Message)"
  Write-Output "Falling back to classic schtasks registration (no admin required in most setups)."
}

$schtasksTime = $startTime.ToString("HH:mm")
$taskArgs = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$syncScript`""
$taskArgs = "powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$syncScript`""

& schtasks /Create /F /SC MINUTE /MO $IntervalMinutes /ST $schtasksTime /TN $TaskName /TR $taskArgs /RL LIMITED /RU "$env:USERNAME"
