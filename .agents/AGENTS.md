# Project-Scoped Rules

- Alle Änderungen immer direkt ins git (Always commit all changes directly to git).
- Jede Änderung im Git triggert einen Rebuild des Servers auf der Jannik Cloud.
- Die Hauptseite ist https://mc-survival-wiki.orfel.de/. Für lokales Testen kann Docker genutzt werden.
- Am Ende jeder Session (jedoch NUR, wenn in der Session Änderungen via Git gepusht wurden) muss dem Benutzer folgender Befehl für die Jannik-Cloud bereitgestellt werden, um die neuesten Änderungen zu pullen und nur den Service neu zu starten: `git -C /mnt/Jannik-Cloud-Volume-01/mc-survival-wiki/app pull && cd /opt/Jannik-Cloud/services/mc-survival-wiki && docker compose pull && docker compose up -d`. Dadurch wird das vorkompilierte Image aus der GitHub Container Registry (GHCR) sekundenschnell geladen und das komplette Build-Skript muss auf dem Server nicht durchlaufen.
- Bei allen inhaltlichen und strukturellen Änderungen am Code muss der Sprachentoggle (Mehrsprachigkeit) beachtet werden. Änderungen dürfen nicht nur auf einer Sprache (z. B. Deutsch) erfolgen, sondern müssen auch auf der englischen Seite (bzw. allen verfügbaren Sprachen) entsprechend nachgezogen oder implementiert werden.

