import React from 'react';
import {
    Layout,
    Trophy,
    Target,
    Clock,
    ArrowRight,
    BookOpen,
    TrendingUp,
    Zap,
    GraduationCap
} from 'lucide-react';
import { useGpaScale } from '../../hooks/useGpaScale';
import { getMasteryBadge } from '../../shared/utils/mastery';
import GradingBreakdown from '../assessment/GradingBreakdown';
import { API_BASE } from '../../shared/utils/api';

const StudentDashboard = ({ currentUser, gpaData, gradeHistory, gradeScale, modelStatus, mastery, courses, setActiveTab, gradingBreakdown, streak, nextTopic }) => {
    const { formatGpa, getGradeLabel } = useGpaScale();
    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* ... header ... */}
            <header style={{
                background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-indigo-dark))',
                padding: '3rem',
                borderRadius: '3rem',
                color: '#FFFFFF',
                boxShadow: '0 20px 40px -15px var(--edu-indigo-glow)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: modelStatus?.loaded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '999px',
                        marginBottom: '1.5rem',
                        border: `1px solid ${modelStatus?.loaded ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        transition: 'all 0.3s'
                    }}>
                        {modelStatus?.loaded ? <Zap size={14} color="#34D399" /> : <Clock size={14} color="#F87171" className="edu-spin-slow" />}
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {modelStatus?.loaded ? 'MSU Intelligence Active' : 'Connecting to Neural Core...'}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>
                        Welcome back, {currentUser?.full_name || 'Scholar'}!
                    </h1>
                    <p style={{ fontSize: '1.125rem', opacity: 0.9, fontWeight: '500', maxWidth: '600px' }}>
                        You're making excellent progress this term. Your MSU academic roadmap is 100% synced.
                    </p>
                </div>
                {/* Decorative Orbs */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div className="edu-card edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="edu-icon-wrapper" style={{ width: '64px', height: '64px', background: 'var(--edu-indigo-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy color="#4F46E5" size={32} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current GPA</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#1E293B' }}>{formatGpa(gpaData.gpa)}</h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981' }}>Grade: {getGradeLabel(gpaData.gpa)}</span>
                    </div>
                </div>

                <div className="edu-card edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', animationDelay: '0.1s' }}>
                    <div className="edu-icon-wrapper" style={{ width: '64px', height: '64px', background: '#FFF7ED', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap color="#F97316" size={32} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Streak</p>
                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#1E293B' }}>{streak || modelStatus.metrics?.streak_stats?.current_streak || 0} Days</h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F97316' }}>Daily Activity</span>
                    </div>
                </div>

                <div className="edu-card edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', animationDelay: '0.2s' }}>
                    <div className="edu-icon-wrapper" style={{ width: '64px', height: '64px', background: getMasteryBadge(mastery).bg, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {React.createElement(getMasteryBadge(mastery).icon, { color: getMasteryBadge(mastery).color, size: 32 })}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mastery Rank</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>{getMasteryBadge(mastery).label}</h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: getMasteryBadge(mastery).color }}>
                            {getMasteryBadge(mastery).description}
                        </span>
                    </div>
                </div>
            </div>

            {/* Attendance Calendar */}
            <div className="edu-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0F172A', marginBottom: '1.5rem' }}>Activity Log</h3>
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (29 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        const activity = modelStatus.metrics?.streak_stats?.daily_activity?.[dateStr];
                        const intensity = activity ? Math.min(activity.total_queries / 10, 1) : 0;

                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <div
                                    title={`${dateStr}: ${activity?.total_queries || 0} queries`}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        background: 'var(--edu-indigo-light)',
                                        border: intensity > 0 ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid #E2E8F0'
                                    }}
                                />
                                <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>{date.getDate()}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <GradingBreakdown breakdown={gradingBreakdown} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A' }}>Grade Intelligence</h2>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B' }}>Synced from Registrar</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {gradeHistory.length > 0 ? (
                            gradeHistory.map((course, idx) => (
                                <div key={idx} className="edu-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontWeight: '800', color: '#1E293B' }}>{course.title}</h4>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Semester Result • Verified</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--edu-indigo)' }}>{course.grade}</div>
                                        <div style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94A3B8' }}>{course.credits} CREDITS</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="edu-card" style={{ padding: '2rem', textAlign: 'center', border: '2px dashed #E2E8F0', background: 'transparent' }}>
                                <p style={{ color: '#94A3B8', fontWeight: '600' }}>No verification records found.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '1.5rem' }}>Scale & Insights</h2>
                    <div className="edu-card edu-rotate-in" style={{ padding: '2rem', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Academic Grading Scale</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {Object.entries(gradeScale).map(([grade, value]) => (
                                    <div key={grade} style={{ textAlign: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #F1F5F9' }}>
                                        <div style={{ fontWeight: '900', color: '#1E293B' }}>{grade}</div>
                                        <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {nextTopic && (
                            <div style={{ background: '#F5F3FF', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #EDE9FE' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                    <TrendingUp size={20} color="#4F46E5" style={{ flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>AI Recommendation</p>
                                        <p style={{ fontSize: '0.875rem', color: '#312E81', fontWeight: '700', lineHeight: '1.5' }}>
                                            "{nextTopic.recommendation || `Based on your mastery of ${nextTopic.mastered_topic || 'previous lessons'}, Musa recommends you tackle ${nextTopic.next_topic} next.`}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!nextTopic && (
                            <div style={{ background: '#F5F3FF', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid #EDE9FE' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                                    <TrendingUp size={20} color="#4F46E5" style={{ flexShrink: 0 }} />
                                    <p style={{ fontSize: '0.875rem', color: '#312E81', fontWeight: '700', lineHeight: '1.5' }}>
                                        "Your current trajectory suggests an A- in Advanced Databases if consistency remains above 85%."
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

        </div>
    );
};

export default StudentDashboard;
