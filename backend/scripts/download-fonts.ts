import fs from "fs";
import path from "path";

const fonts = [
  {
    name: "Roboto-Regular.ttf",
    url: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf",
  },
  {
    name: "Roboto-Bold.ttf",
    url: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf",
  },
];

const destDir = path.join(process.cwd(), "lib/fonts");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function downloadFont(font: { name: string; url: string }) {
  const destPath = path.join(destDir, font.name);

  console.log(`Downloading ${font.name}...`);

  try {
    const response = await fetch(font.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to download ${font.name}: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(destPath, buffer);
    console.log(`Downloaded ${font.name}`);
    checkHeader(destPath);
  } catch (error) {
    console.error(`ERROR downloading ${font.name}:`, error);
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    // Don't throw to allow other fonts to try
  }
}

function checkHeader(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);
  const hex = buffer.toString("hex").toUpperCase();
  console.log(`Header for ${path.basename(filePath)}: ${hex}`);
  if (hex === "00010000" || hex === "4F54544F") {
    console.log("VALID FONT FILE");
  } else {
    console.error("INVALID FONT FILE (Likely corrupt or HTML)");
    const content = fs.readFileSync(filePath, "utf8");
    console.log("Preview:", content.substring(0, 100));
  }
}

(async () => {
  for (const font of fonts) {
    await downloadFont(font);
  }
})();
