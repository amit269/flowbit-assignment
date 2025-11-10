import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// ✅ Enable proper CORS (for frontend at port 3000)
app.use(cors({
  origin: [
  "http://localhost:3000",
  "https://flowbit-frontend.vercel.app"
],

  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// ✅ Root check
app.get("/", (req, res) => {
  res.send("✅ Flowbit Backend Server is Running!");
});

// ✅ Dashboard Stats
app.get("/api/stats", async (req, res) => {
  try {
    const totalSpend = await prisma.invoice.aggregate({
      _sum: { amount: true },
    });
    const totalInvoices = await prisma.invoice.count();
    const avgInvoice = await prisma.invoice.aggregate({
      _avg: { amount: true },
    });
    const documentsUploaded = 17; // Static for now

    res.json({
      totalSpend: totalSpend._sum.amount || 0,
      totalInvoices,
      avgInvoiceValue: avgInvoice._avg.amount || 0,
      documentsUploaded,
    });
  } catch (err) {
    console.error("Error in /stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Invoice Trends (optional)
app.get("/api/invoice-trends", async (req, res) => {
  try {
    const trends = await prisma.invoice.findMany({
      select: { date: true, amount: true },
    });

    const monthlyTotals = {};
    trends.forEach((t) => {
      const month = new Date(t.date).toLocaleString("default", { month: "short" });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
    });

    const formatted = Object.entries(monthlyTotals).map(([month, totalSpend]) => ({
      month,
      totalSpend,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error in /invoice-trends:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Top Vendors
app.get("/api/vendors/top10", async (req, res) => {
  try {
    const topVendors = await prisma.vendor.findMany({
      take: 10,
      include: {
        invoices: { select: { amount: true } },
      },
    });

    const result = topVendors.map((v) => ({
      vendor: v.name,
      totalSpend: v.invoices.reduce((sum, inv) => sum + inv.amount, 0),
    }));

    res.json(result.sort((a, b) => b.totalSpend - a.totalSpend));
  } catch (err) {
    console.error("Error in /vendors/top10:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Category Spend (fixed wrong field issue)
app.get("/api/category-spend", async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      select: { category: true, invoices: { select: { amount: true } } },
    });

    const data = vendors.map((v) => ({
      category: v.category || "Unknown",
      value: v.invoices.reduce((sum, inv) => sum + inv.amount, 0),
    }));

    res.json(data);
  } catch (err) {
    console.error("Error in /category-spend:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Cash Outflow Forecast
app.get("/api/cash-outflow", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      select: { dueDate: true, amount: true },
    });

    const now = new Date();
    const buckets = { "0–7 days": 0, "8–30 days": 0, "31–60 days": 0, "60+ days": 0 };

    invoices.forEach((inv) => {
      const diffDays = Math.floor((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) buckets["0–7 days"] += inv.amount;
      else if (diffDays <= 30) buckets["8–30 days"] += inv.amount;
      else if (diffDays <= 60) buckets["31–60 days"] += inv.amount;
      else buckets["60+ days"] += inv.amount;
    });

    res.json(Object.entries(buckets).map(([range, amount]) => ({ range, amount })));
  } catch (err) {
    console.error("Error in /cash-outflow:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Invoices Table
app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { vendor: true },
      orderBy: { id: "desc" },
    });

    res.json(
      invoices.map((inv) => ({
        vendor: inv.vendor?.name || "Unknown Vendor",
        date: inv.date,
        invoiceNo: inv.invoiceNo,
        amount: inv.amount,
        status: inv.status,
      }))
    );
  } catch (err) {
    console.error("Error in /invoices:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Chat with Data (AI-like route)
app.post("/api/chat-with-data", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const q = query.toLowerCase();
    let data = [];
    let message = "";

    if (q.includes("vendor")) {
      data = await prisma.invoice.groupBy({
        by: ["vendorId"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      });

      const vendors = await prisma.vendor.findMany();
      data = data.map((v) => ({
        vendor: vendors.find((x) => x.id === v.vendorId)?.name || "Unknown",
        total_spend: v._sum.amount,
      }));
      message = "Top 10 Vendors by Spend";
    } else if (q.includes("invoice")) {
      data = await prisma.invoice.findMany({
        take: 10,
        include: { vendor: true },
      });
      message = "Recent Invoices";
    } else {
      message = "Try: show top vendors, show invoices, total spend etc.";
    }

    res.json({ query, message, data });
  } catch (err) {
    console.error("❌ Error in chat-with-data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start server
// ✅ Start server (Render-compatible)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
