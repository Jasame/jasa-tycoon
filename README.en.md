# World Tycoon · 环球大富翁

A browser property-trading board game for **2–4 remote seats, solo play against AI, or local hotseat play**. Explore cities, buy property and upgrade on return visits while balancing growth against cash risk.

**[Play online](https://jasa.hk/tycoon/)** · **[V12.0.1 release and source package](https://github.com/Jasame/jasa-tycoon/releases/tag/v12.0.1)** · [中文](README.md) · [Changelog](CHANGELOG.md) · [Deployment](DEPLOYMENT.md)

Current game version: **V12.0.1 / backend 12.0.0** · Simplified Chinese / Traditional Chinese / English · MIT


V12.0.1 fixes dark-mode contrast in statistics, save controls, forms and labels. See [patch notes](V12.0.1-RELEASE-NOTES.md).

## New in V12

A unified warm-white, deep-green and gold visual design across three themes. A consolidated header, four menu groups, progressive decision details, compact clickable player rows, quieter property tiles and shorter motion. Mobile keeps primary actions in its dock while retaining extra choices. Existing iPad layouts, saved games and V11 multiplayer tools remain available. See [V12 release notes](V12-RELEASE-NOTES.md).

## Features

- **Three ways to play:** AI opponents, local hotseat, or remote rooms with AI filling empty lobby seats.
- **Nine maps:** the world, seven continents and classic Chinese cities, with map-based starting cash, illustrations, economic effects and optional objectives.
- **Property management:** purchases, auctions, upgrades, building sales, mortgages, redemption, cash offers, upkeep and audits.
- **Strategy journeys:** four careers, cards, transit branches, personal goals, shared missions, landmarks and upcoming world news.
- **Clear decisions:** numbered pieces with your own square outline, a locate button, contextual onboarding, cash-after-spending and rent estimates, and an actual-cash ledger.
- **Room tools:** invite codes, links and locally generated QR codes; readiness countdowns, host transfer, reconnection and rematches.
- **Device settings:** mobile action dock, board zoom, landscape layouts, large text and left/right-handed controls. Three themes, a focus layout and twelve cartoon avatars.
- **Optional assistance:** auto-roll, ordinary-arrival auto-end, quiet purchase offers and auctions, sound levels and supported-device haptics.
- **Presentation:** short rent-transfer, arrival, upgrade and victory effects, reduced motion, and cosmetic-only pieces, dice, frames and map badges.

Secondary information stays in the menu and journey tools. Auto-roll never buys or upgrades on your behalf.

## Start playing

1. Open [jasa.hk/tycoon](https://jasa.hk/tycoon/) and start a new game, or continue this browser's saved progress.
2. Locate your numbered, square-outlined piece and roll. Buy an unowned property or send it to auction. **Land again on your own unmortgaged property** to pay for one upgrade, up to level four; passing it or just buying it does not grant an upgrade.
3. For remote play, create a room, share the invite, wait for readiness and start as host. AI can fill empty lobby seats.

Win by net worth at the round limit, or by being the last solvent player. Keep cash for upkeep, audits and liabilities. New-game rules and existing saved-game rules can differ; older games keep the features they enabled.

## V10 decisions

| Choice | Effect |
|---|---|
| Steady map route | Once per game, receive 300 immediately |
| Exploration route | Complete the map-specific objective after choosing it to earn 900; no reward if unfinished |
| Comeback challenge | From round 6, below 65% of the active leader's net worth: voluntarily deposit 300, then visit two different properties or hubs by the current round plus four to recover the deposit and earn 900. Once per game; no refund if unfinished at expiry or game end |
| Purchase-offer opt-out | Decline further offers this game; every offer also gives the seller a three-round cooldown across all buyers |
| Quick room | 12 rounds, up to 90 seconds per stage; standard rooms use 20 rounds and 180 seconds per stage |

Map starting cash: World 10,000; Asia 9,500; Europe 11,000; Africa 8,500; North America 12,000; South America 9,000; Oceania 10,500; Antarctica 9,000; Classic 10,000. Amounts are fictional in-game currency. See the [Chinese map table](README.md#地图与启动资金) and [full V10 notes](V10-RELEASE-NOTES.md) for objectives and compatibility.

## Multiplayer and data

The server generates dice rolls and validates actions, balances, turn ownership, revisions and request IDs. Retries are deduplicated. Offline seats are retained; refresh or use a saved seat to reconnect. Timeouts perform default actions, including skipping purchases and bids; debt is liquidated first.

A browser tab lease makes duplicate tabs of one seat read-only until takeover or expiry. Cross-device requests still rely on server validation. Lobby rooms are retained for 24 hours after the last change, and started/finished rooms for seven days after the last action. Invitations contain a room code, never seat credentials.

Local play has auto-save, five manual slots, a previous-game backup and JSON import/export. Online games are stored separately on the server. Cosmetics and feedback stay in this browser, without account-based cloud sync. Collection files can be manually merged on another device. One-time recovery codes transfer an online seat and revoke the original credentials. Feedback is not uploaded automatically; manual report exports exclude identities, room codes, credentials, saves, raw ledgers and free text. Clearing site data resets local records.

## Run and deploy

HTML, CSS and vanilla JavaScript frontend; Node.js 20 backend using built-in modules. **No npm install or frontend build step.** QR generation and Chinese conversion libraries are bundled locally with their licenses.

For local AI/hotseat play, serve the repository root with any static server, for example:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/tycoon/`. This does not provide remote rooms. Start the backend separately with:

```sh
node server/server.cjs
```

The backend binds to `127.0.0.1:8912`; remote play requires a same-origin `/tycoon/api/` proxy, persistent storage and HTTPS in production. **`deploy-v12.sh` upgrades the existing BaoTa installation** and has environment-specific paths. Read [DEPLOYMENT.md](DEPLOYMENT.md) before using it on another server.

## Validation and contributions

The V12 release passed **562 checks**, including room HTTP tests, authorization, save validation, deduplication, restart recovery, language coverage and new gameplay. See [test samples](V12-TEST-REPORT.json) and [contribution instructions](CONTRIBUTING.md).

Edge checks covered quick-room startup, AI seats, duplicate-tab read-only mode, takeover, language switching and a 320-pixel viewport. Automated flows and browser emulation do not replace physical-device or long-term human testing. Audio and vibration depend on browser/device support; balance still needs player feedback.

Report issues through [GitHub Issues](https://github.com/Jasame/jasa-tycoon/issues) or contribute a pull request. Keep seat credentials and private room data out of public reports.

## License and history

[MIT License](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md) · [Changelog](CHANGELOG.md) · [All releases](https://github.com/Jasame/jasa-tycoon/releases)
