"use client";

import { useEffect, useState, useCallback } from "react";

export default function SettingsPage() {
    const [billingCycleStart, setBillingCycleStart] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            const response = await fetch("/api/settings");
            if (response.ok) {
                const data = await response.json();
                setBillingCycleStart(data.billingCycleStart);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ billingCycleStart }),
            });
            if (response.ok) {
                setMessage({ type: "success", text: "Pengaturan berhasil disimpan!" });
            } else {
                setMessage({ type: "error", text: "Gagal menyimpan pengaturan" });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: "error", text: "Terjadi kesalahan" });
        } finally {
            setSaving(false);
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
                <h1 className="page-title">⚙️ Pengaturan</h1>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Periode Keuangan</h2>
                </div>

                <div className="form-group">
                    <label className="form-label">Tanggal Awal Bulan (Gajian)</label>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: 12 }}>
                        Pilih tanggal kapan Anda biasanya menerima gaji. Sistem akan menghitung periode
                        keuangan dari tanggal ini sampai sehari sebelumnya di bulan berikutnya.
                    </p>
                    <select
                        className="form-input"
                        value={billingCycleStart}
                        onChange={(e) => setBillingCycleStart(parseInt(e.target.value))}
                        style={{ maxWidth: 200 }}
                    >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day}>
                                Tanggal {day}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{
                    background: "var(--input-bg)",
                    padding: 16,
                    borderRadius: 12,
                    marginTop: 16,
                    marginBottom: 20
                }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: 8 }}>
                        Contoh Periode:
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                        Jika Anda pilih <strong>Tanggal {billingCycleStart}</strong>, maka:
                        <br />
                        <span style={{ color: "var(--primary)" }}>
                            "Januari 2026" = {billingCycleStart} Des 2025 - {billingCycleStart - 1 || 31} Jan 2026
                        </span>
                    </div>
                </div>

                {message && (
                    <div style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 16,
                        background: message.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: message.type === "success" ? "#22c55e" : "#ef4444",
                    }}>
                        {message.text}
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Menyimpan..." : "💾 Simpan Pengaturan"}
                </button>
            </div>
        </div>
    );
}
