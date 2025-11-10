import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function main() {
  console.log("🌐 Fetching data from Google Drive...");

  // your direct link to the JSON file
  const url = "https://drive.google.com/uc?export=download&id=1Difok6XwsMDUP-Xd_tF2dHHQYHSVuy40";

  const response = await fetch(url);
  const data = await response.json();

  console.log(`📦 Loaded ${data.length} records.`);

  for (const item of data) {
    try {
      const llmData = item?.extractedData?.llmData;
      if (!llmData) continue;

      // Vendor details
      const vendorName = llmData?.vendor?.value?.vendorName?.value || "Unknown Vendor";
      const vendorAddress = llmData?.vendor?.value?.vendorAddress?.value || "";
      const vendorTaxId = llmData?.vendor?.value?.vendorTaxId?.value || "";

      if (vendorName === "Unknown Vendor") {
        console.log(`⚠️ Skipping record with missing vendor in: ${item.name}`);
        continue;
      }

      // Add vendor to DB (if not exists)
      const vendor = await prisma.vendor.upsert({
        where: { name: vendorName },
        update: {},
        create: {
          name: vendorName,
          category: vendorAddress || "General",
        },
      });

      // Invoice details
      const invoiceValue = llmData?.invoice?.value || {};
      const invoiceId = invoiceValue?.invoiceId?.value || "N/A";
      const invoiceDate = invoiceValue?.invoiceDate?.value || new Date().toISOString();

      const summary = llmData?.summary?.value || {};
      const total = summary?.invoiceTotal?.value || 0;
      const tax = summary?.totalTax?.value || 0;
      const subtotal = summary?.subTotal?.value || 0;

      // Save invoice
      await prisma.invoice.create({
        data: {
          invoiceNo: invoiceId,
          invoiceDate: new Date(invoiceDate),
          amount: total,
          status: "Processed",
          vendorId: vendor.id,
        },
      });

      console.log(`✅ Added invoice ${invoiceId} for vendor ${vendorName}`);
    } catch (err) {
      console.log(`❌ Error processing record ${item.name}:`, err.message);
    }
  }

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
