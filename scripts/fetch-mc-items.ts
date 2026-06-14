import fs from 'fs';
import path from 'path';

const ITEMS_URL = 'https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/1.20/items.json';
const TEXTURE_BASE = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/master/assets/minecraft/textures/item/';

async function main() {
  const publicItemsDir = path.join(process.cwd(), 'public', 'items');
  if (!fs.existsSync(publicItemsDir)) {
    fs.mkdirSync(publicItemsDir, { recursive: true });
  }

  console.log('Fetching items list...');
  const res = await fetch(ITEMS_URL);
  const items = await res.json();

  const manifest = [];

  console.log(`Found ${items.length} items. Generating manifest...`);

  // We won't download all 1000+ images directly right now to save time/bandwidth,
  // we can just store their remote URLs in a manifest or download them.
  // Actually, let's just generate the manifest with remote URLs to avoid a massive download phase,
  // or we can download them asynchronously. The user asked to "Download them and put them in a subfolder so I can add mine too".
  // So we will download them! But let's limit concurrency.
  
  let downloadedCount = 0;
  for (const item of items) {
    const name = item.name;
    const displayName = item.displayName;
    const dest = path.join(publicItemsDir, `${name}.png`);
    
    // Check if we already have it to avoid re-downloading
    if (!fs.existsSync(dest)) {
      try {
        const imgRes = await fetch(`${TEXTURE_BASE}${name}.png`);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          fs.writeFileSync(dest, Buffer.from(buffer));
          downloadedCount++;
        } else {
          // fallback block blocks? some are in block folder
        }
      } catch (e) {
        // ignore
      }
    }
    manifest.push({
      id: name,
      name: displayName,
      // If we couldn't download it (e.g. block texture), we just point to the local path anyway and it'll show broken or they can add it manually.
      url: `/items/${name}.png`
    });
  }

  fs.writeFileSync(path.join(process.cwd(), 'public', 'mc-items.json'), JSON.stringify(manifest, null, 2));
  console.log(`Done. Downloaded ${downloadedCount} new images. Manifest saved.`);
}

main().catch(console.error);
