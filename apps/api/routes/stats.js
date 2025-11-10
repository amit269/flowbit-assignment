import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/stats", async (req, res) => {
  try {
    const totalSpend = await prisma.invoice.aggregate({
      _sum: { amount: true },
    });

    const totalInvoices = await prisma.invoice.count();

    const avgInvoice = await prisma.invoice.aggregate({
      _avg: { amount: true },
    });

    const totalVendors = await prisma.vendor.count();

    res.json({
      totalSpend: totalSpend._sum.amount || 0,
      totalInvoices,
      totalVendors,
      avgInvoiceValue: avgInvoice._avg.amount || 0,
    });
  } catch (err) {
    console.error("Error in /stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
