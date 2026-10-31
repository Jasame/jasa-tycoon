#!/bin/bash
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
node_bin=/www/server/nodejs/v20.9.0/bin/node
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-v60
new_app=/www/tycoon-online/app-v60
app_dir=/www/tycoon-online/app-v4
backup_dir=/www/tycoon-online/backups
case "${1:-prepare}" in
prepare)
    cd "$release_dir"
    "$node_bin" verify.cjs
    "$node_bin" verify-online.cjs
    "$node_bin" verify-adventures.cjs
    "$node_bin" verify-interface.cjs
    "$node_bin" verify-economy.cjs
    "$node_bin" verify-landing.cjs
    "$node_bin" verify-comfort.cjs
    "$node_bin" verify-display.cjs
    "$node_bin" verify-pawn.cjs
    "$node_bin" verify-v6.cjs
    test ! -e "$stage_dir"
    test ! -e "$new_app"
    mkdir -p "$stage_dir" "$new_app"
    cp -a tycoon/. "$stage_dir/"
    cp -a server tycoon "$new_app/"
    chmod -R a+rX "$stage_dir" "$new_app"
    echo "V60_PREVIEW_READY https://jasa.hk/tycoon-v60/"
    ;;
publish)
    test -f "$new_app/tycoon/adventures.js"
    test -f "$stage_dir/v6-ui.js"
    curl -fsS https://jasa.hk/tycoon/api/health
    mkdir -p "$backup_dir"
    stamp=$(date +%Y%m%d%H%M%S)
    old_app=$backup_dir/app-before-v60-$stamp
    old_web=$backup_dir/tycoon-before-v60-$stamp
    old_rooms=$backup_dir/rooms-before-v60-$stamp.json
    test ! -f /var/lib/tycoon-online/rooms.json || cp -a /var/lib/tycoon-online/rooms.json "$old_rooms"
    systemctl stop world-tycoon.service
    mv "$app_dir" "$old_app"
    mv "$new_app" "$app_dir"
    systemctl start world-tycoon.service
    ready=false
    for attempt in 1 2 3 4 5; do
        if curl -fsS http://127.0.0.1:8912/tycoon/api/health; then ready=true; break; fi
        sleep 1
    done
    if [ "$ready" != true ]; then
        systemctl stop world-tycoon.service
        mv "$app_dir" "$new_app"
        mv "$old_app" "$app_dir"
        test ! -f "$old_rooms" || cp -a "$old_rooms" /var/lib/tycoon-online/rooms.json
        systemctl start world-tycoon.service
        echo 'Backend reverted; previous website retained.'
        exit 1
    fi
    mv "$web_root/tycoon" "$old_web"
    if ! mv "$stage_dir" "$web_root/tycoon"; then
        mv "$old_web" "$web_root/tycoon"
        systemctl stop world-tycoon.service
        mv "$app_dir" "$new_app"
        mv "$old_app" "$app_dir"
        test ! -f "$old_rooms" || cp -a "$old_rooms" /var/lib/tycoon-online/rooms.json
        systemctl start world-tycoon.service
        exit 1
    fi
    curl -fsS https://jasa.hk/tycoon/api/health
    echo "V60_PUBLISHED https://jasa.hk/tycoon/"
    echo "Old frontend: $old_web"
    echo "Old backend: $old_app"
    ;;
*) echo 'Usage: bash deploy-display.sh prepare|publish'; exit 1 ;;
esac
