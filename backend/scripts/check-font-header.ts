import fs from "fs";
import path from "path";

const fonts = [
  "backend/lib/fonts/Roboto-Regular.ttf",
  "backend/lib/fonts/Roboto-Bold.ttf",
];

fonts.forEach((f) => {
  const p = path.resolve(process.cwd(), f);
  if (fs.existsSync(p)) {
    const fd = fs.openSync(p, "r");
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    console.log(`${f}: ${buffer.toString("hex").toUpperCase()}`);
  } else {
    console.log(`${f}: Not Found`);
  }
});
