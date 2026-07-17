async function runTests() {
  const baseURL = 'https://mc-survival-wiki.orfel.de';
  let passed = 0;
  let failed = 0;

  console.log(`Starte E2E HTTP-Tests gegen ${baseURL}...\n`);

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ FAIL: ${name}`);
      console.error('   ', e.message);
      failed++;
    }
  }

  await test('Public Pages - Startseite lädt erfolgreich', async () => {
    const res = await fetch(`${baseURL}/`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    if (!text.includes('Server Wiki')) throw new Error('Titel "Server Wiki" nicht im HTML gefunden');
  });

  await test('Suchfunktion - Seite lädt', async () => {
    const res = await fetch(`${baseURL}/search`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    if (!text.includes('Erweiterte Suche')) throw new Error('Titel "Erweiterte Suche" nicht gefunden');
  });

  await test('Authentifizierung - Login-Seite lädt', async () => {
    const res = await fetch(`${baseURL}/auth`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    if (!text.includes('Anmelden')) throw new Error('String "Anmelden" nicht gefunden');
  });

  await test('Sicherheit - Editor-Routen antworten ohne Crash', async () => {
    const res = await fetch(`${baseURL}/editor/recipes`);
    // Die Seite sollte entweder normal laden (geschützt durch JS/SSR React) oder einen Redirect machen, aber nicht crashen
    if (res.status >= 500) throw new Error(`Server Crash auf Editor-Route: ${res.status}`);
  });

  console.log(`\n==================================`);
  console.log(`🏁 Testlauf beendet: ${passed} Bestanden, ${failed} Fehlgeschlagen`);
  console.log(`==================================\n`);
}

runTests();
