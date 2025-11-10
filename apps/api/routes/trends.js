import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/invoice-trends
router.get("/invoice-trends", async (req, res) => {
  try {
    // Fetch all invoices
    const invoices = await prisma.invoice.findMany({
      select: { invoiceDate: true, amount: true },
    });

    // Group data by month
    const monthlyData = {};

    invoices.forEach((inv) => {
      const date = new Date(inv.invoiceDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. "2025-11"

      if (!monthlyData[key]) {
        monthlyData[key] = { totalSpend: 0, invoiceCount: 0 };
      }

      monthlyData[key].totalSpend += inv.amount;
      monthlyData[key].invoiceCount += 1;
    });

    // Convert to array sorted by month
    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        totalSpend: data.totalSpend,
        invoiceCount: data.invoiceCount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json(result);
  } catch (err) {
    console.error("Error in /invoice-trends:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
