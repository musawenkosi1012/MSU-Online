import React from 'react';
import {
    CheckSquare,
    FileText,
    PenTool
} from 'lucide-react';

const QuestionCard = ({ question, showAnswer = false, selectedAnswer, onAnswer }) => {
    return (
        <div className="edu-card-interactive edu-rotate-in edu-shimmer" style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '0.75rem' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                    {question.type === 'mcq' ? <CheckSquare size={16} color="#A855F7" /> :
                        question.type === 'essay' ? <FileText size={16} color="#F97316" /> :
                            <PenTool size={16} color="#10B981" />}
                    <span>{question.type === 'mcq' ? 'Multiple Choice' : question.type === 'essay' ? 'Essay' : 'Short Answer'}</span>
                    <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '999px', color: '#475569' }}>Difficulty: {question.difficulty}</span>
                </div>
            </div>
            <p style={{ color: '#1E293B', fontWeight: '500', marginBottom: '0.75rem' }}>{question.question_text}</p>

            {question.type === 'mcq' && question.options && (
                <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {JSON.parse(question.options).map((opt, idx) => {
                        const isSelected = String(idx) === String(selectedAnswer);
                        return (
                            <div
                                key={idx}
                                onClick={() => !showAnswer && onAnswer && onAnswer(idx)}
                                style={{
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: showAnswer && opt === question.correct_answer ? '#166534' : isSelected ? '#4F46E5' : '#64748B',
                                    fontWeight: (showAnswer && opt === question.correct_answer) || isSelected ? '700' : '400',
                                    cursor: showAnswer ? 'default' : 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    background: isSelected ? '#EEF2FF' : 'transparent',
                                    transition: 'all 0.2s'
                                }}>
                                <div style={{
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    borderRadius: '50%',
                                    border: '1px solid',
                                    borderColor: showAnswer && opt === question.correct_answer ? '#22C55E' : isSelected ? '#4F46E5' : '#CBD5E1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    background: showAnswer && opt === question.correct_answer ? '#F0FDF4' : isSelected ? '#4F46E5' : 'transparent',
                                    color: isSelected && !showAnswer ? '#FFFFFF' : 'inherit'
                                }}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                {opt} {showAnswer && String(idx) === String(question.correct_index) && '(Correct)'}
                            </div>
                        );
                    })}
                </div>
            )}

            {question.type !== 'mcq' && !showAnswer && (
                <textarea
                    rows={4}
                    placeholder="Type your answer here..."
                    value={selectedAnswer || ''}
                    onChange={(e) => onAnswer && onAnswer(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', marginTop: '0.5rem', fontFamily: 'inherit' }}
                />
            )}
        </div>
    );
};

export default QuestionCard;
