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
    month: number;
    year: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

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
        </div>
    );
}
