// Quick validation test script
// Run with: npx tsx scripts/test-validation.ts

import { validateEventName } from "../lib/events/service";

console.log("Testing Event Name Validation\n");

const testCases = [
  { input: "Annual Conference 2024", expected: true },
  { input: "Tech Meetup - AI & ML!", expected: true },
  { input: 'Workshop: "Innovation"', expected: true },
  { input: "Event (Part 1)", expected: true },
  { input: "Test Event 🎉", expected: false },
  { input: "Event@Home#2024", expected: false },
  { input: "Test™ Event®", expected: false },
  { input: "", expected: false },
  { input: "   ", expected: false },
];

testCases.forEach(({ input, expected }) => {
  try {
    const result = validateEventName(input);
    if (expected) {
      console.log(`✅ PASS: "${input}" → "${result}"`);
    } else {
      console.log(
        `❌ FAIL: "${input}" should have thrown error but got "${result}"`,
      );
    }
  } catch (error) {
    if (!expected) {
      console.log(`✅ PASS: "${input}" → Error: ${error.message}`);
    } else {
      console.log(
        `❌ FAIL: "${input}" should have passed but got error: ${error.message}`,
      );
    }
  }
});

console.log("\n\nTesting Phone Number Validation\n");

function normalizePhone(value: string): string {
  const phone = value.trim();
  if (!phone) {
    throw new Error("phone is required");
  }
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("phone must be exactly 10 digits");
  }
  return phone;
}

const phoneTestCases = [
  { input: "9876543210", expected: true },
  { input: "1234567890", expected: true },
  { input: "98765 43210", expected: false },
  { input: "9876-543-210", expected: false },
  { input: "+919876543210", expected: false },
  { input: "987654321", expected: false }, // 9 digits
  { input: "98765432101", expected: false }, // 11 digits
  { input: "abcd123456", expected: false },
  { input: "", expected: false },
];

phoneTestCases.forEach(({ input, expected }) => {
  try {
    const result = normalizePhone(input);
    if (expected) {
      console.log(`✅ PASS: "${input}" → "${result}"`);
    } else {
      console.log(
        `❌ FAIL: "${input}" should have thrown error but got "${result}"`,
      );
    }
  } catch (error) {
    if (!expected) {
      console.log(`✅ PASS: "${input}" → Error: ${error.message}`);
    } else {
      console.log(
        `❌ FAIL: "${input}" should have passed but got error: ${error.message}`,
      );
    }
  }
});
