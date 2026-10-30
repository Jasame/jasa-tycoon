World Tycoon v4 remote multiplayer

Requires Node.js 20 and a persistent backend. Static-only deployment preserves local mode but cannot provide remote rooms.

Review deploy.sh, server/world-tycoon.service and server/tycoon-online.conf. Run bash deploy.sh prepare, verify the preview, then bash deploy.sh publish.

Backend programs and room data stay outside the public web root. The service binds to loopback port 8912; Nginx proxies /tycoon/api/ over HTTPS.

Run node verify.cjs and node verify-online.cjs before deployment. Back up /var/lib/tycoon-online for room recovery. MIT licensed.
