import QRCode from "qrcode";
import { getLogger } from "../logger";
import fs from "fs";
import path from "path";

// CAPTURE READ FILE SYNC IMMEDIATELY
// This protects against any module overwriting (monkey-patching) that might happen later
const safeReadFileSync = fs.readFileSync;
const safeExistsSync = fs.existsSync;

// Use standalone version to avoid "ENOENT: Helvetica.afm" issues in Next.js
const PDFDocument = require("pdfkit/js/pdfkit.standalone");

const logger = getLogger("ticket-generator");

// Debug logs
console.log("Check 1 - Import fs type:", typeof fs);
console.log("Check 2 - fs.readFileSync type:", typeof fs.readFileSync);
console.log(
  "Check 3 - Captured safeReadFileSync type:",
  typeof safeReadFileSync,
);

export interface TicketItem {
  name: string;
  type: string;
  quantity: number;
  price: number;
}

export interface TicketDetails {
  eventName: string;
  userName: string;
  bookingId: string;
  amount: string; // Total amount paid
  eventDate?: string;
  location?: string;
  bookingDate?: string;
  tickets?: TicketItem[];
  eventTerms?: string;
}

export async function generateTicketPDF(
  details: TicketDetails,
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => {
        logger.error("PDF Stream Error", {
          message: err.message,
          stack: err.stack,
        });
        reject(err);
      });

      // --- Helper: Draw Horizontal Line ---
      const drawLine = (y: number) => {
        doc
          .moveTo(50, y)
          .lineTo(545, y)
          .strokeColor("#E0E0E0")
          .lineWidth(1)
          .stroke();
      };

      // --- 1. Header ---
      // Logo (Top Left - BIGGER as requested)
      try {
        const possiblePaths = [
          path.resolve(process.cwd(), "public", "logo.png"),
          path.resolve(process.cwd(), "backend", "public", "logo.png"),
          path.join(__dirname, "..", "..", "..", "public", "logo.png"),
          path.join(__dirname, "..", "..", "public", "logo.png"),
        ];

        let logoLoaded = false;
        console.log("Searching for logo in paths:", possiblePaths);

        for (const logoPath of possiblePaths) {
          if (safeExistsSync && safeExistsSync(logoPath)) {
            console.log("Found logo at:", logoPath);

            if (typeof safeReadFileSync === "function") {
              const imgBuffer = safeReadFileSync(logoPath);

              if (imgBuffer.length > 0) {
                try {
                  // CRITICAL FIX: Convert Buffer to Base64 Data URI
                  const base64Image = `data:image/png;base64,${imgBuffer.toString("base64")}`;

                  // BIG LOGO - Resized to width 150
                  doc.image(base64Image, 50, 30, { width: 150 });

                  console.log("Image command sent to PDFKit with Base64 data.");
                  logoLoaded = true;
                } catch (imageError) {
                  console.error("PDFKit image insertion failed:", imageError);
                }
              } else {
                console.error("Logo file is empty!");
              }
            } else {
              console.error(
                "CRITICAL: Captured readFileSync is not a function during execution:",
                typeof safeReadFileSync,
              );
            }
            break;
          }
        }

        if (!logoLoaded) {
          console.error(
            "CRITICAL: Logo file NOT found (or read failed) in any searched path.",
          );
        }
      } catch (e: any) {
        console.error("On-catch Error embedding logo:", e.message);
      }

      // Company Name (Shifted Down below big logo)
      // Logo is at y=30 with height ~40-50 depending on aspect ratio. Let's start text lower.
      // If logo width is 150, assume height is roughly 40-60.
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Akar Women Group", 50, 100);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#555555")
        .text("Empowering Women Together", 50, 125);

      // Ticket Label (Right - Top Aligned with company name area)
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("TICKET", 400, 50, { align: "right" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#555555")
        .text(`Booking ID: ${details.bookingId.toUpperCase()}`, 400, 80, {
          align: "right",
        });

      drawLine(150);

      // --- 2. Event Information ---
      const eventInfoY = 180;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#888888")
        .text("EVENT DETAILS", 50, eventInfoY);

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(details.eventName, 50, eventInfoY + 20);

      // Date & Location Columns
      const metaY = eventInfoY + 50;

      // Date
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#555555")
        .text("DATE & TIME", 50, metaY);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(details.eventDate || "To Be Announced", 50, metaY + 15);

      // Location
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#555555")
        .text("LOCATION", 200, metaY);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(details.location || "Check Event Page", 200, metaY + 15, {
          width: 150,
        });

      // Attendee
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#555555")
        .text("ATTENDEE", 400, metaY);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000")
        .text(details.userName, 400, metaY + 15);

      const bookingDateStr = details.bookingDate
        ? new Date(details.bookingDate).toLocaleDateString()
        : new Date().toLocaleDateString();

      doc.text(`Booking Date: ${bookingDateStr}`, 400, metaY + 30);

      drawLine(metaY + 60);

      // --- 3. Ticket Breakdown Table ---
      let tableY = metaY + 90;

      // Table Headers
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
      doc.text("ITEM / TICKET TYPE", 50, tableY);
      doc.text("QTY", 350, tableY, { width: 50, align: "center" });
      doc.text("PRICE", 420, tableY, { width: 50, align: "right" });
      doc.text("TOTAL", 490, tableY, { width: 50, align: "right" });

      drawLine(tableY + 15);
      tableY += 30;

      // Table Rows
      doc.font("Helvetica").fontSize(10);

      const tickets = details.tickets || [];

      if (tickets.length > 0) {
        tickets.forEach((ticket) => {
          const total = ticket.price * ticket.quantity;

          doc.text(ticket.name, 50, tableY);
          doc.text(ticket.quantity.toString(), 350, tableY, {
            width: 50,
            align: "center",
          });
          doc.text(Number(ticket.price).toFixed(2), 420, tableY, {
            width: 50,
            align: "right",
          });
          doc.text(total.toFixed(2), 490, tableY, {
            width: 50,
            align: "right",
          });

          tableY += 20;
        });
      } else {
        // Fallback row
        doc.text("Standard Admission", 50, tableY);
        doc.text("1", 350, tableY, { width: 50, align: "center" });
        doc.text("-", 420, tableY, { width: 50, align: "right" });
        doc.text(details.amount, 490, tableY, { width: 50, align: "right" });
        tableY += 20;
      }

      // Divider Line
      drawLine(tableY + 10);

      // Total
      const totalY = tableY + 30;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("TOTAL PAID", 300, totalY, { width: 180, align: "right" });
      doc
        .fontSize(14)
        .text(details.amount, 490, totalY - 2, { width: 50, align: "right" });

      // --- 4. QR Code & Footer ---
      const footerY = 600;

      try {
        const qrCodeData = JSON.stringify({
          id: details.bookingId,
          name: details.userName,
          event: details.eventName,
        });

        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
          width: 300,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
        });

        doc.image(qrCodeDataUrl, 50, footerY - 20, { width: 100, height: 100 });
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#000000")
          .text("Scan for entry", 50, footerY + 85, {
            width: 100,
            align: "center",
          });
      } catch (e) {
        doc.text("QR Error", 50, footerY);
      }

      // Terms & Conditions (Right side of QR)
      doc.fillColor("#555555");
      const termsX = 200;

      if (details.eventTerms) {
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("EVENT TERMS & CONDITIONS", termsX, footerY - 80);
        doc
          .fontSize(8)
          .font("Helvetica")
          .text(details.eventTerms, termsX, footerY - 60, {
            width: 345,
            lineGap: 2,
          });
      }

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("TICKET TERMS & CONDITIONS", termsX, footerY);
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "1. This ticket is proof of purchase for the event specified above.\n" +
            "2. Please present the QR code at the e-ticket check-in point.\n" +
            "3. Tickets are non-transferable and non-refundable unless the event is cancelled.\n" +
            "4. For any questions, please contact support@akarwomengroup.com.\n" +
            "5. Valid ID may be required for verification at the venue.",
          termsX,
          footerY + 20,
          { width: 345, lineGap: 3 },
        );

      // Bottom Branding
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .fillColor("#AAAAAA")
        .text("Generated by Akar Event Management System", 50, 750, {
          align: "center",
        });

      doc.end();
    } catch (error) {
      if (error instanceof Error) {
        logger.error("Failed to generate PDF ticket", {
          message: error.message,
          stack: error.stack,
        });
      }
      reject(error);
    }
  });
}
