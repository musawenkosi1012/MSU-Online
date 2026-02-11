import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    PlayCircle,
    CheckCircle2,
    Clock,
    BarChart,
    Search,
    ChevronRight,
    Star,
    Loader2
} from 'lucide-react';

const ExerciseHub = ({ courses, onStartAssessment, aiLoading }) => {
    const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedCourse) {
            fetchExercises();
        }
    }, [selectedCourse]);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/topics/${selectedCourse}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const topics = data.topics || data || [];
            const mapped = topics.map(t => ({
                id: t.id,
                title: t.title,
                type: t.type === 'mcq' ? 'Quiz' : 'Practical',
                duration: t.type === 'mcq' ? '10 min' : '30 min',
                difficulty: t.type === 'mcq' ? 'Medium' : 'Hard',
                status: 'not-started'
            }));
            setExercises(mapped);
        } catch (err) {
            console.error("Error fetching exercises", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '2rem', borderRadius: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>Exercise Hub</h2>
                    <p style={{ color: '#64748B', fontWeight: '500' }}>Master your skills through interactive practice and simulations.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ background: '#F5F3FF', padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid #EDE9FE', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Star color="#F59E0B" fill="#F59E0B" size={20} />
                        <span style={{ fontWeight: '800', color: '#312E81' }}>Current Streak: 5 Days</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '2.5rem' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="edu-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart size={18} color="var(--edu-indigo)" /> Filter by Course
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {courses.map(course => (
                                <button
                                    key={course.id}
                                    onClick={() => setSelectedCourse(course.id)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        textAlign: 'left',
                                        borderRadius: '0.75rem',
                                        border: '1px solid',
                                        borderColor: selectedCourse === course.id ? 'var(--edu-indigo)' : 'transparent',
                                        background: selectedCourse === course.id ? '#F5F3FF' : 'transparent',
                                        color: selectedCourse === course.id ? 'var(--edu-indigo)' : '#64748B',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {course.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="edu-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF' }}>
                        <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Daily Challenge</h4>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1.25rem' }}>Complete any Hard exercise today to earn bonus Mastery points.</p>
                        <button style={{ width: '100%', padding: '0.75rem', background: '#FFFFFF', color: '#059669', border: 'none', borderRadius: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>Start Challenge</button>
                    </div>
                </aside>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
                        <input
                            type="text"
                            placeholder="Find specific exercises..."
                            style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '1.25rem', border: '1px solid #E2E8F0', background: '#FFFFFF', outline: 'none', fontWeight: '500' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                                <Loader2 className="edu-spin" color="#4F46E5" size={40} />
                            </div>
                        ) : exercises.length > 0 ? (
                            exercises.map(ex => (
                                <div key={ex.id} className="edu-card edu-card-interactive edu-rotate-in edu-shimmer" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ background: ex.difficulty === 'Easy' ? '#ECFDF5' : ex.difficulty === 'Medium' ? '#FFFBEB' : '#FEF2F2', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', color: ex.difficulty === 'Easy' ? '#10B981' : ex.difficulty === 'Medium' ? '#D97706' : '#EF4444', textTransform: 'uppercase' }}>
                                            {ex.difficulty}
                                        </div>
                                        {ex.status === 'completed' && <CheckCircle2 color="#10B981" size={20} />}
                                    </div>
                                    <div>
                                        <h4 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem' }}>{ex.title}</h4>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>{ex.type}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={14} /> {ex.duration}
                                        </div>
                                        {ex.score && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4F46E5' }}>
                                                <Star size={14} fill="#4F46E5" /> {ex.score}%
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onStartAssessment(ex.id)}
                                        disabled={aiLoading}
                                        style={{
                                            marginTop: 'auto',
                                            width: '100%',
                                            padding: '0.875rem',
                                            background: ex.status === 'completed' ? '#F8FAFC' : '#4F46E5',
                                            color: ex.status === 'completed' ? '#64748B' : '#FFFFFF',
                                            border: ex.status === 'completed' ? '1px solid #E2E8F0' : 'none',
                                            borderRadius: '0.75rem',
                                            fontWeight: '800',
                                            cursor: aiLoading ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            opacity: aiLoading ? 0.7 : 1
                                        }}>
                                        {aiLoading ? 'Generating...' : ex.status === 'completed' ? 'Retake Practice' : 'Start Exercise'}
                                        {!aiLoading && <ChevronRight size={18} />}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: '#FFFFFF', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}>
                                <p style={{ color: '#94A3B8', fontWeight: '600' }}>No exercises available for this course yet. Musa is preparing some for you!</p>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default ExerciseHub;
