"use client";

import { useEffect, useState, useCallback } from "react";

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string | null;
}

interface Expense {
    id: string;
    amount: number;
    date: string;
    note: string | null;
    category: Category;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formData, setFormData] = useState({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
        note: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            const [expensesRes, categoriesRes] = await Promise.all([
                fetch(`/api/expenses?month=${month}&year=${year}`),
                fetch("/api/categories"),
            ]);

            if (expensesRes.ok) setExpenses(await expensesRes.json());
            if (categoriesRes.ok) setCategories(await categoriesRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            weekday: "short",
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

    const openAddModal = () => {
        setEditingExpense(null);
        setFormData({
            amount: "",
            date: new Date().toISOString().split("T")[0],
            categoryId: categories[0]?.id || "",
            note: "",
        });
        setShowModal(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            amount: expense.amount.toString(),
            date: expense.date.split("T")[0],
            categoryId: expense.category.id,
            note: expense.note || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingExpense
                ? `/api/expenses/${editingExpense.id}`
                : "/api/expenses";
            const method = editingExpense ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Error saving expense:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus pengeluaran ini?")) return;

        try {
            const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
        }
    };

    const totalMonth = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
                <div>
                    <h1 className="page-title">Pengeluaran</h1>
                    <p style={{ color: "var(--muted)", marginTop: 4 }}>
                        Total: {formatCurrency(totalMonth)}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div className="month-picker">
                        <button className="month-picker-btn" onClick={() => navigateMonth(-1)}>
                            ←
                        </button>
                        <span className="month-picker-display">{getMonthName(currentDate)}</span>
                        <button className="month-picker-btn" onClick={() => navigateMonth(1)}>
                            →
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        + Tambah
                    </button>
                </div>
            </div>

            <div className="card">
                {expenses.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Kategori</th>
                                    <th>Catatan</th>
                                    <th style={{ textAlign: "right" }}>Nominal</th>
                                    <th style={{ textAlign: "center" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td>{formatDate(expense.date)}</td>
                                        <td>
                                            <span
                                                className="category-badge"
                                                style={{ backgroundColor: `${expense.category.color}20` }}
                                            >
                                                {expense.category.icon} {expense.category.name}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--muted)" }}>{expense.note || "-"}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <span className="amount">{formatCurrency(expense.amount)}</span>
                                        </td>
                                        <td>
                                            <div className="actions" style={{ justifyContent: "center" }}>
                                                <button
                                                    className="btn btn-icon btn-secondary"
                                                    onClick={() => openEditModal(expense)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-secondary"
                                                    onClick={() => handleDelete(expense.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">💸</div>
                        <div className="empty-state-title">Belum ada pengeluaran</div>
                        <p>Klik tombol Tambah untuk mencatat pengeluaran pertama</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingExpense ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="50000"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tanggal</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select
                                    className="form-select"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Catatan (opsional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Makan siang di kantor"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
