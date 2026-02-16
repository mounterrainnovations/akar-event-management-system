import { generateTicketPDF } from "../lib/pdfs/ticket-generator";
import fs from "fs";

async function verify() {
  console.log("Verifying PDF Generation...");
  try {
    const buffer = await generateTicketPDF({
      eventName: "Test Event",
      userName: "Test User",
      bookingId: "test-booking-id",
      amount: "150.00",
      eventDate: "2023-01-01",
      location: "Hotel Grand Palace, Mumbai",
      bookingDate: "2023-10-15",
      tickets: [
        { name: "VIP Admission", type: "VIP", quantity: 1, price: 100 },
        { name: "Workshop Access", type: "Add-on", quantity: 2, price: 25 },
      ],
    });

    const outputPath = "example/final-test-ticket.pdf";
    fs.writeFileSync(outputPath, buffer);
    console.log(`SUCCESS: PDF generated and saved to ${outputPath}`);
    console.log("Size:", buffer.length);
  } catch (error: any) {
    console.error("FAILURE:", error.message);
    console.error(error);
    process.exit(1);
  }
}

verify();
