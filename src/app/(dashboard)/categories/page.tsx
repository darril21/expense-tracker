"use client";

import { useEffect, useState, useCallback } from "react";

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    _count: { expenses: number };
}

const COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e",
];

const ICONS = ["🍔", "🚗", "🛒", "📄", "🎬", "💊", "📦", "🏠", "✈️", "📱", "👕", "🎮", "📚", "💼", "🎁"];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        color: COLORS[0],
        icon: "📦",
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch("/api/categories");
            if (response.ok) {
                setCategories(await response.json());
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const openAddModal = () => {
        setEditingCategory(null);
        setFormData({ name: "", color: COLORS[0], icon: "📦" });
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            color: category.color,
            icon: category.icon || "📦",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : "/api/categories";
            const method = editingCategory ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowModal(false);
                fetchCategories();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            console.error("Error saving category:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus kategori ini?")) return;

        try {
            const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchCategories();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1 className="page-title">Kategori</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Tambah Kategori
                </button>
            </div>

            {categories.length > 0 ? (
                <div className="category-grid">
                    {categories.map((category) => (
                        <div key={category.id} className="category-card">
                            <div
                                className="category-icon"
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    backgroundColor: `${category.color}20`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                {category.icon || "📦"}
                            </div>
                            <div className="category-name">{category.name}</div>
                            <div className="category-count">
                                {category._count.expenses} transaksi
                            </div>
                            <div className="actions" style={{ marginTop: 12 }}>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => openEditModal(category)}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDelete(category.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-title">Belum ada kategori</div>
                        <p>Tambahkan kategori untuk mengelompokkan pengeluaran</p>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nama Kategori</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Makanan"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Icon</label>
                                <div className="color-picker-container">
                                    {ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`color-option ${formData.icon === icon ? "selected" : ""}`}
                                            style={{
                                                background: "var(--input-bg)",
                                                fontSize: "1.25rem",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            onClick={() => setFormData({ ...formData, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Warna</label>
                                <div className="color-picker-container">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            className={`color-option ${formData.color === color ? "selected" : ""}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                </div>
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
