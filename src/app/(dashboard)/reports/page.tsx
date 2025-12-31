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
    Legend,
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

interface ReportStats {
    currentTotal: number;
    previousTotal: number;
    percentageChange: number;
    categoryBreakdown: CategoryBreakdown[];
    dailyData: { day: number; amount: number }[];
}

export default function ReportsPage() {
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const response = await fetch(`/api/stats?month=${month}&year=${year}`);
            if (response.ok) {
                setStats(await response.json());
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
        }).format(amount);
    };

    const getMonthName = (date: Date) => {
        return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
    ).getDate();

    const avgDaily = stats ? stats.currentTotal / daysInMonth : 0;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Laporan Bulanan</h1>
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

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Pengeluaran</div>
                    <div className="stat-value">{formatCurrency(stats?.currentTotal || 0)}</div>
                    {stats && stats.previousTotal > 0 && (
                        <div
                            className={`stat-change ${stats.percentageChange > 0 ? "positive" : "negative"}`}
                        >
                            {stats.percentageChange > 0 ? "↑" : "↓"}{" "}
                            {Math.abs(stats.percentageChange).toFixed(1)}% dari bulan lalu
                        </div>
                    )}
                </div>

                <div className="stat-card">
                    <div className="stat-label">Rata-rata Harian</div>
                    <div className="stat-value">{formatCurrency(avgDaily)}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Jumlah Kategori Digunakan</div>
                    <div className="stat-value">{stats?.categoryBreakdown?.length || 0}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-row">
                {/* Daily Bar Chart */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Pengeluaran per Hari</h2>
                    </div>
                    {stats?.dailyData && stats.dailyData.some((d) => d.amount > 0) ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={stats.dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="day"
                                    stroke="#737373"
                                    tick={{ fontSize: 11 }}
                                    interval={1}
                                />
                                <YAxis
                                    stroke="#737373"
                                    tick={{ fontSize: 11 }}
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
                        </div>
                    )}
                </div>

                {/* Category Pie Chart */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Distribusi Kategori</h2>
                    </div>
                    {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={stats.categoryBreakdown as unknown as { [key: string]: unknown }[]}
                                    dataKey="total"
                                    nameKey="category.name"
                                    cx="50%"
                                    cy="45%"
                                    outerRadius={90}
                                    innerRadius={50}
                                    label={(props) => {
                                        const entry = stats.categoryBreakdown[props.index];
                                        return `${entry?.category?.icon || ""} ${((props.percent || 0) * 100).toFixed(0)}%`;
                                    }}
                                    labelLine={false}
                                >
                                    {stats.categoryBreakdown.map((entry, index) => (
                                        <Cell key={index} fill={entry.category.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    formatter={(value) => {
                                        const item = stats.categoryBreakdown.find(
                                            (c) => c.category.name === value
                                        );
                                        return `${item?.category.icon || ""} ${value}`;
                                    }}
                                />
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

            {/* Category Breakdown Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Detail per Kategori</h2>
                </div>
                {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Kategori</th>
                                    <th style={{ textAlign: "center" }}>Transaksi</th>
                                    <th style={{ textAlign: "right" }}>Total</th>
                                    <th style={{ textAlign: "right" }}>Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.categoryBreakdown.map((item, index) => {
                                    const percentage =
                                        stats.currentTotal > 0
                                            ? (item.total / stats.currentTotal) * 100
                                            : 0;
                                    return (
                                        <tr key={item.category.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <span
                                                    className="category-badge"
                                                    style={{ backgroundColor: `${item.category.color}20` }}
                                                >
                                                    {item.category.icon} {item.category.name}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>{item.count}x</td>
                                            <td style={{ textAlign: "right" }}>
                                                <span className="amount">{formatCurrency(item.total)}</span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "flex-end",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 60,
                                                            height: 6,
                                                            backgroundColor: "var(--card-border)",
                                                            borderRadius: 3,
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${percentage}%`,
                                                                height: "100%",
                                                                backgroundColor: item.category.color,
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ minWidth: 45 }}>{percentage.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">Belum ada data</div>
                        <p>Mulai catat pengeluaran untuk melihat laporan</p>
                    </div>
                )}
            </div>
        </div>
    );
}
