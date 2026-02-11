import React, { useState, useEffect } from 'react';
import {
    FileCheck,
    ShieldAlert,
    Clock,
    AlertCircle,
    Terminal,
    ArrowRight,
    Trophy,
    Activity,
    Loader2
} from 'lucide-react';

const FinalExamView = ({ courses, onStartExam, loading }) => {
    const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || null);
    const [exams, setExams] = useState([]);
    const [fetchingStatus, setFetchingStatus] = useState(false);

    const [status, setStatus] = useState({ completed: false, progress: 0, total: 0, passed: 0 });

    useEffect(() => {
        if (selectedCourse) {
            fetchStatus();
        }
    }, [selectedCourse]);

    const fetchStatus = async () => {
        setFetchingStatus(true); // Reuse loading state for status fetch
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/status/${selectedCourse}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (err) {
            console.error("Error fetching status", err);
        } finally {
            setFetchingStatus(false);
        }
    };


    const examRules = [
        "Once started, the exam cannot be paused or restarted.",
        "Musa AI Proctoring will be active during the entire session.",
        "External resources and web browsing are strictly prohibited.",
        "Ensure a stable internet connection before initializing."
    ];

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <header style={{
                background: 'var(--edu-indigo)',
                padding: '3rem',
                borderRadius: '3rem',
                color: '#FFFFFF',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <ShieldAlert color="#F59E0B" size={24} />
                        <span style={{ fontWeight: '900', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Formal Certification Arena</span>
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.5rem' }}>Final Examinations</h2>
                    <p style={{ opacity: 0.7, fontWeight: '500', maxWidth: '500px' }}>Validate your knowledge through high-stakes assessments verified by MSU Online Intelligence.</p>
                </div>
                <div style={{ background: 'var(--edu-indigo-light)', padding: '2rem', borderRadius: '2rem', borderColor: 'var(--edu-indigo)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Academic Integrity</p>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--edu-emerald)' }}>99.8%</div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Terminal size={20} color="#4F46E5" /> Candidate Instructions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {examRules.map((rule, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', background: '#FFFFFF', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #F1F5F9' }}>
                                <div style={{ width: '24px', height: '24px', background: 'var(--edu-indigo-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: '#4F46E5', flexShrink: 0 }}>{idx + 1}</div>
                                <p style={{ fontSize: '0.875rem', color: '#475569', fontWeight: '500', lineHeight: '1.5' }}>{rule}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={20} color="#EF4444" /> Initialization Panel
                    </h3>
                    <div className="edu-card" style={{ padding: '2rem', background: '#FFFFFF' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Core Assessment Scope</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {courses.map(course => (
                                    <button
                                        key={course.id}
                                        onClick={() => setSelectedCourse(course.id)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            textAlign: 'left',
                                            borderRadius: '1rem',
                                            border: '2px solid',
                                            borderColor: selectedCourse === course.id ? 'var(--edu-indigo)' : '#F1F5F9',
                                            background: selectedCourse === course.id ? '#F5F3FF' : '#FFFFFF',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontWeight: '700', color: selectedCourse === course.id ? '#312E81' : '#64748B' }}>{course.title}</span>
                                        {selectedCourse === course.id && <Clock size={16} color="#4F46E5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Readiness Check</label>

                            <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1.5rem', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '700', color: '#1E293B' }}>Course Exercises</span>
                                    <span style={{ fontWeight: '700', color: status.completed ? '#10B981' : '#F59E0B' }}>
                                        {status.passed} / {status.total} Completed
                                    </span>
                                </div>
                                <div style={{ height: '0.5rem', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ width: `${status.progress}%`, height: '100%', background: status.completed ? '#10B981' : '#F59E0B', transition: 'width 0.5s ease-out' }} />
                                </div>
                                {!status.completed && (
                                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <AlertCircle size={16} /> Complete all exercises to unlock the Final Exam.
                                    </p>
                                )}
                            </div>
                        </div>

                        {status.completed && (
                            <div style={{ padding: '1.5rem', background: '#FEF2F2', borderRadius: '1.5rem', border: '1px solid #FEE2E2', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', marginBottom: '0.5rem' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontWeight: '800', fontSize: '0.875rem' }}>Proctoring Required</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#B91C1C', fontWeight: '500' }}>Your webcam and screen share must be enabled to start this exam.</p>
                            </div>
                        )}

                        <button
                            onClick={() => onStartExam(selectedCourse)}
                            disabled={!status.completed || loading}
                            style={{
                                width: '100%',
                                padding: '1.5rem',
                                background: !status.completed ? '#94A3B8' : '#0F172A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '1.25rem',
                                fontWeight: '900',
                                fontSize: '1rem',
                                cursor: !status.completed || loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 15px 30px -10px rgba(15, 23, 42, 0.4)',
                                opacity: loading || fetchingStatus ? 0.7 : 1
                            }}
                        >
                            {loading ? <Loader2 className="edu-spin" /> : status.completed ? 'Initialize Final Exam' : 'Locked'}
                            {!loading && status.completed && <ArrowRight size={20} />}
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default FinalExamView;
