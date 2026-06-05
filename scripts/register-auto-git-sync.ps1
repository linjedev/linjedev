param(
  [string]$RepositoryPath = "D:/VC/P1/linjedev",
  [string]$TaskName = "LinjedevAutoGitSync",
  [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Stop"

$syncScript = Join-Path $RepositoryPath "scripts/auto-git-sync.ps1"
$startTime = (Get-Date).AddMinutes(1)
$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At $startTime `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$action = New-ScheduledTaskAction `
  -Execute "pwsh.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$syncScript`""

$principal = New-ScheduledTaskPrincipal `
  -UserId $env:USERNAME `
  -LogonType S4U `
  -RunLevel Highest

Register-ScheduledTask `
  -TaskName $TaskName `
  -Trigger $trigger `
  -Action $action `
  -Principal $principal `
  -Description "Auto commit and push repository changes every $IntervalMinutes minutes." `
  -Force | Out-Null

Write-Output "Task '$TaskName' registered for this user at interval $IntervalMinutes minutes."
