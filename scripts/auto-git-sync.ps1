param(
  [string]$RepositoryPath = "D:/VC/P1/linjedev",
  [string]$Branch = "main",
  [string]$Remote = "origin"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$lockPath = Join-Path $RepositoryPath ".git\auto-git-sync.lock"

if (Test-Path $lockPath) {
  Exit 0
}

New-Item -ItemType File -Path $lockPath -Value "" -Force | Out-Null

try {
  Set-Location $RepositoryPath

  & git fetch $Remote
  & git checkout $Branch
  & git pull --ff-only "$Remote" "$Branch"

  $pendingChanges = & git status --porcelain
  if (-not $pendingChanges) {
    exit 0
  }

  & git add -A

  $stagedChanges = & git diff --cached --name-only
  if (-not $stagedChanges) {
    exit 0
  }

  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  & git commit -m "chore: auto-sync $stamp"
  & git push $Remote $Branch
} finally {
  if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force
  }
}
