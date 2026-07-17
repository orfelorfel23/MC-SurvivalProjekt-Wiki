import { getAverageColor } from "fast-average-color-node";
import fs from "fs";
import path from "path";

async function main() {
  const iconPath = path.join(process.cwd(), "icon.png");
  const cssPath = path.join(process.cwd(), "src", "styles.css");

  try {
    const color = await getAverageColor(iconPath);
    console.log("Average color extracted:", color.hex);

    let css = fs.readFileSync(cssPath, "utf8");

    // Replace the primary variable in the CSS.
    // In styles.css we usually have --primary: H S L.
    // We need to convert HEX to HSL.
    const [r, g, b] = color.value;

    // Convert RGB to HSL
    let r1 = r / 255;
    let g1 = g / 255;
    let b1 = b / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r1:
          h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
          break;
        case g1:
          h = (b1 - r1) / d + 2;
          break;
        case b1:
          h = (r1 - g1) / d + 4;
          break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    const hslStr = `${h} ${s}% ${l}%`;
    console.log(`Calculated HSL: ${hslStr}`);

    // Let's manually replace the primary color in styles.css
    // Assuming we find --primary: ...
    css = css.replace(/--primary:\s*[^;]+;/g, `--primary: ${hslStr};`);
    css = css.replace(/--ring:\s*[^;]+;/g, `--ring: ${hslStr};`);

    fs.writeFileSync(cssPath, css);
    console.log("Updated styles.css with the new primary color.");
  } catch (e) {
    console.error("Failed to extract color:", e);
  }
}

main();
