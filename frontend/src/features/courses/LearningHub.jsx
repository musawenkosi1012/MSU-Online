import React, { useState, useEffect } from 'react';
import {
    FlaskConical,
    FileText,
    Play,
    Link as LinkIcon,
    Book,
    Download,
    Search,
    Video,
    Hash,
    Loader2,
    ChevronDown,
    ChevronUp,
    Target,
    Zap,
    Terminal
} from 'lucide-react';
import TopicTile from './TopicTile';

const LearningHub = ({ courses, onOpenTextbook, onOpenCodingLab }) => {
    const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    const [topicsMap, setTopicsMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [courseMastery, setCourseMastery] = useState(null);
    const authToken = localStorage.getItem('token');

    useEffect(() => {
        if (selectedCourse) {
            fetchCourseOutline();
            fetchCourseMastery();
        }
    }, [selectedCourse]);

    const fetchCourseOutline = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/courses/${selectedCourse}/outline`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setModules(data.modules || []);
        } catch (err) {
            console.error("Error fetching outline", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseMastery = async () => {
        if (!authToken) return;
        try {
            // Corrected endpoint from /api/courses/ to /api/progress/course/
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/course/${selectedCourse}/mastery`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCourseMastery(data);
            }
        } catch (err) {
            console.error("Error fetching mastery", err);
        }
    };

    const toggleModule = async (moduleId) => {
        // Toggle expansion state
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));

        // Fetch topics if not already loaded
        if (!topicsMap[moduleId]) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/modules/${moduleId}/topics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setTopicsMap(prev => ({
                    ...prev,
                    [moduleId]: data.tiles || []
                }));
            } catch (err) {
                console.error("Error fetching topics", err);
            }
        }
    };

    const handleExerciseStart = (topicId) => {
        console.log("Starting exercise for topic:", topicId);
        // Navigate to exercise view or open modal
    };

    const masteryPercent = courseMastery ? Math.round(courseMastery.aggregate_mastery * 100) : 0;
    const examUnlocked = courseMastery?.exam_unlocked || false;

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', background: '#FFFFFF', padding: '2rem', borderRadius: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>Learning Hub</h2>
                    <p style={{ color: '#64748B', fontWeight: '500' }}>Master topics, unlock exercises, track your progress.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Mastery Badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.25rem',
                        background: examUnlocked ? '#F0FDF4' : '#FEF3C7',
                        borderRadius: '1rem',
                        border: `1px solid ${examUnlocked ? '#BBF7D0' : '#FDE68A'}`
                    }}>
                        <Target size={20} color={examUnlocked ? '#10B981' : '#F59E0B'} />
                        <div>
                            <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Course Mastery</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: '900', color: examUnlocked ? '#10B981' : '#F59E0B' }}>{masteryPercent}%</div>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenCodingLab()}
                        style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '1rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        <Terminal size={18} /> Integrated Coding Lab
                    </button>
                    <button
                        onClick={() => onOpenTextbook(selectedCourse)}
                        style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '1rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                    >
                        <Book size={18} /> Electronic Textbook
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '2.5rem' }}>
                {/* Course Selector Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="edu-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <Search size={18} color="#64748B" />
                            <h4 style={{ fontWeight: '800', margin: 0 }}>Courses</h4>
                        </div>
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
                                        fontSize: '0.875rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {course.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exam Unlock Status */}
                    <div className="edu-card" style={{
                        padding: '1.5rem',
                        background: examUnlocked ? 'linear-gradient(135deg, #10B981, #059669)' : '#FEF3C7',
                        border: 'none',
                        color: examUnlocked ? '#FFFFFF' : '#92400E'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <Zap size={20} color={examUnlocked ? '#FFFFFF' : '#F59E0B'} />
                            <h4 style={{ fontWeight: '800', color: 'inherit' }}>Final Exam</h4>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'inherit', marginBottom: '1.25rem', opacity: 0.9 }}>
                            {examUnlocked
                                ? 'Congratulations! You have mastered the course content. The final exam is now available.'
                                : `Reach 70% mastery to unlock. You are currently at ${masteryPercent}%.`
                            }
                        </p>
                        <button
                            disabled={!examUnlocked}
                            onClick={() => alert("Starting Final Exam...")}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: examUnlocked ? '#FFFFFF' : '#E2E8F0',
                                color: examUnlocked ? '#059669' : '#94A3B8',
                                fontWeight: '900',
                                cursor: examUnlocked ? 'pointer' : 'not-allowed',
                                fontSize: '0.875rem',
                                boxShadow: examUnlocked ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {examUnlocked ? 'START EXAM' : 'LOCKED'}
                        </button>
                    </div>
                </aside>

                {/* Modules & Topics */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <Loader2 className="edu-spin" color="var(--edu-indigo)" size={40} />
                        </div>
                    ) : modules.length > 0 ? (
                        modules.map((module, idx) => (
                            <div key={module.module_id || module.id || `mod-${idx}`} className="edu-card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Module Header */}
                                <div
                                    onClick={() => toggleModule(module.module_id || module.id)}
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: expandedModules[module.module_id || module.id] ? '#F8FAFC' : '#FFFFFF'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: '#EEF2FF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '900',
                                            color: 'var(--edu-indigo)'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem' }}>{module.title}</h3>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                {module.duration} • Weight: {Math.round(module.mastery_weight * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                    {expandedModules[module.module_id || module.id] ? (
                                        <ChevronUp size={24} color="#64748B" />
                                    ) : (
                                        <ChevronDown size={24} color="#64748B" />
                                    )}
                                </div>

                                {/* Topics List */}
                                {expandedModules[module.module_id || module.id] && (
                                    <div style={{ padding: '1rem', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {topicsMap[module.module_id || module.id]?.map(topic => (
                                            <TopicTile
                                                key={topic.topic_id || topic.id}
                                                topic={topic}
                                                onExerciseStart={handleExerciseStart}
                                                authToken={authToken}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem', background: '#FFFFFF', borderRadius: '2rem', border: '2px dashed #E2E8F0' }}>
                            <p style={{ color: '#94A3B8', fontWeight: '600' }}>No modules found for this course.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default LearningHub;
