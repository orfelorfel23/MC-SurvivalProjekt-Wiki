import fs from "fs";
import path from "path";

const ITEMS_URL = "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/items.json";

async function main() {
  const publicItemsDir = path.join(process.cwd(), "public", "items");
  const oldIconsDir = path.join(process.cwd(), "public", "item-icons");

  // "Einmal komplett neu" - remove old directories
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
  
  // Create a map to look up items by their displayName lowercase
  const nameToItem = new Map<string, any>();
  for (const item of items) {
    nameToItem.set(item.displayName.toLowerCase(), item);
  }

  // We chunk the requests to 50 items per API call (MediaWiki API limit)
  const chunkSize = 50;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const titles = chunk.map(item => item.displayName).join("|");
    
    const apiUrl = `https://minecraft.wiki/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(titles)}&format=json`;
    
    try {
      const wikiRes = await fetch(apiUrl);
      const wikiData = await wikiRes.json();
      
      const pages = wikiData.query?.pages;
      if (!pages) continue;
      
      // Process each page returned by the API
      for (const pageId in pages) {
        const page = pages[pageId];
        if (!page.title) continue;
        
        const item = nameToItem.get(page.title.toLowerCase());
        if (!item) continue;
        
        let imageName = page.pageimage;
        if (!imageName) {
          console.warn(`[WARN] No pageimage found for ${page.title}`);
          continue;
        }

        // We download the exact file from the wiki
        const imgUrl = `https://minecraft.wiki/images/${imageName}`;
        const dest = path.join(publicItemsDir, `${item.name}.png`);
        
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            fs.writeFileSync(dest, Buffer.from(buffer));
            
            manifest.push({
              id: item.name,
              name: item.displayName,
              url: `/items/${item.name}.png`,
            });
          } else {
            console.warn(`[WARN] Failed to download image for ${item.displayName} from ${imgUrl}`);
          }
        } catch (downloadErr) {
          console.warn(`[WARN] Error downloading ${imgUrl}`);
        }
      }
    } catch (e) {
      console.error(`[ERROR] Failed to query wiki API for chunk`, e);
    }
    
    console.log(`Processed ${Math.min(i + chunkSize, items.length)} / ${items.length} items...`);
  }

  // Write manifest
  fs.writeFileSync(
    path.join(process.cwd(), "public", "mc-items.json"),
    JSON.stringify(manifest, null, 2),
  );
  
  console.log(`\nDone! Successfully downloaded ${manifest.length} high-quality images from the Official Wiki.`);
}

main().catch(console.error);
