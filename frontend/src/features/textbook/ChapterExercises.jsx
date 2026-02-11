import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    BookOpen,
    ArrowLeft,
    Send
} from 'lucide-react';

const ChapterExercises = ({ courseId, chapterIndex, chapter, onBack, onComplete, mode = 'chapter' }) => {
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({ mcqs: [], open_ended: [], coding_task: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssessment();
    }, [courseId, chapterIndex, mode]);

    const fetchAssessment = async () => {
        try {
            const token = localStorage.getItem('token');
            let url, body;

            if (mode === 'final') {
                url = `${import.meta.env.VITE_API_BASE}/api/textbook/quiz/generate-final`;
                body = { course_id: courseId };
            } else {
                // Construct chapter content from sections
                const content = chapter.sections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
                url = `${import.meta.env.VITE_API_BASE}/api/textbook/quiz/generate-chapter`;
                body = {
                    course_id: courseId,
                    chapter_index: chapterIndex,
                    chapter_title: chapter.title,
                    chapter_content: content
                };
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Failed to generate assessment");

            const data = await res.json();
            setAssessment(data);

            // Initialize answers
            setAnswers({
                mcqs: new Array(data.mcqs?.length || 0).fill(null),
                open_ended: new Array(data.open_ended?.length || 0).fill(""),
                coding_task: data.coding_prompt ? "" : null
            });

        } catch (err) {
            console.error("Assessment Error:", err);
            setError("Failed to load exercises. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMcqChange = (index, value) => {
        const newMcqs = [...answers.mcqs];
        newMcqs[index] = value;
        setAnswers({ ...answers, mcqs: newMcqs });
    };

    const handleOpenChange = (index, value) => {
        const newOpen = [...answers.open_ended];
        newOpen[index] = value;
        setAnswers({ ...answers, open_ended: newOpen });
    };

    const handleSubmit = async () => {
        if (answers.mcqs.includes(null) || answers.open_ended.some(a => !a.trim())) {
            alert("Please answer all theory questions before submitting.");
            return;
        }
        if (assessment.coding_prompt && !answers.coding_task?.trim()) {
            alert("Please complete the coding task.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: "current", // Backend handles this via Auth
                    assessment_id: assessment.id,
                    answers: answers // backend expects dict for chapter_exercise
                })
            });

            const data = await res.json();
            setResults(data);

            if (data.score >= 60) {
                // Determine if this was the last chapter? 
                // We rely on parent to know if there's a next chapter
                // onComplete(true) -> unlocked next
            }

        } catch (err) {
            console.error("Submission Error:", err);
            alert("Failed to submit assessment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="edu-animate-in" style={{ padding: '6rem', textAlign: 'center' }}>
                <Loader2 className="edu-spin" color="#4F46E5" size={48} style={{ margin: '0 auto 2rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>Generating Chapter Exercises...</h3>
                <p style={{ color: '#64748B', fontWeight: '500' }}>Musa is creating custom questions based on this chapter.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="edu-animate-in" style={{ padding: '4rem', textAlign: 'center' }}>
                <AlertCircle color="#EF4444" size={48} style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#EF4444', fontWeight: '700' }}>{error}</p>
                <button onClick={onBack} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Go Back</button>
            </div>
        );
    }

    if (results) {
        const passed = results.score >= 60;
        return (
            <div className="edu-animate-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: passed ? '#F0FDF4' : '#FEF2F2',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        {passed ? <CheckCircle2 size={40} color="#16A34A" /> : <AlertCircle size={40} color="#DC2626" />}
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>
                        {passed ? "Chapter Complete!" : "Keep Trying"}
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: '#64748B' }}>
                        You scored <strong style={{ color: passed ? '#16A34A' : '#DC2626' }}>{results.score}%</strong>
                    </p>
                </div>

                {/* Score Breakdown */}
                <div className="edu-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem' }}>Assessment Report</h4>
                    {results.results?.map((res, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #F1F5F9' }}>
                            <span style={{ fontWeight: '500', color: '#475569' }}>
                                {res.type === 'mcq' ? `Question ${res.index + 1} (MCQ)` : `Question ${res.index + 1} (Open-Ended)`}
                            </span>
                            {res.type === 'mcq' ? (
                                <span style={{ color: res.is_correct ? '#16A34A' : '#DC2626', fontWeight: '700' }}>
                                    {res.is_correct ? '+5 pts' : '0 pts'}
                                </span>
                            ) : (
                                <span style={{ color: '#4F46E5', fontWeight: '700' }}>
                                    {res.score.toFixed(1)} / {res.max} pts
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {!passed && (
                        <button
                            onClick={() => window.location.reload()} // Quick retry reload
                            style={{ padding: '1rem 2rem', background: '#F1F5F9', color: '#475569', borderRadius: '1rem', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Retry Exercises
                        </button>
                    )}
                    {passed ? (
                        <button
                            onClick={() => onComplete(true)} // Proceed to next chapter
                            style={{ padding: '1rem 2rem', background: '#4F46E5', color: '#FFFFFF', borderRadius: '1rem', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            Next Chapter <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={onBack}
                            style={{ padding: '1rem 2rem', background: 'transparent', color: '#475569', borderRadius: '1rem', border: '1px solid #E2E8F0', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Back to Reading
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="edu-animate-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A' }}>{assessment.title}</h2>
                    <p style={{ color: '#64748B' }}>Answer all questions to unlock the next chapter.</p>
                </div>
            </header>

            {/* MCQs */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#334155' }}>Multiple Choice</h3>
                {assessment.mcqs.map((q, i) => (
                    <div key={i} className="edu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1E293B' }}>
                            {i + 1}. {q.question}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {q.options.map((opt, optIdx) => (
                                <label key={optIdx} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem', borderRadius: '0.75rem',
                                    background: answers.mcqs[i] === optIdx ? '#EEF2FF' : '#F8FAFC',
                                    border: answers.mcqs[i] === optIdx ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name={`mcq-${i}`}
                                        checked={answers.mcqs[i] === optIdx}
                                        onChange={() => handleMcqChange(i, optIdx)}
                                        style={{ accentColor: '#4F46E5', width: '1.25rem', height: '1.25rem' }}
                                    />
                                    <span style={{ fontSize: '1rem', color: '#334155' }}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Open Ended / Essays */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#334155' }}>
                    {assessment.open_ended?.length === 4 ? "Theoretical Essays (80 Marks)" : "Written Responses"}
                </h3>
                {assessment.open_ended?.map((q, i) => (
                    <div key={i} className="edu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1E293B' }}>
                            {i + 1}. {q.question}
                        </p>
                        <textarea
                            value={answers.open_ended[i]}
                            onChange={(e) => handleOpenChange(i, e.target.value)}
                            placeholder="Type your academic response here..."
                            rows={5}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '0.75rem',
                                border: '1px solid #E2E8F0', fontSize: '1rem', fontFamily: 'inherit',
                                resize: 'vertical', outline: 'none'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Coding Task (if applicable) */}
            {assessment.coding_prompt && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: '#334155' }}>Programming Task (10 Marks)</h3>
                    <div className="edu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1E293B' }}>
                            {assessment.coding_prompt}
                        </p>
                        <div style={{ height: '300px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#1E1E1E' }}>
                            <textarea
                                value={answers.coding_task}
                                onChange={(e) => setAnswers({ ...answers, coding_task: e.target.value })}
                                placeholder="// Write your code here..."
                                style={{ width: '100%', height: '100%', padding: '1.5rem', fontFamily: 'Fira Code, monospace', fontSize: '0.875rem', color: '#F8FAFC', background: 'transparent', border: 'none', resize: 'none', outline: 'none' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                    width: '100%', padding: '1.25rem', background: '#4F46E5', color: '#FFFFFF',
                    borderRadius: '1rem', border: 'none', fontSize: '1.125rem', fontWeight: '800',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)'
                }}
            >
                {submitting ? <Loader2 className="edu-spin" /> : <Send size={20} />}
                Submit Assessment
            </button>
        </div>
    );
};

export default ChapterExercises;
