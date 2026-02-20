# Events inclus

✅ Implémentés dans ce pack (fonctionnels) :
- guildMemberAdd (MEMBER_JOIN)
- guildMemberRemove (MEMBER_LEAVE + tentative KICK via Audit Logs)
- guildMemberUpdate (nickname/roles/timeout)
- userUpdate (avatar change)
- messageDelete (delete + tentative mod via Audit Logs)
- messageUpdate (edit before/after)
- voiceStateUpdate (join/leave/move + mute/selfmute + tentative disconnect mod)

🧩 Tous les autres eventKey de ton listing sont déjà dans `services/logs/catalog.json`
et donc configurables dans `/logs setup`.

Pour compléter: ajoute simplement les fichiers events manquants et appelle `sendLog()`.
