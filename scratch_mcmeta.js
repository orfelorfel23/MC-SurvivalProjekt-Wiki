const fs = require('fs');

async function testMcmeta() {
  const items = ["creeper_spawn_egg", "oak_sign", "fire_coral", "red_terracotta", "orange_shulker_box", "oak_planks"];

  for (const name of items) {
    let url = `https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/textures/item/${name}.png`;
    let res = await fetch(url);
    if (res.ok) {
      console.log(`FOUND ITEM: ${name}`);
      continue;
    }

    url = `https://raw.githubusercontent.com/misode/mcmeta/assets/assets/minecraft/textures/block/${name}.png`;
    res = await fetch(url);
    if (res.ok) {
      console.log(`FOUND BLOCK: ${name}`);
      continue;
    }
    
    console.log(`NOT FOUND: ${name}`);
  }
}

testMcmeta().catch(console.error);
