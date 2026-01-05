"use client";

import { useEffect, useState, useCallback } from "react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface CategoryBreakdown {
    category: {
        id: string;
        name: string;
        color: string;
        icon: string | null;
    };
    total: number;
    count: number;
}

interface Income {
    id: string;
    amount: number;
    type: "SALARY" | "REIMBURSEMENT" | "OTHER";
    date: string;
    note: string | null;
}

interface DashboardStats {
    currentTotal: number;
    previousTotal: number;
    percentageChange: number;
    categoryBreakdown: CategoryBreakdown[];
    dailyData: { day: number; amount: number }[];
    recentTransactions: {
        id: string;
        amount: number;
        date: string;
        note: string | null;
        category: {
            name: string;
            color: string;
            icon: string | null;
        };
    }[];
    totalIncome: number;
    balance: number;
    recentIncomes: Income[];
    month: number;
    year: number;
}

const INCOME_TYPES = [
    { value: "SALARY", label: "💰 Gaji", color: "#22c55e" },
    { value: "REIMBURSEMENT", label: "⛽ Reimburse Bensin", color: "#3b82f6" },
    { value: "OTHER", label: "📦 Lainnya", color: "#8b5cf6" },
];

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [incomeForm, setIncomeForm] = useState({
        amount: "",
        type: "SALARY",
        date: new Date().toISOString().split("T")[0],
        note: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const response = await fetch(`/api/stats?month=${month}&year=${year}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        });
    };

    const getMonthName = (date: Date) => {
        return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const handleIncomeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch("/api/incomes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(incomeForm),
            });
            if (response.ok) {
                setShowIncomeModal(false);
                setIncomeForm({
                    amount: "",
                    type: "SALARY",
                    date: new Date().toISOString().split("T")[0],
                    note: "",
                });
                fetchStats();
            }
        } catch (error) {
            console.error("Error adding income:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const getIncomeTypeLabel = (type: string) => {
        return INCOME_TYPES.find((t) => t.value === type)?.label || type;
    };

    const getIncomeTypeColor = (type: string) => {
        return INCOME_TYPES.find((t) => t.value === type)?.color || "#6366f1";
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header with Month Picker */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowIncomeModal(true)}
                    >
                        + Pemasukan
                    </button>
                    <div className="month-picker">
                        <button className="month-picker-btn" onClick={() => navigateMonth(-1)}>
                            ←
                        </button>
                        <span className="month-picker-display">{getMonthName(currentDate)}</span>
                        <button className="month-picker-btn" onClick={() => navigateMonth(1)}>
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* Balance Card - Full Width */}
            <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", marginBottom: 4 }}>
                            Saldo Bulan Ini
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fff" }}>
                            {formatCurrency(stats?.balance || 0)}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Pemasukan</div>
                            <div style={{ color: "#22c55e", fontWeight: 600 }}>
                                +{formatCurrency(stats?.totalIncome || 0)}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>Pengeluaran</div>
                            <div style={{ color: "#ef4444", fontWeight: 600 }}>
                                -{formatCurrency(stats?.currentTotal || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Pengeluaran</div>
                    <div className="stat-value">{formatCurrency(stats?.currentTotal || 0)}</div>
                    {stats && stats.previousTotal > 0 && (
                        <div className={`stat-change ${stats.percentageChange > 0 ? "positive" : "negative"}`}>
                            {stats.percentageChange > 0 ? "↑" : "↓"} {Math.abs(stats.percentageChange).toFixed(1)}%
                            dari bulan lalu
                        </div>
                    )}
                </div>

                <div className="stat-card">
                    <div className="stat-label">Rata-rata Harian</div>
                    <div className="stat-value">
                        {formatCurrency(
                            stats?.dailyData && stats.dailyData.length > 0
                                ? stats.currentTotal / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                                : 0
                        )}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Kategori Terbesar</div>
                    <div className="stat-value" style={{ fontSize: "1.25rem" }}>
                        {stats?.categoryBreakdown?.[0]?.category?.icon || "📦"}{" "}
                        {stats?.categoryBreakdown?.[0]?.category?.name || "-"}
                    </div>
                    <div style={{ color: "var(--muted)", marginTop: 4 }}>
                        {formatCurrency(stats?.categoryBreakdown?.[0]?.total || 0)}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Bar Chart - Daily Expenses */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Pengeluaran Harian</h2>
                    </div>
                    {stats?.dailyData && stats.dailyData.some((d) => d.amount > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" stroke="#737373" tick={{ fontSize: 12 }} />
                                <YAxis
                                    stroke="#737373"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: 8,
                                    }}
                                    formatter={(value) => [formatCurrency(value as number), "Pengeluaran"]}
                                    labelFormatter={(label) => `Tanggal ${label}`}
                                />
                                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <div className="empty-state-title">Belum ada data</div>
                            <p>Mulai catat pengeluaran Anda</p>
                        </div>
                    )}
                </div>

                {/* Pie Chart - Category Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Per Kategori</h2>
                    </div>
                    {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.categoryBreakdown as unknown as { [key: string]: unknown }[]}
                                    dataKey="total"
                                    nameKey="category.name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(props) => {
                                        const entry = stats.categoryBreakdown[props.index];
                                        return `${entry?.category?.icon || ""} ${((props.percent || 0) * 100).toFixed(0)}%`;
                                    }}
                                >
                                    {stats.categoryBreakdown.map((entry, index) => (
                                        <Cell key={index} fill={entry.category.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: 8,
                                    }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🥧</div>
                            <div className="empty-state-title">Belum ada data</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Incomes */}
            {stats?.recentIncomes && stats.recentIncomes.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h2 className="card-title">💰 Pemasukan Terbaru</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Tipe</th>
                                    <th>Catatan</th>
                                    <th style={{ textAlign: "right" }}>Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentIncomes.map((income) => (
                                    <tr key={income.id}>
                                        <td>{formatDate(income.date)}</td>
                                        <td>
                                            <span
                                                className="category-badge"
                                                style={{ backgroundColor: `${getIncomeTypeColor(income.type)}20` }}
                                            >
                                                {getIncomeTypeLabel(income.type)}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--muted)" }}>{income.note || "-"}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <span style={{ color: "#22c55e", fontWeight: 600 }}>
                                                +{formatCurrency(income.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Transaksi Terbaru</h2>
                </div>
                {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kategori</th>
                                    <th>Catatan</th>
                                    <th style={{ textAlign: "right" }}>Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTransactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td>{formatDate(transaction.date)}</td>
                                        <td>
                                            <span
                                                className="category-badge"
                                                style={{ backgroundColor: `${transaction.category.color}20` }}
                                            >
                                                {transaction.category.icon} {transaction.category.name}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--muted)" }}>{transaction.note || "-"}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <span className="amount">{formatCurrency(transaction.amount)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <div className="empty-state-title">Belum ada transaksi</div>
                        <p>Catat pengeluaran pertama Anda</p>
                    </div>
                )}
            </div>

            {/* Income Modal */}
            {showIncomeModal && (
                <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Tambah Pemasukan</h2>
                            <button className="modal-close" onClick={() => setShowIncomeModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleIncomeSubmit}>
                            <div className="form-group">
                                <label className="form-label">Tipe Pemasukan</label>
                                <select
                                    className="form-input"
                                    value={incomeForm.type}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, type: e.target.value })}
                                    required
                                >
                                    {INCOME_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Nominal</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Contoh: 5000000"
                                    value={incomeForm.amount}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tanggal</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={incomeForm.date}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Contoh: Gaji bulan Januari"
                                    value={incomeForm.note}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowIncomeModal(false)}
                                >
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <span className="spinner" style={{ width: 20, height: 20 }}></span> : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
