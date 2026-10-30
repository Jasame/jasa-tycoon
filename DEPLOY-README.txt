City Tycoon — jasa.hk/tycoon deployment

This archive contains the original standalone game. No Node.js, Python, database or build step is required on the server.

BaoTa deployment:
1. Open Files and navigate to /www/wwwroot/jasa.hk.
2. Upload this ZIP and extract it here, keeping the tycoon folder.
3. Confirm /www/wwwroot/jasa.hk/tycoon/index.html exists.
4. Visit https://jasa.hk/tycoon/ and start a game.

The package contains only tycoon/index.html, tycoon/style.css and tycoon/game.js. It does not update the homepage, /bank/, Nginx, SSL or existing services. If a tycoon directory already exists, preserve a copy before replacing its files.

Nginx normally redirects /tycoon to /tycoon/ and serves index.html. If it returns 404 or another page instead, inspect the current jasa.hk Nginx configuration before making changes.

Game saves are stored in browser localStorage. Saved progress on the previous chatgpt.site origin will not automatically transfer to jasa.hk.

Validation: JavaScript syntax check passed; HTML stylesheet and script references are relative and resolve within tycoon/. Live server and browser validation are pending because this session has no server connection.
