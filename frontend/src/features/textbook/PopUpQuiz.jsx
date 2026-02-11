import React, { useState } from 'react';
import { CheckCircle2, XCircle, Trophy, RefreshCcw, ArrowRight } from 'lucide-react';

const PopUpQuiz = ({ questions, onComplete, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const currentQ = questions[currentIndex];

    // Safety check
    if (!questions || questions.length === 0) return null;

    const handleAnswer = (optionIndex) => {
        if (isAnswered) return;
        setSelectedOption(optionIndex);
        setIsAnswered(true);

        if (optionIndex === currentQ.correct_index) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    const passed = score >= Math.ceil(questions.length * 0.6); // 60% pass rate

    if (showResult) {
        return (
            <div className="edu-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                <div className="edu-animate-in" style={{ background: '#FFFFFF', padding: '3rem', borderRadius: '1.5rem', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                    <div style={{ width: '80px', height: '80px', background: passed ? '#DCFCE7' : '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        {passed ? <Trophy size={40} color="#16A34A" /> : <RefreshCcw size={40} color="#DC2626" />}
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem' }}>
                        {passed ? "Section Mastered!" : "Keep Practicing"}
                    </h2>

                    <p style={{ color: '#64748B', fontWeight: '500', marginBottom: '2rem' }}>
                        You scored {score} out of {questions.length}.
                        {passed ? " Great job understanding the core concepts." : " Review the section and try again to improve your GPA."}
                    </p>

                    <button
                        onClick={() => passed ? onComplete(score) : onClose()}
                        style={{ width: '100%', padding: '1rem', background: passed ? '#4F46E5' : '#F1F5F9', color: passed ? '#FFFFFF' : '#475569', border: 'none', borderRadius: '1rem', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}
                    >
                        {passed ? "Continue & Update GPA" : "Review Section"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="edu-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div className="edu-animate-in" style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '1.5rem', maxWidth: '600px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Knowledge Check</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B' }}>Question {currentIndex + 1} of {questions.length}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><XCircle size={24} /></button>
                </header>

                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#334155', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {currentQ.question}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {currentQ.options.map((opt, idx) => {
                        let bgColor = '#F8FAFC';
                        let borderColor = '#E2E8F0';
                        let textColor = '#475569';

                        if (isAnswered) {
                            if (idx === currentQ.correct_index) {
                                bgColor = '#DCFCE7'; borderColor = '#16A34A'; textColor = '#166534';
                            } else if (idx === selectedOption) {
                                bgColor = '#FEE2E2'; borderColor = '#EF4444'; textColor = '#991B1B';
                            }
                        } else if (idx === selectedOption) {
                            bgColor = '#EEF2FF'; borderColor = '#4F46E5';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={isAnswered}
                                style={{
                                    padding: '1rem 1.5rem', textAlign: 'left', borderRadius: '1rem',
                                    background: bgColor, border: `2px solid ${borderColor}`, color: textColor,
                                    fontWeight: '600', cursor: isAnswered ? 'default' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={nextQuestion}
                            className="edu-animate-in"
                            style={{
                                padding: '0.75rem 2rem', background: '#0F172A', color: '#FFFFFF',
                                border: 'none', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PopUpQuiz;
