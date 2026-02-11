import React, { useState, useEffect } from 'react';
import {
    Plus,
    LayoutDashboard,
    BookOpen,
    FileText,
    Upload,
    Link as LinkIcon,
    PlusCircle,
    CheckCircle2,
    X,
    Loader2,
    Database,
    ChevronRight,
    Search,
    Brain,
    ClipboardCheck,
    PenTool,
    Sparkles,
    AlertCircle,
    ChevronDown,
    Trash2,
    Save,
    BarChart3,
    History,
    FileCode
} from 'lucide-react';

const TutorDashboard = () => {
    const [view, setView] = useState('intelligence'); // 'intelligence', 'courses', 'performance'
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Stats & Content Review
    const [stats, setStats] = useState({ verified_count: 0, review_queue_count: 0, avg_credibility: 0 });
    const [reviewQueue, setReviewQueue] = useState([]);
    const [recentVerified, setRecentVerified] = useState([]);

    // Course Management
    const [courses, setCourses] = useState([]);
    const [activeCourse, setActiveCourse] = useState(null);
    const [showCourseWizard, setShowCourseWizard] = useState(false);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        total_hours: 10,
        is_programming: false,
        outline: []
    });

    // Performance
    const [performanceData, setPerformanceData] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleApprove = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/approve/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            setMessage({ type: 'success', text: 'Content Approved!' });
            fetchInitialData();
        }
    };

    const handleReject = async (id) => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/reject/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            setMessage({ type: 'success', text: 'Content Rejected.' });
            fetchInitialData();
        }
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchReviewQueue(),
                fetchRecentVerified(),
                fetchCourses()
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/content/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setStats(await res.json());
    };

    const fetchReviewQueue = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/content/review`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            setReviewQueue(data.articles || []);
        }
    };

    const fetchRecentVerified = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/content/articles`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            setRecentVerified(data.articles || []);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/my-courses`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched courses:", data);
                setCourses(Array.isArray(data) ? data : data.courses || []);
            } else {
                console.error("Failed to fetch courses:", res.status);
            }
        } catch (err) {
            console.error("Error in fetchCourses:", err);
        }
    };

    const fetchPerformance = async (courseId) => {
        const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/courses/${courseId}/performance`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setPerformanceData(await res.json());
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: courseForm.title,
                    description: courseForm.description,
                    total_hours: courseForm.total_hours,
                    is_programming: courseForm.is_programming
                })
            });

            if (res.ok) {
                const newCourse = await res.json();
                // If outline has modules, save them
                if (courseForm.outline.length > 0) {
                    await fetch(`${import.meta.env.VITE_API_BASE}/api/tutor/courses/${newCourse.id}/outline`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(courseForm.outline)
                    });
                }
                setMessage({ type: 'success', text: 'Course Created & Outline Saved!' });
                setShowCourseWizard(false);
                fetchCourses();
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Creation failed.' });
        } finally {
            setIsLoading(false);
        }
    };

    const addModule = () => {
        setCourseForm({
            ...courseForm,
            outline: [...courseForm.outline, { title: '', description: '', expected_outcome: '', sub_topics: [] }]
        });
    };

    const addSubTopic = (modIdx) => {
        const newOutline = [...courseForm.outline];
        newOutline[modIdx].sub_topics.push({ title: '', content: '', practice_code: '' });
        setCourseForm({ ...courseForm, outline: newOutline });
    };

    const updateModule = (idx, field, val) => {
        const newOutline = [...courseForm.outline];
        newOutline[idx][field] = val;
        setCourseForm({ ...courseForm, outline: newOutline });
    };

    const updateSubTopic = (modIdx, subIdx, field, val) => {
        const newOutline = [...courseForm.outline];
        newOutline[modIdx].sub_topics[subIdx][field] = val;
        setCourseForm({ ...courseForm, outline: newOutline });
    };

    const renderIntelligence = () => (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="edu-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--edu-glass-bg)' }}>
                    <div style={{ color: 'var(--edu-emerald)', marginBottom: '0.5rem' }}><CheckCircle2 size={32} style={{ margin: '0 auto' }} /></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-slate-text)', textTransform: 'uppercase' }}>Verified Textbooks</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stats.verified_count}</div>
                </div>
                <div className="edu-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--edu-glass-bg)' }}>
                    <div style={{ color: 'var(--edu-orange)', marginBottom: '0.5rem' }}><History size={32} style={{ margin: '0 auto' }} /></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-slate-text)', textTransform: 'uppercase' }}>Pending Approval</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{stats.review_queue_count}</div>
                </div>
                <div className="edu-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--edu-glass-bg)' }}>
                    <div style={{ color: 'var(--edu-indigo)', marginBottom: '0.5rem' }}><Sparkles size={32} style={{ margin: '0 auto' }} /></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-slate-text)', textTransform: 'uppercase' }}>Avg Credibility</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900' }}>{(stats.avg_credibility * 100).toFixed(1)}%</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <section className="edu-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LayoutDashboard color="var(--edu-indigo)" size={20} /> My Active Streams
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {courses.length > 0 ? courses.slice(0, 3).map(course => (
                            <div key={course.id} style={{ padding: '1rem', background: 'var(--edu-indigo-light)', borderRadius: '0.75rem', border: '1px solid var(--edu-indigo-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: '800', fontSize: '0.875rem', color: 'var(--edu-indigo)' }}>{course.title}</span>
                                    <div style={{ fontSize: '0.625rem', color: '#64748B' }}>{course.is_programming ? 'Programming Lab' : 'Ordinary Stream'}</div>
                                </div>
                                <button onClick={() => setView('courses')} style={{ background: 'none', border: 'none', color: 'var(--edu-indigo)', cursor: 'pointer' }}><ChevronRight size={18} /></button>
                            </div>
                        )) : <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem', padding: '1rem' }}>No academic streams designed yet.</div>}
                        {courses.length > 3 && (
                            <button onClick={() => setView('courses')} style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-indigo)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: '0.5rem' }}>
                                View all {courses.length} courses
                            </button>
                        )}
                    </div>
                </section>
                <section className="edu-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle color="var(--edu-orange)" size={20} /> Review Queue
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reviewQueue.length > 0 ? reviewQueue.map(item => (
                            <div key={item.id} style={{ padding: '1rem', background: '#FFF7ED', borderRadius: '0.75rem', border: '1px solid #FFEDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{item.course_title || 'Dynamic Textbook'}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleApprove(item.id)} className="edu-btn edu-btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--edu-emerald)' }}>Approve</button>
                                    <button onClick={() => handleReject(item.id)} className="edu-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#EF4444' }}>Reject</button>
                                </div>
                            </div>
                        )) : <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem', padding: '1rem' }}>No pending reviews</div>}
                    </div>
                </section>
            </div>

            <section className="edu-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 color="var(--edu-emerald)" size={20} /> Recently Verified Content
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {recentVerified.length > 0 ? recentVerified.map(item => (
                        <div key={item.id} style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '0.75rem', border: '1px solid #DCFCE7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>{item.course_title || 'Knowledge Base #' + item.id}</span>
                            <Sparkles size={16} color="var(--edu-emerald)" />
                        </div>
                    )) : <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem', padding: '1rem' }}>No verified content yet. All tutor-approved textbooks will appear here.</div>}
                </div>
            </section>
        </div>
    );

    const renderCourseManagement = () => (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Course Management</h3>
                <button onClick={() => { setCourseForm({ title: '', description: '', total_hours: 10, is_programming: false, outline: [] }); setShowCourseWizard(true); }} className="edu-btn edu-btn-primary">
                    <Plus size={18} /> New Course
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {courses.length > 0 ? courses.map(course => (
                    <div key={course.id} className="edu-card edu-card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: '800' }}>{course.title}</h4>
                                <span style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem', background: course.is_programming ? 'var(--edu-indigo-light)' : 'var(--edu-emerald-light)', color: course.is_programming ? 'var(--edu-indigo)' : 'var(--edu-emerald)', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>
                                    {course.is_programming ? 'Programming' : 'Ordinary'}
                                </span>
                            </div>
                            <PenTool size={18} color="#64748B" style={{ cursor: 'pointer' }} />
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.4' }}>{course.description}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button onClick={() => { setActiveCourse(course); fetchPerformance(course.id); setView('performance'); }} className="edu-btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Performance</button>
                            <button className="edu-btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Modify Outline</button>
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '2rem', border: '2px dashed var(--edu-slate-border)', color: '#64748B' }}>
                        <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h4 style={{ fontWeight: '800' }}>No Courses Found</h4>
                        <p>You haven't designed any academic streams yet. Click "New Course" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderPerformance = () => (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setView('courses')} className="edu-btn" style={{ padding: '0.5rem' }}><ChevronRight style={{ transform: 'rotate(180deg)' }} /></button>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Performance: {activeCourse?.title}</h3>
            </div>

            <div className="edu-card" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                            <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Student</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Topic</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Attempts</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Duration</th>
                            <th style={{ padding: '1rem', color: '#64748B', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {performanceData.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '1rem', fontWeight: '700' }}>{row.full_name}</td>
                                <td style={{ padding: '1rem' }}>{row.topic_title}</td>
                                <td style={{ padding: '1rem' }}>{row.attempts} attempts</td>
                                <td style={{ padding: '1rem' }}>{Math.floor(row.duration_seconds / 60)}m {row.duration_seconds % 60}s</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: row.passed ? '#F0FDF4' : '#FEF2F2', color: row.passed ? '#16A34A' : '#DC2626', fontSize: '0.75rem', fontWeight: '800' }}>
                                        {row.passed ? 'COMPLETED' : 'IN PROGRESS'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {performanceData.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>No student data recorded yet.</div>}
            </div>
        </div>
    );

    const renderCourseWizard = () => (
        <div className="edu-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="edu-card edu-animate-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative' }}>
                <button onClick={() => setShowCourseWizard(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={24} /></button>

                <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '2.5rem' }}>Design New Academic Stream</h2>

                <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="edu-input-group">
                            <label className="edu-input-label">Title</label>
                            <div className="edu-input-wrapper">
                                <FileText className="edu-input-icon" />
                                <input type="text" required className="edu-input" style={{ paddingLeft: '3rem' }} value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} />
                            </div>
                        </div>
                        <div className="edu-input-group">
                            <label className="edu-input-label">Type & Lab Environment</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '48px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={courseForm.is_programming} onChange={e => setCourseForm({ ...courseForm, is_programming: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {courseForm.is_programming ? <FileCode color="var(--edu-indigo)" /> : <BookOpen color="#64748B" />}
                                    {courseForm.is_programming ? 'Programming Lab Course' : 'Ordinary Textbook Course'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="edu-input-group">
                        <label className="edu-input-label">Curriculum Outline Designer</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E2E8F0' }}>
                            {courseForm.outline.map((mod, modIdx) => (
                                <div key={modIdx} style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <input placeholder="Chapter Title" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: '700' }} value={mod.title} onChange={e => updateModule(modIdx, 'title', e.target.value)} />
                                        <button type="button" onClick={() => { const o = [...courseForm.outline]; o.splice(modIdx, 1); setCourseForm({ ...courseForm, outline: o }); }} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '2rem', borderLeft: '2px solid #E2E8F0' }}>
                                        {mod.sub_topics.map((sub, subIdx) => (
                                            <div key={subIdx} style={{ display: 'flex', gap: '1rem' }}>
                                                <input placeholder="Sub-topic Heading" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid #E1E7EF', fontSize: '0.875rem' }} value={sub.title} onChange={e => updateSubTopic(modIdx, subIdx, 'title', e.target.value)} />
                                                <button type="button" onClick={() => { const o = [...courseForm.outline]; o[modIdx].sub_topics.splice(subIdx, 1); setCourseForm({ ...courseForm, outline: o }); }} style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addSubTopic(modIdx)} style={{ alignSelf: 'start', fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-indigo)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Sub-topic</button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addModule} style={{ padding: '1rem', borderRadius: '0.75rem', border: '2px dashed var(--edu-slate-border)', color: '#64748B', fontWeight: '800', cursor: 'pointer', background: 'none' }}>
                                + Add New Chapter / Module
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1rem' }}>
                            <Sparkles size={12} /> Pro-tip: Textbook content will be AI-generated automatically based on these headings after you save.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button type="button" onClick={() => setShowCourseWizard(false)} className="edu-btn">Cancel</button>
                        <button type="submit" disabled={isLoading} className="edu-btn edu-btn-primary">
                            {isLoading ? <Loader2 className="edu-spin" /> : <><Save size={18} /> Launch Course & Generate Content</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--edu-slate-light)', paddingBottom: '5rem' }}>
            <header className="edu-glass-panel" style={{ padding: '2.5rem', position: 'sticky', top: 0, zIndex: 10, borderRadius: '0 0 2rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em' }}>Tutor Command Center</h2>
                        <p style={{ color: 'var(--edu-slate-text)', fontWeight: '600' }}>Manage academic streams and verify AI-generated content.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setView('intelligence')} className={`edu-nav-btn ${view === 'intelligence' ? 'active' : ''}`} style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', border: 'none', background: view === 'intelligence' ? 'var(--edu-indigo)' : 'transparent', color: view === 'intelligence' ? '#FFF' : 'var(--edu-slate)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s' }}>
                            <Brain size={20} /> Content Hub
                        </button>
                        <button onClick={() => setView('courses')} className={`edu-nav-btn ${view === 'courses' ? 'active' : ''}`} style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', border: 'none', background: view === 'courses' ? 'var(--edu-indigo)' : 'transparent', color: view === 'courses' ? '#FFF' : 'var(--edu-slate)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s' }}>
                            <LayoutDashboard size={20} /> Management
                        </button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '1400px', margin: '2.5rem auto', padding: '0 2.5rem' }}>
                {message.text && (
                    <div style={{ padding: '1rem', borderRadius: '1rem', background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2', color: message.type === 'success' ? '#166534' : '#991B1B', border: '1px solid', borderColor: message.type === 'success' ? '#DCFCE7' : '#FEE2E2', marginBottom: '2rem', textAlign: 'center', fontWeight: '700' }}>
                        {message.text}
                    </div>
                )}

                {view === 'intelligence' && renderIntelligence()}
                {view === 'courses' && renderCourseManagement()}
                {view === 'performance' && renderPerformance()}
            </main>

            {showCourseWizard && renderCourseWizard()}

            <style dangerouslySetInnerHTML={{
                __html: `
                .edu-nav-btn:hover { background: #E2E8F0; }
                .edu-nav-btn.active:hover { background: var(--edu-indigo); }
                .edu-modal-overlay { backdrop-filter: blur(8px); }
`}} />
        </div>
    );
};

export default TutorDashboard;
