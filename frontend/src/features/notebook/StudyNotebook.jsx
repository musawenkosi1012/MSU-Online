import React, { useState, useEffect } from 'react';
import { BookMarked, Save, FileDown, CheckCircle, Plus, ChevronRight, FileText, Trash2 } from 'lucide-react';

const StudyNotebook = ({ notes, setNotes, onSave }) => {
    const [saved, setSaved] = useState(false);
    const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);
    const [activeContent, setActiveContent] = useState('');
    const [activeTitle, setActiveTitle] = useState('');

    // Sync local state when notes array or selected index changes
    useEffect(() => {
        if (notes && notes.length > 0) {
            const note = notes[selectedNoteIndex] || notes[0];
            setActiveContent(note.content || '');
            setActiveTitle(note.title || 'Untitled Note');
        } else {
            setActiveContent('');
            setActiveTitle('New Notebook Entry');
        }
    }, [notes, selectedNoteIndex]);

    const handleSync = async () => {
        await onSave(activeContent, activeTitle);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddNote = () => {
        const newNote = { title: 'New Entry', content: '' };
        // We don't push to notes directly because it's a prop, we just set the local UI state to "empty" 
        // and it will save as a new entry when they click sync.
        setActiveTitle('New Entry');
        setActiveContent('');
        setSelectedNoteIndex(-1); // Special index for new unsaved note
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
        <div className="edu-animate-in" style={{ height: '75vh', background: '#FFFFFF', borderRadius: '2.5rem', border: '1px solid #F1F5F9', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>

            {/* Sidebar: Note Items */}
            <aside style={{ background: '#F8FAFC', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', background: '#FEF3C7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookMarked color="#D97706" size={18} />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '900' }}>Entries</h3>
                    </div>
                    <button
                        onClick={handleAddNote}
                        style={{ background: 'var(--edu-indigo)', color: '#FFF', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Plus size={16} />
                    </button>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notes.map((note, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedNoteIndex(idx)}
                            style={{
                                width: '100%', padding: '1rem', textAlign: 'left', borderRadius: '1rem',
                                border: '1px solid',
                                borderColor: selectedNoteIndex === idx ? 'var(--edu-indigo)' : 'transparent',
                                background: selectedNoteIndex === idx ? '#FFFFFF' : 'transparent',
                                color: selectedNoteIndex === idx ? 'var(--edu-indigo)' : '#64748B',
                                fontWeight: selectedNoteIndex === idx ? '800' : '600',
                                cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                                display: 'flex', alignItems: 'start', gap: '0.75rem',
                                boxShadow: selectedNoteIndex === idx ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
                            }}
                        >
                            <FileText size={16} style={{ marginTop: '0.2rem' }} />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title || 'Main Notebook'}</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '500' }}>{new Date(note.updated_at).toLocaleDateString()}</p>
                            </div>
                            {selectedNoteIndex === idx && <ChevronRight size={14} style={{ marginTop: '0.2rem' }} />}
                        </button>
                    ))}
                    {selectedNoteIndex === -1 && (
                        <div style={{
                            width: '100%', padding: '1rem', borderRadius: '1rem',
                            border: '1px solid var(--edu-indigo)',
                            background: '#FFFFFF',
                            color: 'var(--edu-indigo)',
                            fontWeight: '800',
                            display: 'flex', alignItems: 'start', gap: '0.75rem',
                        }}>
                            <Plus size={16} style={{ marginTop: '0.2rem' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.2rem' }}>{activeTitle}</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Unsaved</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content: Editor */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)' }}>
                    <div style={{ flex: 1, marginRight: '2rem' }}>
                        <input
                            type="text"
                            value={activeTitle}
                            onChange={(e) => setActiveTitle(e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.25rem', fontWeight: '900', color: '#1E293B', outline: 'none' }}
                            placeholder="Note Title..."
                        />
                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>MSU Persistence Active • Database Sync</p>
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
                            {saved ? 'Synced!' : 'Sync Entry'}
                        </button>
                    </div>
                </header>
                <textarea
                    value={activeContent}
                    onChange={(e) => setActiveContent(e.target.value)}
                    placeholder="Capture your insights from MSU here..."
                    style={{ flex: 1, padding: '2rem', border: 'none', outline: 'none', fontSize: '1.125rem', lineHeight: '1.8', color: '#1E293B', fontFamily: 'Inter, sans-serif', resize: 'none', background: '#FFFEFA' }}
                />
            </div>
        </div>
    );
};

export default StudyNotebook;
