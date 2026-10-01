# Optional native Windows twin of scripts/ledger-smoke.sh.
# Not an adopter gate. On Windows, Git Bash or WSL can run the shell script instead.
#
# Requires: git, and Windows PowerShell 5.1 or PowerShell 7+.
# Does not require Node.js, Python, or gh.
#
# Usage: powershell.exe -File scripts/ledger-smoke.ps1
#
# Checks match the shell script: temporary ledger, canonical sample
# receipt, handoff bytes, history SHA-256, git commit, autocrlf=true
# clone, and the single-writer lock shape. It also builds a second
# temporary ledger in the Minimal Setup shape and checks that
# docs/PROTOCOL.md byte-matches toolkit PROTOCOL.md. POSIX mode 0600
# is asserted only when $env:OS is not Windows_NT. On Windows the lock
# check is the empty exclusive-create sentinel (a second create must fail).

$ErrorActionPreference = 'Stop'
# PowerShell 7 can turn git's stderr and non-zero exits into terminating
# errors. The script checks $LASTEXITCODE itself.
# Harmless on Windows PowerShell 5.1, which ignores this name.
$global:PSNativeCommandUseErrorActionPreference = $false

$script:Work = $null
$script:Failed = $true
$script:Utf8 = New-Object System.Text.UTF8Encoding $false
$script:GitPrefix = @()

function Fail([string]$Message) {
  [Console]::Error.WriteLine("ledger-smoke: $Message")
  exit 1
}

function Write-Utf8Text([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, $script:Utf8)
}

function Write-Lf([string]$Path, [string[]]$Lines) {
  Write-Utf8Text $Path (([string]::Join("`n", $Lines)) + "`n")
}

function Get-Sha256Lower([string]$Path) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $hash = $sha.ComputeHash($stream)
  } finally {
    $stream.Dispose()
    $sha.Dispose()
  }
  $builder = New-Object System.Text.StringBuilder
  foreach ($byte in $hash) {
    [void]$builder.Append($byte.ToString('x2'))
  }
  return $builder.ToString()
}

function Get-JsonString([string]$Path, [string]$Key) {
  $text = [System.IO.File]::ReadAllText($Path, $script:Utf8)
  $pattern = '"' + [regex]::Escape($Key) + '": "([^"]*)"'
  $match = [regex]::Match($text, $pattern)
  if (-not $match.Success) { Fail "missing JSON string $Key in $Path" }
  return $match.Groups[1].Value
}

function Assert-NoCr([string]$Path) {
  foreach ($byte in [System.IO.File]::ReadAllBytes($Path)) {
    if ($byte -eq 13) { Fail "CR found in $Path" }
  }
}

function Assert-SameFile([string]$Left, [string]$Right, [string]$Label) {
  $a = [System.IO.File]::ReadAllBytes($Left)
  $b = [System.IO.File]::ReadAllBytes($Right)
  if ($a.Length -ne $b.Length) { Fail "byte length mismatch: $Label" }
  for ($i = 0; $i -lt $a.Length; $i++) {
    if ($a[$i] -ne $b[$i]) { Fail "byte mismatch: $Label at offset $i" }
  }
}

function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Rest)
  $all = $script:GitPrefix + $Rest
  & git @all
  if ($LASTEXITCODE -ne 0) { Fail "git $($Rest -join ' ') failed ($LASTEXITCODE)" }
}

function Invoke-GitQuiet {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Rest)
  $all = $script:GitPrefix + $Rest
  $output = & git @all 2>&1
  if ($LASTEXITCODE -ne 0) {
    foreach ($line in @($output)) { [Console]::Error.WriteLine($line) }
    Fail "git $($Rest -join ' ') failed ($LASTEXITCODE)"
  }
}

try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git is required" }

  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $toolkit = Split-Path -Parent $scriptDir
  $attributes = Join-Path $toolkit '.gitattributes'
  if (-not (Test-Path -LiteralPath $attributes)) { Fail "missing $attributes" }

  $script:Work = Join-Path ([System.IO.Path]::GetTempPath()) ("ledger-smoke-" + [guid]::NewGuid().ToString('n'))
  $hooks = Join-Path $script:Work 'empty-hooks'
  $emptyCfg = Join-Path $script:Work 'empty-gitconfig'
  $ledger = Join-Path $script:Work 'ledger'
  $clone = Join-Path $script:Work 'clone'
  $project = Join-Path (Join-Path $ledger 'projects') 'smoke-project'
  $v2 = Join-Path $project 'coordination-v2'
  New-Item -ItemType Directory -Path $hooks | Out-Null
  Write-Utf8Text $emptyCfg ''

  $env:GIT_CONFIG_NOSYSTEM = '1'
  $env:GIT_CONFIG_GLOBAL = $emptyCfg
  $script:GitPrefix = @(
    '-c', "core.hooksPath=$hooks",
    '-c', "core.excludesFile=$emptyCfg",
    '-c', 'init.defaultBranch=main',
    '-c', 'core.autocrlf=true',
    '-c', 'protocol.file.allow=always',
    '-c', 'user.name=Synthetic Smoke',
    '-c', 'user.email=smoke@invalid',
    '-c', 'commit.gpgsign=false'
  )

  New-Item -ItemType Directory -Path (Join-Path $project 'history') | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $project 'receipts') | Out-Null
  New-Item -ItemType Directory -Path $v2 | Out-Null
  [System.IO.File]::Copy($attributes, (Join-Path $ledger '.gitattributes'))

  $handoffLines = @(
    '# Synthetic smoke handoff',
    'Project goal: exercise the local ledger file protocol without a language runtime.',
    'Verified work: none; this file is synthetic.',
    'Reported but unverified: none.',
    'Open questions: none.',
    'Next authorized task: none; smoke only.',
    'Unresolved ownership: none.',
    'Source reference: SHA-256 of these exact bytes, labeled a handoff-content digest, not a Git revision or authenticated origin.'
  )
  $handoffText = ([string]::Join("`n", $handoffLines)) + "`n" + "Literal CRLF kept for the clone check.`r`n"
  $handoff = Join-Path $script:Work 'handoff.md'
  Write-Utf8Text $handoff $handoffText
  $historySha = Get-Sha256Lower $handoff
  if ($historySha -notmatch '^[a-f0-9]{64}$') { Fail "history hash is not 64 lowercase hex: $historySha" }

  $current = Join-Path $project 'CURRENT_STATE.md'
  $original = Join-Path (Join-Path $project 'history') 'original.md'
  [System.IO.File]::Copy($handoff, $current)
  [System.IO.File]::Copy($handoff, $original)
  Assert-SameFile $current $original 'handoff copies'

  Write-Lf (Join-Path $project 'snapshot-input.json') @(
    '{',
    '  "schema": 1,',
    '  "history": "history/original.md",',
    "  `"history_sha256`": `"$historySha`",",
    "  `"source_revision`": `"$historySha`",",
    '  "facts": [',
    '    "Synthetic shell smoke; no members admitted and no permission granted."',
    '  ]',
    '}'
  )

  $receipt = Join-Path (Join-Path $project 'receipts') 'smoke-receipt-0001.json'
  Write-Lf $receipt @(
    '{',
    '  "schema": 1,',
    '  "kind": "agent-receipt",',
    '  "id": "smoke-receipt-0001",',
    '  "project": "smoke-project",',
    '  "actor_declared": "smoke-operator",',
    '  "task_id": "shell-git-smoke",',
    '  "status": "received",',
    '  "at": "2000-01-01T00:00:00.000Z",',
    "  `"source_revision`": `"$historySha`",",
    '  "summary": "Synthetic shell smoke acknowledgment; no permission requested or granted.",',
    '  "evidence": [',
    '    "projects/smoke-project/history/original.md"',
    '  ],',
    '  "authorization": "ordinary-record-not-approval"',
    '}'
  )
  Assert-NoCr $receipt
  if ((Get-JsonString (Join-Path $project 'snapshot-input.json') 'history_sha256') -cne $historySha) {
    Fail 'snapshot history_sha256 mismatch'
  }
  if ((Get-JsonString $receipt 'source_revision') -cne $historySha) {
    Fail 'receipt source_revision mismatch'
  }
  if ((Get-Sha256Lower $original) -cne $historySha) { Fail 'archived history hash mismatch' }
  $receiptText = [System.IO.File]::ReadAllText($receipt, $script:Utf8)
  if (-not $receiptText.Contains('"authorization": "ordinary-record-not-approval"')) {
    Fail 'receipt missing ordinary-record authorization'
  }

  Write-Lf (Join-Path $v2 '.gitignore') @('writer.lock', '.pending-*')
  Write-Lf (Join-Path $v2 '.gitattributes') @(
    '.gitattributes text eol=lf',
    '.gitignore text eol=lf',
    'journal/** -text'
  )

  $lock = Join-Path $v2 'writer.lock'
  $created = $null
  try {
    $created = [System.IO.File]::Open($lock, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
  } finally {
    if ($null -ne $created) { $created.Dispose() }
  }
  $second = $null
  $secondOpened = $false
  try {
    $second = [System.IO.File]::Open($lock, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    $secondOpened = $true
  } catch {
    $secondOpened = $false
  } finally {
    if ($null -ne $second) { $second.Dispose() }
  }
  if ($secondOpened) { Fail 'second exclusive create of writer.lock succeeded' }

  $lockItem = Get-Item -LiteralPath $lock -Force
  if ($lockItem.Length -ne 0) { Fail 'writer.lock must be empty' }
  if ($lockItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
    Fail 'writer.lock must not be a reparse point'
  }

  $lockLine = 'writer.lock: empty exclusive sentinel; second create refused; not committed'
  if ($env:OS -ne 'Windows_NT') {
    & chmod 600 $lock
    if ($LASTEXITCODE -ne 0) { Fail 'chmod 600 writer.lock failed' }
    $listing = & /bin/ls -l $lock
    $perms = (($listing -split '\s+', 2)[0])
    if ($perms -notlike '-rw-------*') { Fail "writer.lock mode is $perms; expected 0600 (-rw-------)" }
    $lockLine = 'writer.lock: empty exclusive sentinel mode 0600; not committed'
  }

  $pending = Join-Path $v2 '.pending-smoke'
  Write-Utf8Text $pending ''

  Invoke-GitQuiet -C $ledger init '--template='
  $ignoreLock = $script:GitPrefix + @('-C', $ledger, 'check-ignore', '-q', '--', 'projects/smoke-project/coordination-v2/writer.lock')
  & git @ignoreLock > $null
  if ($LASTEXITCODE -ne 0) { Fail 'writer.lock is not ignored' }
  $ignorePending = $script:GitPrefix + @('-C', $ledger, 'check-ignore', '-q', '--', 'projects/smoke-project/coordination-v2/.pending-smoke')
  & git @ignorePending > $null
  if ($LASTEXITCODE -ne 0) { Fail '.pending-* is not ignored' }
  Remove-Item -LiteralPath $pending -Force

  Invoke-Git -C $ledger add -A
  Invoke-GitQuiet -C $ledger commit -m 'Synthetic smoke ledger'

  $listArgs = $script:GitPrefix + @('-C', $ledger, 'ls-files')
  $rawList = & git @listArgs
  if ($LASTEXITCODE -ne 0) { Fail 'git ls-files failed' }
  $listed = @($rawList | ForEach-Object { "$_".Trim() } | Where-Object { $_ -ne '' })
  $expected = @(
    '.gitattributes',
    'projects/smoke-project/CURRENT_STATE.md',
    'projects/smoke-project/coordination-v2/.gitattributes',
    'projects/smoke-project/coordination-v2/.gitignore',
    'projects/smoke-project/history/original.md',
    'projects/smoke-project/receipts/smoke-receipt-0001.json',
    'projects/smoke-project/snapshot-input.json'
  )
  if ($listed.Count -ne $expected.Count) { Fail "committed file count $($listed.Count) != $($expected.Count)" }
  foreach ($rel in $expected) {
    $found = $false
    foreach ($item in $listed) {
      if ($item -ceq $rel) { $found = $true }
    }
    if (-not $found) { Fail "missing committed file: $rel" }
  }
  foreach ($item in $listed) {
    if ($item -ceq 'projects/smoke-project/coordination-v2/writer.lock') {
      Fail 'writer.lock was committed'
    }
  }

  $statusArgs = $script:GitPrefix + @('-C', $ledger, 'status', '--porcelain')
  $rawStatus = & git @statusArgs
  if ($LASTEXITCODE -ne 0) { Fail 'git status failed' }
  $porcelain = @($rawStatus | ForEach-Object { "$_".Trim() } | Where-Object { $_ -ne '' })
  if ($porcelain.Count -gt 0) { Fail "unexpected porcelain status: $($porcelain -join ' ')" }

  Invoke-GitQuiet clone --no-local --config core.autocrlf=true $ledger $clone
  $autocrlf = & git -C $clone config --local core.autocrlf
  if ($LASTEXITCODE -ne 0 -or $autocrlf -cne 'true') { Fail "clone core.autocrlf is $autocrlf" }

  foreach ($rel in $expected) {
    Assert-SameFile (Join-Path $ledger $rel) (Join-Path $clone $rel) $rel
  }
  $cloneLock = Join-Path (Join-Path (Join-Path (Join-Path $clone 'projects') 'smoke-project') 'coordination-v2') 'writer.lock'
  if (Test-Path -LiteralPath $cloneLock) { Fail 'clone contains writer.lock' }
  $cloneProject = Join-Path (Join-Path $clone 'projects') 'smoke-project'
  $cloneHistory = Join-Path (Join-Path $cloneProject 'history') 'original.md'
  $cloneState = Join-Path $cloneProject 'CURRENT_STATE.md'
  $cloneReceipt = Join-Path (Join-Path $cloneProject 'receipts') 'smoke-receipt-0001.json'
  if ((Get-Sha256Lower $cloneHistory) -cne $historySha) { Fail 'clone history hash mismatch' }
  if ((Get-Sha256Lower $cloneState) -cne $historySha) { Fail 'clone handoff hash mismatch' }
  $receiptSha = Get-Sha256Lower $receipt
  if ($receiptSha -notmatch '^[a-f0-9]{64}$') { Fail 'receipt hash is not 64 lowercase hex' }
  if ((Get-Sha256Lower $cloneReceipt) -cne $receiptSha) { Fail 'clone receipt hash mismatch' }

  $revArgs = $script:GitPrefix + @('-C', $ledger, 'rev-parse', 'HEAD')
  $commit = (& git @revArgs)
  if ($LASTEXITCODE -ne 0) { Fail 'git rev-parse failed' }
  $commit = "$commit".Trim()

  $protocol = Join-Path $toolkit 'PROTOCOL.md'
  $coordTemplate = Join-Path (Join-Path $toolkit 'templates') 'HOW_WE_COORDINATE.md'
  if (-not (Test-Path -LiteralPath $protocol)) { Fail "missing $protocol" }
  if (-not (Test-Path -LiteralPath $coordTemplate)) { Fail "missing $coordTemplate" }
  $templateText = [System.IO.File]::ReadAllText($coordTemplate, $script:Utf8)
  if (-not $templateText.Contains('<commit or unset>')) { Fail 'template missing revision token' }
  if (-not $templateText.Contains('docs/PROTOCOL.md')) { Fail 'template does not point at docs/PROTOCOL.md' }
  $filled = $templateText.Replace('<commit or unset>', 'unset')
  if ($filled.Contains('<commit or unset>')) { Fail 'HOW_WE_COORDINATE still has the unfilled revision token' }
  if (-not $filled.Contains('Toolkit docs revision (optional): unset')) { Fail 'HOW_WE_COORDINATE revision line was not filled' }
  if (-not $filled.Contains('CURRENT_STATE.md')) { Fail 'HOW_WE_COORDINATE does not point at CURRENT_STATE.md' }

  $minimal = Join-Path $script:Work 'minimal'
  $minimalClone = Join-Path $script:Work 'minimal-clone'
  $minimalDocs = Join-Path $minimal 'docs'
  $minimalProject = Join-Path (Join-Path $minimal 'projects') 'PROJECT'
  New-Item -ItemType Directory -Path $minimalDocs | Out-Null
  New-Item -ItemType Directory -Path $minimalProject | Out-Null
  $minimalAttributes = Join-Path $minimal '.gitattributes'
  $minimalProtocol = Join-Path $minimalDocs 'PROTOCOL.md'
  $minimalCoordinate = Join-Path $minimalDocs 'HOW_WE_COORDINATE.md'
  $minimalState = Join-Path $minimalProject 'CURRENT_STATE.md'
  [System.IO.File]::Copy($attributes, $minimalAttributes)
  [System.IO.File]::Copy($protocol, $minimalProtocol)
  Write-Utf8Text $minimalCoordinate $filled
  Assert-SameFile $attributes $minimalAttributes 'minimal .gitattributes'
  Assert-SameFile $protocol $minimalProtocol 'docs/PROTOCOL.md'
  Write-Lf $minimalState @(
    '# Synthetic minimal handoff',
    '',
    'Goal: exercise Minimal ledger shape only.',
    'Decisions: none.',
    'Verified: none. This file is synthetic.',
    'Reported but unverified: none.',
    'Open questions: none.',
    'Next authorized task: none. Shape check only.',
    'Unresolved ownership: none.'
  )
  $stateText = [System.IO.File]::ReadAllText($minimalState, $script:Utf8)
  foreach ($field in @('Goal', 'Decisions', 'Verified', 'unverified', 'Open questions', 'Next authorized task', 'Unresolved ownership')) {
    if (-not $stateText.Contains($field)) { Fail "CURRENT_STATE missing $field" }
  }

  Invoke-GitQuiet -C $minimal init '--template='
  Invoke-Git -C $minimal add -- .gitattributes docs/PROTOCOL.md docs/HOW_WE_COORDINATE.md projects/PROJECT/CURRENT_STATE.md
  Invoke-GitQuiet -C $minimal commit -m 'Synthetic minimal ledger'

  $minimalListArgs = $script:GitPrefix + @('-C', $minimal, 'ls-files')
  $rawMinimal = & git @minimalListArgs
  if ($LASTEXITCODE -ne 0) { Fail 'minimal git ls-files failed' }
  $minimalListed = @($rawMinimal | ForEach-Object { "$_".Trim() } | Where-Object { $_ -ne '' })
  $minimalExpected = @(
    '.gitattributes',
    'docs/HOW_WE_COORDINATE.md',
    'docs/PROTOCOL.md',
    'projects/PROJECT/CURRENT_STATE.md'
  )
  if ($minimalListed.Count -ne $minimalExpected.Count) {
    Fail "minimal committed file count $($minimalListed.Count) != $($minimalExpected.Count)"
  }
  foreach ($rel in $minimalExpected) {
    $foundMinimal = $false
    foreach ($item in $minimalListed) {
      if ($item -ceq $rel) { $foundMinimal = $true }
    }
    if (-not $foundMinimal) { Fail "missing minimal committed file: $rel" }
  }

  Invoke-GitQuiet clone --no-local --config core.autocrlf=true $minimal $minimalClone
  foreach ($rel in $minimalExpected) {
    Assert-SameFile (Join-Path $minimal $rel) (Join-Path $minimalClone $rel) "minimal $rel"
  }
  Assert-SameFile $protocol (Join-Path (Join-Path $minimalClone 'docs') 'PROTOCOL.md') 'cloned docs/PROTOCOL.md'
  Assert-SameFile $attributes (Join-Path $minimalClone '.gitattributes') 'cloned minimal .gitattributes'

  Write-Output 'ledger-smoke: ok'
  Write-Output "history_sha256: $historySha"
  Write-Output "receipt_sha256: $receiptSha"
  Write-Output "commit: $commit"
  Write-Output 'clone: core.autocrlf=true byte match'
  Write-Output $lockLine
  Write-Output 'minimal-ledger: docs/PROTOCOL.md byte match'
  $script:Failed = $false
} finally {
  if ($script:Work -and (Test-Path -LiteralPath $script:Work)) {
    if ($script:Failed -or $env:SMOKE_KEEP -eq '1') {
      [Console]::Error.WriteLine("ledger-smoke: kept $($script:Work)")
    } else {
      Remove-Item -LiteralPath $script:Work -Recurse -Force
    }
  }
}
