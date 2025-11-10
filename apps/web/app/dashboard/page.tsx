"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://flowbit-backend.onrender.com/api";
export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [trends, setTrends] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          statsRes,
          trendsRes,
          vendorsRes,
          catRes,
          cashRes,
          invRes
        ] = await Promise.all([
          axios.get(`${apiBase}/stats`),
          axios.get(`${apiBase}/invoice-trends`),
          axios.get(`${apiBase}/vendors/top10`),
          axios.get(`${apiBase}/category-spend`),
          axios.get(`${apiBase}/cash-outflow`),
          axios.get(`${apiBase}/invoices`)
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data);
        setVendors(vendorsRes.data);
        setCategories(catRes.data);
        setCashflow(cashRes.data);
        setInvoices(invRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchAll();
  }, []);

  const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea"];

  return (
    <main className="p-8 bg-[#f9fafb] min-h-screen space-y-8 font-sans">
     <h1 className="text-3xl font-extrabold flex items-center gap-2">
  <span>📊</span> Dashboard
</h1>
<p className="text-gray-500 mb-6">Analytics overview of invoices, vendors, and spending.</p>

      {/* ---- Overview Cards ---- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Spend (YTD)" value={`₹${(stats.totalSpend || 0).toLocaleString()}`} />
        <Card title="Total Invoices Processed" value={stats.totalInvoices || 0} />
        <Card title="Documents Uploaded" value={stats.documentsUploaded || 17} />
        <Card title="Average Invoice Value" value={`₹${Math.round(stats.avgInvoiceValue || 0)}`} />
      </section>

      {/* ---- Charts Section ---- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Invoice Volume + Value Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalSpend" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spend by Vendor (Top 10)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendors}>
              <XAxis dataKey="vendor" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalSpend" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ---- Category + Cashflow ---- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Spend by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="category" label>
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cash Outflow Forecast">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashflow}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ---- Invoices Table ---- */}
      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold text-lg mb-3">Invoices Table</h2>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left border">Vendor</th>
                <th className="p-2 text-left border">Date</th>
                <th className="p-2 text-left border">Invoice #</th>
                <th className="p-2 text-left border">Amount</th>
                <th className="p-2 text-left border">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2 border">{inv.vendor || inv.vendorName}</td>
                    <td className="p-2 border">{inv.date || "—"}</td>
                    <td className="p-2 border">{inv.invoiceNo}</td>
                    <td className="p-2 border">₹{inv.amount}</td>
                    <td className="p-2 border">{inv.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-400">
                    No Invoices Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 bg-white shadow rounded-lg hover:shadow-md transition">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="font-medium mb-2 text-gray-700">{title}</h2>
      {children}
    </div>
  );
}
