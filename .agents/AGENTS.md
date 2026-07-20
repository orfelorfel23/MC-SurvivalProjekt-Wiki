# Project-Scoped Rules

- Alle Änderungen immer direkt ins git (Always commit all changes directly to git).
- Jede Änderung im Git triggert einen Rebuild des Servers auf der Jannik Cloud.
- Die Hauptseite ist https://mc-survival-wiki.orfel.de/. Für lokales Testen kann Docker genutzt werden.
- Am Ende jeder Session (jedoch NUR, wenn in der Session Änderungen via Git gepusht wurden) muss dem Benutzer ein kurzer Docker-Befehl für die Jannik-Cloud bereitgestellt werden, um nur den Service neu zu starten (z.B. `cd /opt/Jannik-Cloud/services/mc-survival-wiki && docker compose up -d --build mc-survival-wiki-web` oder `cd /opt/Jannik-Cloud/services/mc-survival-wiki && docker compose restart mc-survival-wiki-web`), damit das komplette Deploy-Skript nicht jedes Mal durchlaufen muss.
