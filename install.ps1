# claude-quorum installer - copies skills into ~/.claude/skills/
# Prompts before overwriting anything that already exists.

$ErrorActionPreference = 'Stop'

$src = Join-Path $PSScriptRoot 'skills'
$dest = if ($env:CLAUDE_SKILLS_DIR) { $env:CLAUDE_SKILLS_DIR } else { Join-Path $HOME '.claude\skills' }

if (-not (Test-Path $src)) {
    Write-Error "skills/ not found next to this script."
}
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
}

$installed = 0
$skipped = 0

foreach ($dir in Get-ChildItem -Path $src -Directory) {
    $target = Join-Path $dest $dir.Name
    if (Test-Path $target) {
        $reply = Read-Host "Skill `"$($dir.Name)`" already exists. Overwrite? [y/N]"
        if ($reply -notmatch '^[yY]') {
            Write-Host "  skipped $($dir.Name)"
            $skipped++
            continue
        }
        Remove-Item -Recurse -Force $target
    }
    Copy-Item -Recurse -Path $dir.FullName -Destination $target
    Write-Host "  installed $($dir.Name)"
    $installed++
}

Write-Host ""
Write-Host "claude-quorum: $installed installed, $skipped skipped -> $dest"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  * Verify the library: node tools/quorum-lib.test.mjs"
Write-Host "  * Scaffold a run:     node tools/scaffold.mjs --subject 'X' --adapter code"
Write-Host "  * Then invoke: /quorum <question or scope>"
Write-Host "  * Read CALIBRATION.md for what the design is actually based on"
