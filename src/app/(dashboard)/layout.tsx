"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (!mounted || status === "loading") {
        return (
            <div className="loading-container" style={{ minHeight: "100vh" }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const navItems = [
        { href: "/", icon: "📊", label: "Dashboard" },
        { href: "/expenses", icon: "💸", label: "Pengeluaran" },
        { href: "/categories", icon: "📁", label: "Kategori" },
        { href: "/reports", icon: "📈", label: "Laporan" },
        { href: "/settings", icon: "⚙️", label: "Pengaturan" },
    ];

    return (
        <div className="dashboard-layout">
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">💰 ExpenseTracker</div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-link ${pathname === item.href ? "active" : ""}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div style={{ marginTop: "auto", paddingTop: 20 }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: 12 }}>
                        {session.user?.name || session.user?.email}
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ width: "100%" }}
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">{children}</main>

            {/* Mobile Navigation */}
            <nav className="mobile-nav">
                <div className="mobile-nav-inner">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`mobile-nav-link ${pathname === item.href ? "active" : ""}`}
                        >
                            <span className="mobile-nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
