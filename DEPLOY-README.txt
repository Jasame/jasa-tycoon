World Tycoon / 环球大富翁 — V11.0 deployment entry

Read DEPLOYMENT.md for local play, first installation, same-origin proxy setup,
persistent room storage, upgrades, backups and rollback details.

Current upgrade script for the existing BaoTa environment:
  bash deploy-v11.sh prepare
  bash deploy-v11.sh publish

This script uses environment-specific paths and an already installed service.
Do not use historical deploy.sh (V4) as the current V11 upgrade guide.

The frontend needs no build step. The Node.js backend uses built-in modules;
third-party browser components are bundled locally with their own licenses.
Remote rooms require a persistent backend and same-origin /tycoon/api/ proxy.
Static hosting alone supports AI/local play. Use HTTPS in production.

Full validation commands: CONTRIBUTING.md
Current features: README.md / README.en.md
Release history: CHANGELOG.md
Licenses: LICENSE / THIRD-PARTY-NOTICES.md
