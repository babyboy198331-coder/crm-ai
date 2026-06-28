"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/useAuth";
import { api } from "../../lib/api";
import NavBar from "../../components/NavBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .analyticsOverview()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div>
      <NavBar user={user} onLogout={logout} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-900">Dashboard</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {stats && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Customers" value={stats.totalCustomers} />
              <StatCard label="Files" value={stats.totalFiles} />
              <StatCard label="Meeting summaries" value={stats.totalMeetingSummaries} />
              <StatCard label="Follow-up emails" value={stats.totalFollowUps} />
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium text-slate-700">Customers by status</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-medium text-slate-700">Recently added customers</h2>
              <ul className="divide-y divide-slate-100">
                {stats.recentCustomers.map((c) => (
                  <li key={c.id} className="py-2 text-sm text-slate-700">
                    {c.name} {c.company ? `— ${c.company}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
