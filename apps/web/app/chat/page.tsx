"use client";

import { useState } from "react";
import axios from "axios";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

 const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://flowbit-backend.onrender.com/api";

const handleAsk = async () => {
  if (!query.trim()) return;
  setLoading(true);
  setResponse(null);

  try {
    const res = await axios.post(`${apiBase}/chat-with-data`, { query });
    setResponse(res.data);
  } catch (error) {
    console.error("❌ Chat error:", error);
    setResponse({ error: "Something went wrong. Try again." });
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        💬 Chat with Data
      </h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          className="flex-1 border rounded-lg p-3 shadow-sm"
          placeholder="Type something like: show top vendors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Loading..." : "Ask"}
        </button>
      </div>

      {response?.message && (
        <h2 className="text-xl font-semibold mb-4">{response.message}</h2>
      )}

      {response?.data && response.data.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
          <table className="min-w-full border">
            <thead className="bg-gray-100 border-b">
              <tr>
                {Object.keys(response.data[0]).map((key) => (
                  <th key={key} className="p-2 text-left border">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {response.data.map((row: any, i: number) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {Object.values(row).map((val: any, j: number) => (
                    <td key={j} className="p-2 border">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {response?.error && (
        <div className="text-red-600 font-semibold mt-4">{response.error}</div>
      )}
    </main>
  );
}
