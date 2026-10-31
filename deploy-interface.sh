#!/bin/bash
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
node_bin=/www/server/nodejs/v20.9.0/bin/node
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-v44
backup_dir=/www/tycoon-online/backups
case "${1:-prepare}" in
prepare)
    cd "$release_dir"
    "$node_bin" verify-interface.cjs
    test ! -e "$stage_dir"
    mkdir -p "$stage_dir"
    cp -a tycoon/. "$stage_dir/"
    chmod -R a+rX "$stage_dir"
    echo 'V44_PREVIEW_READY https://jasa.hk/tycoon-v44/'
    ;;
publish)
    test -f "$stage_dir/compact-ui.js"
    test -f "$stage_dir/compact.css"
    curl -fsS https://jasa.hk/tycoon/api/health
    mkdir -p "$backup_dir"
    old_dir=$backup_dir/tycoon-before-v44-$(date +%Y%m%d%H%M%S)
    mv "$web_root/tycoon" "$old_dir"
    if ! mv "$stage_dir" "$web_root/tycoon"; then
        mv "$old_dir" "$web_root/tycoon"
        exit 1
    fi
    echo 'V44_PUBLISHED https://jasa.hk/tycoon/'
    echo "Previous frontend: $old_dir"
    ;;
*) echo 'Usage: bash deploy-interface.sh prepare|publish'; exit 1 ;;
esac
