import fs from "fs";
import path from "path";
import { generateTicketPDF } from "../lib/pdfs/ticket-generator";

async function run() {
  console.log("Starting PDF generation test...");

  // Scenario:
  // 2 tickets at 300 each = 600 Subtotal.
  // User paid 500.
  // Discount = 100.

  const mockDetails = {
    eventName: "Winter Wonderland Gala",
    userName: "Jane Doe",
    bookingId: "BK-TEST-DISCOUNT-001",
    amount: "500.00", // Total Paid
    eventDate: "December 25, 2024",
    location: "Grand Hall, City Center",
    bookingDate: new Date().toISOString(),
    tickets: [
      {
        name: "VIP Admission",
        type: "VIP",
        quantity: 2,
        price: 300,
      },
    ],
    eventTerms: "Tickets are non-refundable. Present ID at entrance.",
  };

  try {
    // Expected behavior:
    // Subtotal: 600.00
    // Discount: -100.00
    // Total Paid: 500.00

    const pdfBuffer = await generateTicketPDF(mockDetails);

    // Save to the root of the backend folder or desktop for easy access
    // Let's save to backend root for now
    const outputPath = path.resolve(__dirname, "../test-ticket-discount.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF generated successfully at: ${outputPath}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

run();
