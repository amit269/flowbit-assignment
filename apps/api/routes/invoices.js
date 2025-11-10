import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/invoices
// Supports ?search=<text>&sort=<field>&order=asc|desc
router.get("/invoices", async (req, res) => {
  try {
    const { search, sort = "invoiceDate", order = "desc" } = req.query;

    // Build Prisma query
    const where = search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: "insensitive" } },
            { status: { contains: search, mode: "insensitive" } },
            {
              vendor: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: { select: { name: true } },
      },
      orderBy: {
        [sort]: order,
      },
      take: 100, // limit results for speed
    });

    // Format data for frontend
    const formatted = invoices.map((inv) => ({
      vendor: inv.vendor?.name,
      date: inv.invoiceDate,
      invoiceNo: inv.invoiceNo,
      amount: inv.amount,
      status: inv.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error in /invoices:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
