import fs from "fs";
import path from "path";

const sourceDir = path.join(process.cwd(), "public", "minecraft-assets", "data", "1.20.2", "items");
const targetDir = path.join(process.cwd(), "public", "items");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  console.log(`Copying ${files.length} items to public/items...`);

  for (const file of files) {
    if (file.endsWith(".png")) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
    }
  }

  console.log("Done! You can now safely delete the public/minecraft-assets folder.");
} else {
  console.log("Source directory not found. Please ensure the git clone has completed.");
}
