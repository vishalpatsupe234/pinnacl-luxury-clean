import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

(async () => {
  try {
    const dir = path.join(__dirname, "..", "public", "properties");
    if (!fs.existsSync(dir)) {
      console.error("Directory not found:", dir);
      process.exit(1);
    }

    const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f));
    for (const f of files) {
      try {
        const p = path.join(dir, f);
        const out = path.join(dir, path.parse(f).name + ".webp");
        await sharp(p).resize({ width: 1600 }).webp({ quality: 80 }).toFile(out);
        console.log("wrote", out);
      } catch (e) {
        console.error("failed", f, e.message);
      }
    }
    console.log("done");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
