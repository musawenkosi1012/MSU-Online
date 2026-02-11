import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Clock, CheckCircle2, Lock, Play, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TopicTile Component
 * Tracks scroll depth and time spent for deterministic progress calculation.
 * Sends progress data to backend on tile close.
 */
const TopicTile = ({ topic, onExerciseStart, authToken }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [scrollDepth, setScrollDepth] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [exerciseUnlocked, setExerciseUnlocked] = useState(false);
    const [readProgress, setReadProgress] = useState(0);
    const [mastery, setMastery] = useState(0);
    const [completed, setCompleted] = useState(false);

    const contentRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Start timer when expanded
    useEffect(() => {
        if (isExpanded) {
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;
                setTimeSpent(elapsed);
            }, 1000);
        } else {
            // Stop timer and send progress when collapsed
            if (timerRef.current) {
                clearInterval(timerRef.current);
                sendProgress();
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isExpanded]);

    // Track scroll depth
    const handleScroll = (e) => {
        const element = e.target;
        const scrollPercent = element.scrollTop / (element.scrollHeight - element.clientHeight);
        setScrollDepth(Math.min(scrollPercent, 1.0));
    };

    // Send progress to backend
    const sendProgress = async () => {
        if (!authToken) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/topics/${topic.topic_id}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    scroll_depth: scrollDepth,
                    time_spent: timeSpent,
                    min_time: topic.estimated_time * 60 // Convert minutes to seconds
                })
            });

            if (res.ok) {
                const data = await res.json();
                setReadProgress(data.read_progress);
                setMastery(data.mastery);
                setCompleted(data.completed);
                setExerciseUnlocked(data.exercise_unlocked);

                // Log activity if some progress made
                if (scrollDepth > 0.1 || timeSpent > 30) {
                    fetch(`${import.meta.env.VITE_API_BASE}/api/progress/activity`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    }).catch(e => { });
                }
            }
        } catch (err) {
            console.error("Error sending progress:", err);
        }
    };

    const isExercise = topic.type === 'exercise';
    const progressPercent = Math.round(readProgress * 100);
    const masteryPercent = Math.round(mastery * 100);

    return (
        <div
            className="edu-card edu-card-interactive"
            style={{
                padding: 0,
                overflow: 'hidden',
                border: completed ? '2px solid #10B981' : '1px solid #F1F5F9'
            }}
        >
            {/* Tile Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? '#F8FAFC' : '#FFFFFF'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: isExercise ? '#FEF3C7' : '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {isExercise ? <Play color="#F59E0B" size={24} /> : <BookOpen color="var(--edu-indigo)" size={24} />}
                    </div>
                    <div>
                        <h4 style={{ fontWeight: '800', color: '#1E293B', marginBottom: '0.25rem' }}>{topic.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748B' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} /> {topic.estimated_time} min
                            </span>
                            {completed && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981' }}>
                                    <CheckCircle2 size={12} /> Completed
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Mastery indicator */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Mastery</div>
                        <div style={{ fontSize: '1rem', fontWeight: '900', color: masteryPercent >= 75 ? '#10B981' : '#1E293B' }}>
                            {masteryPercent}%
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div>
                    {/* Progress bar */}
                    <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ color: '#64748B' }}>Reading Progress</span>
                            <span style={{ fontWeight: '700' }}>{progressPercent}%</span>
                        </div>
                        <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                            <div style={{
                                width: `${progressPercent}%`,
                                height: '100%',
                                background: progressPercent >= 80 ? '#10B981' : 'var(--edu-indigo)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>

                    {/* Learning Outcomes */}
                    <div
                        ref={contentRef}
                        onScroll={handleScroll}
                        style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '1rem 1.5rem',
                            background: '#FAFAFA'
                        }}
                    >
                        <h5 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                            Learning Outcomes
                        </h5>
                        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            {topic.learning_outcomes?.map((outcome, i) => (
                                <li key={i} style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                                    {outcome}
                                </li>
                            ))}
                        </ul>

                        {/* Placeholder content for scrolling */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.6' }}>
                                Read through the topic content to unlock the exercise. Your progress is tracked based on scroll depth and time spent.
                            </p>
                        </div>
                    </div>

                    {/* Exercise Button */}
                    {isExercise && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
                            <button
                                onClick={() => exerciseUnlocked && onExerciseStart?.(topic.topic_id)}
                                disabled={!exerciseUnlocked}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    background: exerciseUnlocked ? 'linear-gradient(135deg, #10B981, #059669)' : '#E2E8F0',
                                    color: exerciseUnlocked ? '#FFFFFF' : '#94A3B8',
                                    fontWeight: '800',
                                    cursor: exerciseUnlocked ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {exerciseUnlocked ? (
                                    <>
                                        <Play size={18} /> Start Exercise
                                    </>
                                ) : (
                                    <>
                                        <Lock size={18} /> Complete Reading First (80%)
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TopicTile;
