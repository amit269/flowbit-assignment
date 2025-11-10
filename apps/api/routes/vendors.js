import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vendors/top10
router.get("/vendors/top10", async (req, res) => {
  try {
    const results = await prisma.invoice.groupBy({
      by: ["vendorId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    });

    // For each vendorId, get vendor name
    const vendors = await Promise.all(
      results.map(async (record) => {
        const vendor = await prisma.vendor.findUnique({
          where: { id: record.vendorId },
        });
        return {
          vendor: vendor.name,
          totalSpend: record._sum.amount,
        };
      })
    );

    res.json(vendors);
  } catch (err) {
    console.error("Error in /vendors/top10:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
