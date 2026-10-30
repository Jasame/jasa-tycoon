#!/bin/bash
# Frontend-only update; running rooms and persisted server state stay in place.
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-v42
backup_dir=/www/tycoon-online/backups
case "${1:-prepare}" in
prepare)
    test ! -e "$stage_dir"
    mkdir -p "$stage_dir"
    cp -a "$release_dir/tycoon/." "$stage_dir/"
    chmod -R a+rX "$stage_dir"
    echo "V42_PREVIEW_READY https://jasa.hk/tycoon-v42/"
    ;;
publish)
    test -f "$stage_dir/responsive.js"
    test -f "$stage_dir/responsive.css"
    curl -fsS https://jasa.hk/tycoon/api/health
    mkdir -p "$backup_dir"
    old_dir=$backup_dir/tycoon-before-v42-$(date +%Y%m%d%H%M%S)
    mv "$web_root/tycoon" "$old_dir"
    if ! mv "$stage_dir" "$web_root/tycoon"; then
        mv "$old_dir" "$web_root/tycoon"
        exit 1
    fi
    echo "V42_PUBLISHED https://jasa.hk/tycoon/"
    echo "Previous frontend: $old_dir"
    ;;
*) echo "Usage: bash deploy-responsive.sh prepare|publish"; exit 1 ;;
esac
