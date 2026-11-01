#!/bin/bash
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-contrast
node_bin=/www/server/nodejs/v20.9.0/bin/node
case "${1:-prepare}" in
prepare)
    cd "$release_dir"
    "$node_bin" verify-contrast.cjs
    test ! -e "$stage_dir"
    cp -a "$web_root/tycoon" "$stage_dir"
    cp tycoon/studio.css tycoon/index.html "$stage_dir/"
    chmod -R a+rX "$stage_dir"
    echo 'CONTRAST_PREVIEW_READY https://jasa.hk/tycoon-contrast/'
    ;;
publish)
    test -f "$stage_dir/studio.css"
    backup=/www/tycoon-online/backups/tycoon-before-contrast-$(date +%Y%m%d%H%M%S)
    mv "$web_root/tycoon" "$backup"
    if ! mv "$stage_dir" "$web_root/tycoon"; then mv "$backup" "$web_root/tycoon"; exit 1; fi
    if ! curl -fsS https://jasa.hk/tycoon/ | grep -q 'studio.css?v=12.0.1'; then
        mv "$web_root/tycoon" "$stage_dir"
        mv "$backup" "$web_root/tycoon"
        echo 'Previous frontend restored.'
        exit 1
    fi
    curl -fsS https://jasa.hk/tycoon/api/health
    echo "CONTRAST_PUBLISHED V12.0.1; frontend backup: $backup"
    ;;
*) echo 'Usage: bash deploy-contrast.sh prepare|publish'; exit 1 ;;
esac
