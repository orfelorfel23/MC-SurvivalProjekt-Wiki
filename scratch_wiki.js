const items = ["Creeper Spawn Egg", "Oak Sign", "Fire Coral", "Red Terracotta", "Orange Shulker Box"];

async function check() {
  for (const item of items) {
    const titles = [
      `File:${item.replace(/ /g, "_")}.png`,
      `File:${item.replace(/ /g, "_")}_(item).png`,
      `File:${item.replace(/ /g, "_")}_JE1.png`,
      `File:${item.replace(/ /g, "_")}_JE2.png`,
      `File:${item.replace(/ /g, "_")}_JE3.png`,
      `File:${item.replace(/ /g, "_")}_JE1_BE1.png`,
      `File:${item.replace(/ /g, "_")}_JE2_BE2.png`
    ];

    const apiUrl = `https://minecraft.wiki/api.php?action=query&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(titles.join("|"))}&format=json`;
    
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    const pages = data.query?.pages;
    if (!pages) continue;

    let found = false;
    for (const pageId in pages) {
      if (parseInt(pageId) > 0 && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
        console.log(`Found for ${item}: ${pages[pageId].imageinfo[0].url}`);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`NOT FOUND: ${item}`);
    }
  }
}

check().catch(console.error);
