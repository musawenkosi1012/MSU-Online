import React, { useState } from 'react';
import { BookMarked, Save, FileDown, CheckCircle } from 'lucide-react';

const StudyNotebook = ({ notes, setNotes, onSave }) => {
    const [saved, setSaved] = useState(false);

    const handleSync = async () => {
        await onSave();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/notes/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `My_Study_Notes.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export error", err);
            alert("Could not export PDF. Please sync your notes first.");
        }
    };

    return (
        <div className="edu-animate-in" style={{ height: '70vh', background: '#FFFFFF', borderRadius: '2.5rem', border: '1px solid #F1F5F9', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', background: '#FEF3C7', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookMarked color="#D97706" size={28} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '900' }}>Study Notebook</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>MSU Persistence Active</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleExport}
                        style={{ background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FileDown size={18} /> Export PDF
                    </button>
                    <button
                        onClick={handleSync}
                        style={{ background: saved ? '#10B981' : 'var(--edu-indigo)', color: '#FFFFFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease' }}
                    >
                        {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                        {saved ? 'Synced!' : 'Sync to Cloud'}
                    </button>
                </div>
            </header>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture your insights from MSU here..."
                style={{ flex: 1, padding: '2rem', border: 'none', outline: 'none', fontSize: '1.125rem', lineHeight: '1.8', color: '#1E293B', fontFamily: 'Inter, sans-serif', resize: 'none', background: '#FFFEFA' }}
            />
        </div>
    );
};

export default StudyNotebook;
