#!/bin/bash
set -euo pipefail
release_dir=$(cd "$(dirname "$0")" && pwd)
node_bin=/www/server/nodejs/v20.9.0/bin/node
nginx_bin=/www/server/nginx/sbin/nginx
app_dir=/www/tycoon-online/app-v4
web_root=/www/wwwroot/jasa.hk
stage_dir=$web_root/tycoon-v4
conf_dir=/www/server/panel/vhost/nginx/extension/jasa.hk
conf_file=$conf_dir/tycoon-online.conf
backup_dir=/www/tycoon-online/backups
mode=${1:-prepare}
test -x "$node_bin"
test -x "$nginx_bin"
mkdir -p "$backup_dir"
if [ "$mode" = prepare ]; then
    cd "$release_dir"
    "$node_bin" verify.cjs
    "$node_bin" verify-online.cjs
    if [ -e "$app_dir" ] || [ -e "$stage_dir" ]; then
        echo "Existing v4 release found. Inspect before replacing it."
        exit 1
    fi
    mkdir -p "$app_dir" "$stage_dir" "$conf_dir"
    cp -a server tycoon "$app_dir/"
    cp -a tycoon/. "$stage_dir/"
    chmod -R a+rX "$app_dir" "$stage_dir"
    if [ -f /etc/systemd/system/world-tycoon.service ]; then
        cp -a /etc/systemd/system/world-tycoon.service "$backup_dir/world-tycoon.service.before-v4"
    fi
    cp server/world-tycoon.service /etc/systemd/system/world-tycoon.service
    systemctl daemon-reload
    systemctl enable --now world-tycoon.service
    for attempt in 1 2 3 4 5; do
        if curl -fsS http://127.0.0.1:8912/tycoon/api/health; then break; fi
        sleep 1
    done
    curl -fsS http://127.0.0.1:8912/tycoon/api/health
    if [ -f "$conf_file" ]; then
        cp -a "$conf_file" "$backup_dir/tycoon-online.conf.before-v4"
    fi
    cp server/tycoon-online.conf "$conf_file"
    if ! "$nginx_bin" -t; then
        mv "$conf_file" "$backup_dir/tycoon-online.conf.failed-v4"
        if [ -f "$backup_dir/tycoon-online.conf.before-v4" ]; then
            cp -a "$backup_dir/tycoon-online.conf.before-v4" "$conf_file"
        fi
        exit 1
    fi
    "$nginx_bin" -s reload
    for attempt in 1 2 3 4 5; do
        if curl -fsS https://jasa.hk/tycoon/api/health; then break; fi
        sleep 1
    done
    curl -fsS https://jasa.hk/tycoon/api/health
    echo "V4_PREVIEW_READY https://jasa.hk/tycoon-v4/"
elif [ "$mode" = publish ]; then
    cp -a "$release_dir/tycoon/." "$stage_dir/"
    test -f "$stage_dir/online.js"
    test -f "$stage_dir/index.html"
    curl -fsS https://jasa.hk/tycoon/api/health
    old_dir=$backup_dir/tycoon-before-v4-$(date +%Y%m%d%H%M%S)
    mv "$web_root/tycoon" "$old_dir"
    if ! mv "$stage_dir" "$web_root/tycoon"; then
        mv "$old_dir" "$web_root/tycoon"
        exit 1
    fi
    echo "V4_PUBLISHED https://jasa.hk/tycoon/"
    echo "Previous release: $old_dir"
else
    echo "Usage: bash deploy.sh prepare|publish"
    exit 1
fi
