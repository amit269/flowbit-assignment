import express from "express";

const router = express.Router();

// Mock Chat with Data endpoint
router.post("/chat-with-data", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // Fake “AI” response for demo
    const mockResponses = {
      "top vendors": {
        sql: "SELECT vendor, SUM(amount) as totalSpend FROM invoices GROUP BY vendor ORDER BY totalSpend DESC LIMIT 5;",
        result: [
          { vendor: "CPB SOFTWARE (GERMANY) GMBH", totalSpend: 123100.4 },
          { vendor: "Musterfirma Müller", totalSpend: 78000.0 },
          { vendor: "EasyFirma GmbH & Co KG", totalSpend: 45200.0 }
        ]
      },
      "total spend": {
        sql: "SELECT SUM(amount) AS totalSpend FROM invoices;",
        result: [{ totalSpend: 245000.67 }]
      },
      "overdue": {
        sql: "SELECT * FROM invoices WHERE status = 'Overdue';",
        result: []
      }
    };

    // Find mock response or fallback
    const response = Object.entries(mockResponses).find(([key]) =>
      query.toLowerCase().includes(key)
    );

    res.json(
      response
        ? response[1]
        : {
            sql: "SELECT * FROM invoices LIMIT 5;",
            result: [{ note: "Mock data only — AI not connected" }]
          }
    );
  } catch (err) {
    console.error("Error in /chat-with-data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
