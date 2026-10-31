#!/bin/bash
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
node_bin=/www/server/nodejs/v20.9.0/bin/node
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-v531
backup_dir=/www/tycoon-online/backups
case "${1:-prepare}" in
prepare)
    cd "$release_dir"
    for test in verify.cjs verify-online.cjs verify-adventures.cjs verify-interface.cjs verify-economy.cjs verify-landing.cjs verify-comfort.cjs verify-display.cjs verify-pawn.cjs; do "$node_bin" "$test"; done
    test ! -e "$stage_dir"
    mkdir -p "$stage_dir"
    cp -a tycoon/. "$stage_dir/"
    chmod -R a+rX "$stage_dir"
    echo 'V531_PREVIEW_READY https://jasa.hk/tycoon-v531/'
    ;;
publish)
    test -f "$stage_dir/pawn-ui.js"
    curl -fsS https://jasa.hk/tycoon/api/health
    mkdir -p "$backup_dir"
    old_web=$backup_dir/tycoon-before-v531-$(date +%Y%m%d%H%M%S)
    mv "$web_root/tycoon" "$old_web"
    if ! mv "$stage_dir" "$web_root/tycoon"; then mv "$old_web" "$web_root/tycoon"; exit 1; fi
    curl -fsS https://jasa.hk/tycoon/api/health
    echo 'V531_PUBLISHED https://jasa.hk/tycoon/'
    echo "Old frontend: $old_web"
    ;;
*) echo 'Usage: bash deploy-pawn.sh prepare|publish'; exit 1 ;;
esac
