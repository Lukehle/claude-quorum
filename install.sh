#!/usr/bin/env bash
# claude-quorum installer - copies skills into ~/.claude/skills/
# Prompts before overwriting anything that already exists.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skills"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

[ -d "$SRC" ] || { echo "ERROR: skills/ not found next to this script." >&2; exit 1; }
mkdir -p "$DEST"

installed=0
skipped=0

for dir in "$SRC"/*/; do
  name="$(basename "$dir")"
  target="$DEST/$name"
  if [ -e "$target" ]; then
    printf 'Skill "%s" already exists at %s. Overwrite? [y/N] ' "$name" "$target"
    read -r reply </dev/tty || reply="n"
    case "$reply" in
      [yY]*) rm -rf "$target" ;;
      *) echo "  skipped $name"; skipped=$((skipped + 1)); continue ;;
    esac
  fi
  cp -R "$dir" "$target"
  echo "  installed $name"
  installed=$((installed + 1))
done

echo
echo "claude-quorum: $installed installed, $skipped skipped -> $DEST"
echo
echo "Next steps:"
echo "  * Verify the library: node tools/quorum-lib.test.mjs"
echo "  * Scaffold a run:     node tools/scaffold.mjs --subject \"X\" --adapter code"
echo "  * Then invoke: /quorum <question or scope>"
echo "  * Read CALIBRATION.md for what the design is actually based on"
