"use client";

import Link from "next/link";

export default function NavBar({ user, onLogout }) {
  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-lg font-semibold text-slate-900">CRM AI</span>
        <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
          Dashboard
        </Link>
        <Link href="/customers" className="text-sm text-slate-600 hover:text-slate-900">
          Customers
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-slate-500">
            {user.name} <span className="text-slate-400">({user.role})</span>
          </span>
        )}
        <button
          onClick={onLogout}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
