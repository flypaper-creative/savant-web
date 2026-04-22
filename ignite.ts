import fs from 'fs';
import path from 'path';

const DUMP_FILE = 'savant_dump_real_site.txt';

async function rebuild() {
  if (!fs.existsSync(DUMP_FILE)) {
    console.error("FATAL: savant_dump_real_site.txt not found.");
    return;
  }

  const content = fs.readFileSync(DUMP_FILE, 'utf-8');
  const blocks = content.split(/^FILE: /m).slice(1);

  blocks.forEach(block => {
    const lines = block.split('\n');
    const filePath = lines[0].trim();
    const fileContent = lines.slice(2).join('\n').split(/^={10,}|^--{10,}/m)[0].trim();

    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, fileContent);
    console.log(`[RESTORED] -> ${filePath}`);
  });

  console.log("\n--- RECONSTRUCTION COMPLETE ---");
}

rebuild();
