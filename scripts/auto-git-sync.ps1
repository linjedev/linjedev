param(
  [string]$RepositoryPath = "D:/VC/P1/linjedev",
  [string]$Branch = "",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Keep automation truly non-interactive when run from Task Scheduler.
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"
$env:GIT_TERMINAL_UI = "0"

$logPath = Join-Path $RepositoryPath ".git\auto-git-sync.log"
$lockPath = Join-Path $RepositoryPath ".git\auto-git-sync.lock"

if (Test-Path $lockPath) {
  # If a previous run died and left a stale lock, continue after 20 minutes.
  $lockAge = (Get-Date) - (Get-Item $lockPath).LastWriteTime
  if ($lockAge.TotalMinutes -lt 20) {
    Exit 0
  }
  Remove-Item $lockPath -Force
}

function Write-AutoSyncLog {
  param([string]$Message)
  $line = "{0:yyyy-MM-dd HH:mm:ss} - {1}" -f (Get-Date), $Message
  Add-Content -Path $logPath -Value $line
}

$repoName = Split-Path $RepositoryPath -Leaf
Write-AutoSyncLog "[$repoName] Starting auto-sync job."

try {
  New-Item -ItemType File -Path $lockPath -Value "" -Force | Out-Null
}
catch {
  Write-AutoSyncLog "Failed to acquire lock at ${lockPath}: $($_.Exception.Message)"
  Exit 1
}

try {
  Set-Location $RepositoryPath
  if (-not $Branch) {
    $Branch = (& git rev-parse --abbrev-ref HEAD).Trim()
    if (-not $Branch -or $Branch -eq "HEAD") {
      throw "Repository is in detached HEAD; set -Branch explicitly."
    }
  }

  & git fetch $Remote
  & git checkout $Branch
  & git pull --ff-only "$Remote" "$Branch"

  $pendingChanges = & git status --porcelain
  if (-not $pendingChanges) {
    Write-AutoSyncLog "No local changes; nothing to push."
    exit 0
  }

  & git add -A

  $stagedChanges = & git diff --cached --name-only
  if (-not $stagedChanges) {
    Write-AutoSyncLog "No staged changes after add; aborting."
    exit 0
  }

  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  & git commit -m "chore: auto-sync $stamp"
  & git push $Remote $Branch
  Write-AutoSyncLog "Committed and pushed changes for $Branch."
} catch {
  Write-AutoSyncLog "Auto-sync failed: $($_.Exception.Message)"
  throw
} finally {
  if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force
  }
  Write-AutoSyncLog "Auto-sync ended."
}
