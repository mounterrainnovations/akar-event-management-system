const PDFDocument = require("pdfkit/js/pdfkit.standalone");
import QRCode from "qrcode";
import fs from "fs";

async function test() {
  console.log("Testing standalone PDF generation...");
  const doc = new PDFDocument({ size: "A4" });
  doc.pipe(fs.createWriteStream("test_standalone.pdf"));

  doc.text("Header");

  const qrData = "Test QR Data";

  // Method 1: Data URL String
  try {
    console.log("Testing doc.image(dataUrlString)...");
    const dataUrl = await QRCode.toDataURL(qrData);
    doc.text("Method 1: Data URL");
    doc.image(dataUrl, { width: 100 });
    console.log("Success: Data URL");
  } catch (e: any) {
    console.error("FAIL: Data URL", e.message);
  }

  doc.moveDown();

  // Method 2: Buffer
  try {
    console.log("Testing doc.image(buffer)...");
    const buffer = await QRCode.toBuffer(qrData);
    doc.text("Method 2: Buffer");
    doc.image(buffer, { width: 100 });
    console.log("Success: Buffer");
  } catch (e: any) {
    console.error("FAIL: Buffer", e.message);
  }

  doc.end();
  console.log("Done.");
}

test();
