import React, { useState, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure monaco to use local version to avoid CDN tracking prevention issues
loader.config({ monaco });
import {
    Play,
    Send,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Terminal,
    Clock,
    BookOpen
} from 'lucide-react';

const CodingIDE = ({ lessonId = 'py_loops_01', onBack }) => {
    const [lesson, setLesson] = useState(null);
    const [code, setCode] = useState('');
    const [output, setOutput] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [inputs, setInputs] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLesson();
    }, [lessonId]);

    const fetchLesson = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/coding/lessons/${lessonId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLesson(data);
            // Initialize code with a base template
            setCode(`def ${data.spec.function_name}(${data.spec.parameters.join(', ')}):\n    # Your code here\n    pass`);
        } catch (err) {
            setError("Failed to fetch lesson details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/coding/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lesson_id: lessonId,
                    code,
                    inputs: inputs.split('\n').filter(i => i.trim() !== '')
                })
            });
            const data = await res.json();
            setOutput(data);
        } catch (err) {
            setOutput({ status: 'error', message: "Communication error with autograder." });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsRunning(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/coding/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lesson_id: lessonId,
                    code,
                    inputs: inputs.split('\n').filter(i => i.trim() !== '')
                })
            });
            const data = await res.json();
            setOutput(data);
            if (data.status === 'success' && data.score >= 80) {
                // Potential progress update call here
            }
        } catch (err) {
            setOutput({ status: 'error', message: "Submission failed." });
        } finally {
            setIsRunning(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
            <Loader2 className="edu-spin" color="var(--edu-indigo)" size={48} />
        </div>
    );

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', height: '85vh', gap: '1rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '1rem 2rem', borderRadius: '1.5rem', border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A' }}>{lesson.title}</h2>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>
                            {lesson.language} • Unit {lesson.id.split('_').slice(-1)}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        style={{
                            padding: '0.75rem 1.25rem',
                            borderRadius: '0.75rem',
                            background: '#F8FAFC',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isRunning ? <Loader2 size={18} className="edu-spin" /> : <Play size={18} />}
                        Run Code
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isRunning}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        <Send size={18} />
                        Submit Solution
                    </button>
                </div>
            </header>

            {/* Three-Pane Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '25% 50% 25%', gap: '1px', flex: 1, background: '#F1F5F9', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>

                {/* 1. Notes Pane */}
                <aside style={{ background: '#FFFFFF', padding: '2rem', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                        <BookOpen size={16} /> Instructions
                    </div>
                    <div className="edu-textbook-content" style={{ fontSize: '0.925rem', lineHeight: '1.6', color: '#334155' }}>
                        {/* We use basic replacement for MD headers for now, or a proper parser if available */}
                        {lesson.notes.split('\n').map((line, i) => {
                            if (line.startsWith('## ')) return <h3 key={i} style={{ fontWeight: 900, marginTop: '1.5rem', color: '#0F172A' }}>{line.replace('## ', '')}</h3>;
                            if (line.startsWith('### ')) return <h4 key={i} style={{ fontWeight: 800, marginTop: '1rem', color: '#1E293B' }}>{line.replace('### ', '')}</h4>;
                            return <p key={i} style={{ marginBottom: '1rem' }}>{line}</p>;
                        })}
                    </div>
                </aside>

                {/* 2. Editor Pane */}
                <main style={{ background: '#1E1E1E', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '0.75rem 1.5rem', background: '#252526', color: '#94A3B8', fontSize: '0.75rem', fontWeight: '700', borderBottom: '1px solid #333' }}>
                        main.py
                    </div>
                    <Editor
                        height="100%"
                        defaultLanguage="python"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value)}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 }
                        }}
                    />
                </main>

                {/* 3. Output Pane */}
                <aside style={{ background: '#F8FAFC', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontWeight: '900', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <Terminal size={16} /> Output & Feedback
                    </div>

                    {/* Inputs Field */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' }}>Program Inputs (one per line)</label>
                        <textarea
                            value={inputs}
                            onChange={(e) => setInputs(e.target.value)}
                            placeholder="Enter inputs here..."
                            style={{
                                width: '100%',
                                height: '60px',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #E2E8F0',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace',
                                resize: 'none'
                            }}
                        />
                    </div>

                    {!output ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', textAlign: 'center' }}>
                            <Play size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '0.875rem' }}>Run your code to see outputs and test results.</p>
                        </div>
                    ) : (
                        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Status Card */}
                            <div style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: output.status === 'success' ? '#F0FDF4' : '#FEF2F2',
                                border: `1px solid ${output.status === 'success' ? '#BBF7D0' : '#FECACA'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                {output.status === 'success' ? (
                                    <CheckCircle2 color="#16A34A" size={24} />
                                ) : (
                                    <AlertCircle color="#DC2626" size={24} />
                                )}
                                <div>
                                    <div style={{ fontWeight: '800', color: output.status === 'success' ? '#16A34A' : '#991B1B', fontSize: '0.875rem' }}>
                                        {output.status.replace('_', ' ').toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: output.status === 'success' ? '#15803D' : '#B91C1C' }}>
                                        {output.message}
                                    </div>
                                </div>
                            </div>

                            {/* Score Card */}
                            <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>Mastery Points</span>
                                    <span style={{ fontSize: '1rem', fontWeight: '900', color: '#4F46E5' }}>{Math.round(output.score)}/100</span>
                                </div>
                                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                                    <div style={{
                                        width: `${output.score}%`,
                                        height: '100%',
                                        background: output.score >= 80 ? '#10B981' : '#4F46E5',
                                        borderRadius: '3px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>

                            {/* Test Results */}
                            {output.details?.results && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h5 style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Breakdown</h5>
                                    {output.details.results.map((res, i) => (
                                        <div key={i} style={{
                                            padding: '0.75rem',
                                            background: '#FFFFFF',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #E2E8F0',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: res.includes('Pass') ? '#16A34A' : '#64748B',
                                            fontWeight: '600'
                                        }}>
                                            {res.includes('Pass') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                            {res}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default CodingIDE;
