import { generateTicketPDF } from "../lib/pdfs/ticket-generator";
import fs from "fs";

async function main() {
  console.log("=== PDF DIAGNOSTICS ===");

  console.log("\nAttempting PDF Generation (Standalone)...");
  try {
    const pdfBuffer = await generateTicketPDF({
      eventName: "Verification Event",
      userName: "Verification User",
      bookingId: "verify-123",
      amount: "150",
      eventDate: "2024-12-31",
      location: "Virtual Space",
    });
    console.log("SUCCESS: PDF Generated. Size:", pdfBuffer.length);
    fs.writeFileSync("verification_ticket.pdf", pdfBuffer);
    console.log("Saved to verification_ticket.pdf");
  } catch (error: any) {
    console.error("FAILURE: PDF Generation failed.");
    console.error("Error Message:", error.message);
    if (error.stack) console.error("Stack:", error.stack);
  }
}

main();
