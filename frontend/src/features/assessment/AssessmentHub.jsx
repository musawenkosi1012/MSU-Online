import React, { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    BookOpen,
    FileText,
    Award,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RotateCcw,
    BarChart3,
    ArrowLeft,
    Sparkles,
    Check
} from 'lucide-react';

const AssessmentHub = ({ courseId = "course-1", studentId = "student-1" }) => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'quiz', 'results'
    const [topics, setTopics] = useState([]);
    const [activeAssessment, setActiveAssessment] = useState(null);
    const [currentAnswers, setCurrentAnswers] = useState([]);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchTopics();
        fetchHistory();
    }, [courseId]);

    const fetchTopics = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/questions/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setTopics(data.questions || data || []);
        } catch (err) {
            console.error("Error fetching assessment data:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/results/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            setHistory(data.results || data || []);
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const startAssessment = (assessmentItem) => {
        // The new endpoint returns full questions, so we can just use them
        setActiveAssessment({
            id: assessmentItem.id || `eval-${courseId}`,
            title: assessmentItem.title || "Academic Evaluation",
            questions: [assessmentItem], // If it was a single question or similar
            type: assessmentItem.type || 'mcq'
        });
        setCurrentAnswers(['']);
        setView('quiz');
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Using the single-answer endpoint
            const question = activeAssessment.questions[0];
            const answerVal = currentAnswers[0];

            const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: question.id,
                    answer: String(answerVal), // Ensure string
                    question_type: question.type || 'mcq'
                })
            });
            const data = await resp.json();
            setSubmissionResult(data);
            setView('results');
            fetchHistory();
        } catch (err) {
            console.error("Error submitting assessment:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (index, val) => {
        const newAnswers = [...currentAnswers];
        newAnswers[index] = val;
        setCurrentAnswers(newAnswers);
    };

    if (view === 'dashboard') {
        return (
            <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '0' }}>
                <header className="edu-glass-panel" style={{ padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--edu-slate-border)', borderRadius: '0 0 2.5rem 2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--edu-slate)', marginBottom: '0.5rem', letterSpacing: '-0.05em' }}>MSU Assessment Hub</h2>
                        <p style={{ color: 'var(--edu-slate-text)', fontWeight: '600', fontSize: '1.125rem' }}>AI-driven insights for academic mastery tracking.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--edu-slate-light)', padding: '1rem 1.5rem', borderRadius: '1.25rem', border: '1px solid var(--edu-slate-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--edu-emerald)', boxShadow: '0 0 10px var(--edu-emerald-glow)' }}></div>
                            <span style={{ fontWeight: '900', fontSize: '0.75rem', color: 'var(--edu-slate)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mastery Engine Active</span>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem', padding: '0 2.5rem 2.5rem' }}>
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--edu-indigo-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen style={{ width: '1.25rem', height: '1.25rem', color: 'var(--edu-indigo)' }} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--edu-slate)', letterSpacing: '-0.025em' }}>Evaluations</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                            {topics.length > 0 ? topics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => startAssessment(topic)}
                                    className="edu-card edu-card-interactive edu-rotate-in"
                                    style={{ width: '100%', textAlign: 'left', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                        <div className="edu-icon-wrapper edu-shimmer" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: topic.type === 'mcq' ? 'var(--edu-indigo-light)' : '#ECFDF5', color: topic.type === 'mcq' ? 'var(--edu-indigo)' : 'var(--edu-emerald)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                            {topic.type === 'mcq' ? <ClipboardCheck size={32} /> : <FileText size={32} />}
                                        </div>

                                        <div>
                                            <h4 style={{ fontWeight: '900', fontSize: '1.25rem', color: 'var(--edu-slate)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{topic.title}</h4>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '0.625rem', fontWeight: '900', color: 'var(--edu-slate-text)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--edu-slate-light)', padding: '0.25rem 0.625rem', borderRadius: '0.5rem' }}>
                                                    {topic.type === 'mcq' ? 'Objective' : 'Analytical'}
                                                </span>
                                                <span style={{ fontSize: '0.625rem', fontWeight: '900', color: 'var(--edu-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--edu-indigo-light)', padding: '0.25rem 0.625rem', borderRadius: '0.5rem' }}>
                                                    {topic.difficulty || 'Intermediate'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--edu-slate-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease' }} className="edu-btn-icon">
                                        <ChevronRight size={24} color="var(--edu-slate-text)" />
                                    </div>
                                </button>
                            )) : (
                                <div className="edu-card" style={{ padding: '4rem', textAlign: 'center', gridColumn: '1 / -1', border: '2px dashed var(--edu-slate-border)', background: 'var(--edu-slate-light)' }}>
                                    <AlertCircle style={{ width: '4rem', height: '4rem', color: '#94A3B8', margin: '0 auto 1.5rem' }} className="edu-float" />
                                    <h4 style={{ fontSize: '1.25rem', color: 'var(--edu-slate)', marginBottom: '0.5rem' }}>No Streams Available</h4>
                                    <p style={{ color: 'var(--edu-slate-text)', fontWeight: '600' }}>Authority has not initialized assessments for this path.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--edu-indigo-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award style={{ width: '1.25rem', height: '1.25rem', color: 'var(--edu-purple)' }} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--edu-slate)', letterSpacing: '-0.025em' }}>Credentials</h3>
                        </div>
                        <div className="edu-card edu-animate-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'linear-gradient(135deg, #FFFFFF, var(--edu-indigo-light))' }}>
                            {history.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {history.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="edu-rotate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.6)', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.5)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.score >= 70 ? 'var(--edu-emerald)' : 'var(--edu-orange)', boxShadow: item.score >= 70 ? '0 0 12px var(--edu-emerald)' : '0 0 12px var(--edu-orange)' }} />
                                                <div>
                                                    <p style={{ fontWeight: '800', color: 'var(--edu-slate)', fontSize: '1rem' }}>{topics.find(t => t.id === item.assessment_id)?.title || 'Academic Unit'}</p>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--edu-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mastery: {item.score.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: item.score >= 70 ? '#DCFCE7' : '#FFEDD5', color: item.score >= 70 ? 'var(--edu-emerald)' : 'var(--edu-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                <CheckCircle2 size={24} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                    <RotateCcw style={{ color: 'var(--edu-slate-border)', width: '3.5rem', height: '3.5rem', margin: '0 auto 1.5rem' }} className="edu-spin" />
                                    <p style={{ color: 'var(--edu-slate-text)', fontWeight: '700', fontSize: '1rem' }}>No academic records found.</p>
                                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Complete assessments to build your profile.</p>
                                </div>
                            )}
                            <button className="edu-btn edu-btn-outline edu-shimmer" style={{ marginTop: 'auto', fontWeight: '900' }}>Unified Transcript</button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (view === 'quiz' && activeAssessment) {
        return (
            <div className="edu-animate-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '2.5rem 0' }}>
                <div className="edu-glass-panel" style={{ padding: '2.5rem', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <button onClick={() => setView('dashboard')} className="edu-btn-icon" style={{ padding: '1rem', background: 'var(--edu-slate-light)', border: 'none', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={24} color="var(--edu-slate-text)" />
                        </button>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--edu-slate)', letterSpacing: '-0.025em' }}>{activeAssessment.title}</h2>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--edu-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}><Clock size={16} /> 20 MIN PROTOCOL</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '900', color: 'var(--edu-indigo)', textTransform: 'uppercase', letterSpacing: '0.05em' }}><FileText size={16} /> {activeAssessment.questions?.length || 1} EVALUATION STEPS</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--edu-indigo-light)', border: '4px solid var(--edu-indigo-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--edu-indigo)', fontSize: '1.25rem' }} className="edu-float">
                        ID-1
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {(activeAssessment.questions || []).map((q, idx) => (
                        <div key={idx} className="edu-card edu-animate-in" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                <span style={{ padding: '0.625rem 1.25rem', background: 'var(--edu-indigo-light)', color: 'var(--edu-indigo)', borderRadius: '1rem', fontWeight: '900', fontSize: '0.875rem', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)' }}>STEP {idx + 1}</span>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--edu-slate)', lineHeight: '1.5', letterSpacing: '-0.01em' }}>
                                    {q.question || q.question_text}
                                </p>
                            </div>

                            {activeAssessment.type === 'mcq' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    {(q.options || []).map((opt, oIdx) => (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleAnswerChange(idx, oIdx)}
                                            style={{ width: '100%', padding: '1.5rem', textAlign: 'left', borderRadius: '1.5rem', border: '2px solid', borderColor: currentAnswers[idx] === oIdx ? 'var(--edu-indigo)' : 'var(--edu-slate-border)', background: currentAnswers[idx] === oIdx ? 'var(--edu-indigo-light)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                            className="edu-card-interactive"
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '12px', border: '2px solid', borderColor: currentAnswers[idx] === oIdx ? 'var(--edu-indigo)' : 'var(--edu-slate-border)', background: currentAnswers[idx] === oIdx ? 'var(--edu-indigo)' : 'var(--edu-slate-light)', color: currentAnswers[idx] === oIdx ? '#FFFFFF' : 'var(--edu-slate-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' }}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <span style={{ fontWeight: '800', fontSize: '1.125rem', color: currentAnswers[idx] === oIdx ? 'var(--edu-indigo-dark)' : 'var(--edu-slate)' }}>{opt}</span>
                                            </div>
                                            {currentAnswers[idx] === oIdx && <div className="edu-rotate-in"><CheckCircle2 style={{ color: 'var(--edu-indigo)' }} size={24} /></div>}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ background: 'var(--edu-slate-light)', borderRadius: '2rem', padding: '2rem', border: '2px solid var(--edu-slate-border)' }}>
                                    <textarea
                                        placeholder="Formulate your analytical response here..."
                                        value={currentAnswers[idx] || ''}
                                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                                        style={{ width: '100%', height: '15rem', background: 'transparent', border: 'none', outline: 'none', fontSize: '1.125rem', fontWeight: '600', color: 'var(--edu-slate)', resize: 'none', lineHeight: '1.6' }}
                                    />
                                    <div style={{ borderTop: '1px solid var(--edu-slate-border)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' }}>Indexing Enabled</span>
                                        <Sparkles size={18} color="var(--edu-indigo)" className="edu-float" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || currentAnswers.some(a => a === '' || a === undefined)}
                        className="edu-btn edu-btn-primary edu-shimmer"
                        style={{ padding: '1.5rem 4rem', borderRadius: '2rem', fontSize: '1.25rem', fontWeight: '900', gap: '1rem', opacity: currentAnswers.some(a => a === '' || a === undefined) ? 0.5 : 1, transform: 'scale(1.05)' }}
                    >
                        {isLoading ? <><RotateCcw className="edu-spin" /> Authenticating Protocol...</> : <><Sparkles size={24} /> Finalize Academic Evaluation</>}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'results' && submissionResult) {
        const isDistinction = submissionResult.score >= 75;
        return (
            <div className="edu-animate-in" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '3rem', padding: '4rem 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="edu-float" style={{ width: '7rem', height: '7rem', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: isDistinction ? '0 20px 40px -10px var(--edu-emerald-glow)' : '0 20px 40px -10px rgba(245, 158, 11, 0.3)', background: isDistinction ? 'linear-gradient(135deg, var(--edu-emerald), #059669)' : 'linear-gradient(135deg, var(--edu-orange), #D97706)', color: '#FFFFFF' }}>
                        {isDistinction ? <Award size={48} /> : <CheckCircle2 size={48} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--edu-slate)', letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
                            {isDistinction ? 'Distinction Achievement' : 'Evaluation Complete'}
                        </h2>
                        <p style={{ color: 'var(--edu-slate-text)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.875rem' }}>Mastery Protocol Results Indexed</p>
                    </div>
                </div>

                <div className="edu-card edu-animate-in" style={{ padding: '4rem', background: 'linear-gradient(135deg, #FFFFFF, var(--edu-slate-light))', border: '2px solid var(--edu-slate-border)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--edu-indigo)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>Academic Performance Analytics</div>
                    <div style={{ fontSize: '8rem', fontWeight: '900', letterSpacing: '-0.05em', color: isDistinction ? 'var(--edu-emerald)' : 'var(--edu-indigo)', lineHeight: '1', marginBottom: '2.5rem' }} className="edu-shimmer">
                        {submissionResult.score.toFixed(0)}<span style={{ fontSize: '3rem' }}>%</span>
                    </div>
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.8)', borderRadius: '2rem', border: '1px solid var(--edu-indigo-light)', backdropFilter: 'blur(10px)' }}>
                        <p style={{ color: 'var(--edu-slate)', fontStyle: 'italic', fontWeight: '800', fontSize: '1.25rem', lineHeight: '1.6' }}>
                            "{submissionResult.feedback}"
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
                    <button
                        onClick={() => setView('dashboard')}
                        style={{ flex: 2, padding: '1.5rem', borderRadius: '1.5rem', fontSize: '1.125rem' }}
                        className="edu-btn edu-btn-primary edu-shimmer"
                    >
                        Return to Hub
                    </button>
                    <button
                        onClick={() => startAssessment(activeAssessment)}
                        style={{ flex: 1, padding: '1.5rem', borderRadius: '1.5rem', fontSize: '1.125rem', gap: '0.75rem' }}
                        className="edu-btn edu-btn-outline"
                    >
                        <RotateCcw size={20} /> Retake
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default AssessmentHub;
