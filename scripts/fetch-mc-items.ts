import fs from "fs";
import path from "path";

const ITEMS_URL = "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/items.json";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const publicItemsDir = path.join(process.cwd(), "public", "items");
  const oldIconsDir = path.join(process.cwd(), "public", "item-icons");

  if (fs.existsSync(oldIconsDir)) {
    fs.rmSync(oldIconsDir, { recursive: true, force: true });
    console.log("Removed old public/item-icons directory.");
  }
  if (fs.existsSync(publicItemsDir)) {
    fs.rmSync(publicItemsDir, { recursive: true, force: true });
    console.log("Cleared old public/items directory.");
  }
  fs.mkdirSync(publicItemsDir, { recursive: true });

  console.log("Fetching items list from PrismarineJS...");
  const res = await fetch(ITEMS_URL);
  const items = await res.json() as any[];
  console.log(`Found ${items.length} items. Querying Official Minecraft Wiki for high-quality images...`);

  const manifest: any[] = [];
  const nameToItem = new Map<string, any>();
  for (const item of items) {
    nameToItem.set(item.displayName.toLowerCase(), item);
  }

  const missingItems: any[] = [];
  const chunkSize = 50;

  // Pass 1: pageimages
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const titles = chunk.map(item => item.displayName).join("|");
    const apiUrl = `https://minecraft.wiki/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(titles)}&format=json`;
    
    try {
      const wikiRes = await fetch(apiUrl);
      const wikiData = await wikiRes.json();
      const pages = wikiData.query?.pages;
      
      const foundInChunk = new Set<string>();

      if (pages) {
        for (const pageId in pages) {
          const page = pages[pageId];
          if (!page.title) continue;
          const item = nameToItem.get(page.title.toLowerCase());
          if (!item) continue;

          let imageName = page.pageimage;
          if (imageName) {
            foundInChunk.add(item.name);
            const imgUrl = `https://minecraft.wiki/images/${imageName}`;
            const dest = path.join(publicItemsDir, `${item.name}.png`);
            
            try {
              const imgRes = await fetch(imgUrl);
              if (imgRes.ok) {
                const buffer = await imgRes.arrayBuffer();
                fs.writeFileSync(dest, Buffer.from(buffer));
                manifest.push({ id: item.name, name: item.displayName, url: `/items/${item.name}.png` });
              }
            } catch (err) {}
          }
        }
      }
      
      for (const item of chunk) {
        if (!foundInChunk.has(item.name)) {
          missingItems.push(item);
        }
      }
    } catch (e) {
      console.error(`[ERROR] Failed to query wiki API for chunk`, e);
      missingItems.push(...chunk);
    }
    console.log(`Pass 1: Processed ${Math.min(i + chunkSize, items.length)} / ${items.length} items...`);
  }

  console.log(`\nPass 1 complete. Missing images for ${missingItems.length} items. Starting Pass 2 (Direct File Guesses)...`);

  // Pass 2: Direct file guesses via imageinfo
  const guessChunkSize = 6; // 6 items * ~8 guesses = 48 titles per query (limit is 50)
  for (let i = 0; i < missingItems.length; i += guessChunkSize) {
    const chunk = missingItems.slice(i, i + guessChunkSize);
    const allGuessedTitles: string[] = [];
    
    const titleToItem = new Map<string, any>();
    
    for (const item of chunk) {
      const baseName = item.displayName.replace(/ /g, "_");
      const guesses = [
        `File:${baseName}.png`,
        `File:${baseName}_(item).png`,
        `File:${baseName}_JE1.png`,
        `File:${baseName}_JE2.png`,
        `File:${baseName}_JE3.png`,
        `File:${baseName}_JE4.png`,
        `File:${baseName}_JE1_BE1.png`,
        `File:${baseName}_JE2_BE2.png`,
        `File:${baseName}_JE3_BE2.png`,
        `File:${baseName}_JE4_BE2.png`
      ];
      allGuessedTitles.push(...guesses);
      for (const g of guesses) {
        titleToItem.set(g.toLowerCase().replace(/ /g, "_"), item);
      }
    }

    for (let j = 0; j < allGuessedTitles.length; j += 50) {
      const titleChunk = allGuessedTitles.slice(j, j + 50).join("|");
      const apiUrl = `https://minecraft.wiki/api.php?action=query&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(titleChunk)}&format=json`;
      
      try {
        const wikiRes = await fetch(apiUrl);
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages;
        if (!pages) continue;

        for (const pageId in pages) {
          const page = pages[pageId];
          if (parseInt(pageId) < 0) continue; // missing file
          if (!page.title || !page.imageinfo || page.imageinfo.length === 0) continue;

          const normalizedTitle = page.title.toLowerCase().replace(/ /g, "_");
          const item = titleToItem.get(normalizedTitle);
          if (!item) continue;
          
          if (manifest.find(m => m.id === item.name)) continue;

          const imgUrl = page.imageinfo[0].url;
          const dest = path.join(publicItemsDir, `${item.name}.png`);

          try {
            const imgRes = await fetch(imgUrl);
            if (imgRes.ok) {
              const buffer = await imgRes.arrayBuffer();
              fs.writeFileSync(dest, Buffer.from(buffer));
              manifest.push({ id: item.name, name: item.displayName, url: `/items/${item.name}.png` });
            }
          } catch (err) {}
        }
      } catch (e) {
        console.error(`[ERROR] Pass 2 query failed`, e);
      }
    }
    
    await delay(100); // polite delay
    console.log(`Pass 2: Processed ${Math.min(i + guessChunkSize, missingItems.length)} / ${missingItems.length} missing items...`);
  }

  // Pass 3: misode mcmeta fallback
  const stillMissing = missingItems.filter(item => !manifest.find(m => m.id === item.name));
  console.log(`\nPass 2 complete. Missing images for ${stillMissing.length} items. Starting Pass 3 (misode mcmeta fallback)...`);
  
  for (let i = 0; i < stillMissing.length; i++) {
    const item = stillMissing[i];
    
    let url = `https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/textures/item/${item.name}.png`;
    let res = await fetch(url);
    if (!res.ok) {
      url = `https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/textures/block/${item.name}.png`;
      res = await fetch(url);
    }
    
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const dest = path.join(publicItemsDir, `${item.name}.png`);
      fs.writeFileSync(dest, Buffer.from(buffer));
      manifest.push({ id: item.name, name: item.displayName, url: `/items/${item.name}.png` });
    }
    
    if (i % 50 === 0) {
      console.log(`Pass 3: Processed ${i} / ${stillMissing.length} items...`);
    }
  }

  fs.writeFileSync(
    path.join(process.cwd(), "public", "mc-items.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nDone! Successfully downloaded ${manifest.length} / ${items.length} images.`);
}

main().catch(console.error);
