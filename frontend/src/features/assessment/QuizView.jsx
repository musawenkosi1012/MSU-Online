import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import QuestionCard from './QuestionCard';

const QuizView = ({ generatedQuiz, onClose, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    if (!generatedQuiz) return null;

    const questions = generatedQuiz.questions || [];
    const currentQuestion = questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === questions.length - 1;

    const handleAnswer = (val) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: val }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const formattedAnswers = questions.map((q, i) => ({
                question_id: q.id,
                answer: answers[i] !== undefined ? String(answers[i]) : "",
                question_type: q.type || 'mcq'
            }));

            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/assessment/assessment/${generatedQuiz.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });

            if (!res.ok) throw new Error("Submission failed");
            const data = await res.json();
            setResult(data);
            if (onComplete) onComplete();
        } catch (err) {
            console.error("Quiz submission error:", err);
            alert("Failed to submit quiz. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        return (
            <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
                <div style={{ background: '#FFFFFF', padding: '3rem', borderRadius: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ background: '#ECFDF5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <CheckCircle size={40} color="#059669" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.5rem' }}>Assessment Complete!</h2>
                    <p style={{ color: '#64748B', fontSize: '1.125rem' }}>You successfully completed {generatedQuiz.title}.</p>

                    <div style={{ margin: '2.5rem 0', padding: '2rem', background: '#F8FAFC', borderRadius: '1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>Your Score</div>
                        <div style={{ fontSize: '4rem', fontWeight: '900', color: '#4F46E5', lineHeight: '1' }}>{result.score}%</div>
                        <div style={{ marginTop: '0.5rem', color: '#059669', fontWeight: '600' }}>{result.score >= 80 ? 'Excellent Mastery!' : 'Keep Practicing!'}</div>
                    </div>

                    <button
                        onClick={onClose}
                        className="edu-btn edu-btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.125rem' }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '1.5rem 2rem', borderRadius: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A' }}>{generatedQuiz.title || "Assessment"}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {questions.map((_, i) => (
                            <div key={i} style={{
                                width: '2rem', height: '0.25rem', borderRadius: '1rem',
                                background: i === currentIndex ? '#4F46E5' : i < currentIndex ? '#C7D2FE' : '#E2E8F0',
                                transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="edu-btn edu-btn-text" style={{ color: '#64748B' }}>
                    <X size={20} /> <span style={{ marginLeft: '0.5rem' }}>Exit</span>
                </button>
            </header>

            <div style={{ minHeight: '300px' }}>
                <QuestionCard
                    question={currentQuestion}
                    selectedAnswer={answers[currentIndex]}
                    onAnswer={handleAnswer}
                    showAnswer={false} // Interactive mode
                />
            </div>

            <footer style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    disabled={isFirst}
                    className="edu-btn"
                    style={{
                        opacity: isFirst ? 0 : 1,
                        pointerEvents: isFirst ? 'none' : 'auto',
                        background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B'
                    }}
                >
                    <ChevronLeft size={18} style={{ marginRight: '0.5rem' }} /> Previous
                </button>

                {isLast ? (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="edu-btn edu-btn-primary"
                        style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
                    >
                        {submitting ? <Loader2 className="edu-spin" size={18} /> : 'Submit Assessment'}
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className="edu-btn edu-btn-primary"
                    >
                        Next Question <ChevronRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                )}
            </footer>
        </div>
    );
};

export default QuizView;
