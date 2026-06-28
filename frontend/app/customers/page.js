"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../lib/useAuth";
import { api } from "../../lib/api";
import NavBar from "../../components/NavBar";

export default function CustomersPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", status: "lead" });

  function refresh() {
    api.listCustomers().then(setCustomers).catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createCustomer(form);
      setForm({ name: "", company: "", email: "", phone: "", status: "lead" });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div>
      <NavBar user={user} onLogout={logout} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? "Cancel" : "+ New customer"}
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <input
              placeholder="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="churned">Churned</option>
            </select>
            <button
              type="submit"
              className="col-span-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create
            </button>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${c.id}`} className="font-medium text-slate-900 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.company || "-"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{c.owner?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
