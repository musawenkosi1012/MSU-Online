import React from 'react';
import { Trophy, Clock, Target } from 'lucide-react';

const CourseOverview = ({ course, gpaData, mastery, onLaunchMSUAI, onEnroll }) => {
    if (!course) return null;

    return (
        <div className="edu-animate-in" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="edu-card edu-rotate-in" style={{ padding: '2.5rem' }}>

                    <h2 style={{ fontSize: '2.25rem', marginBottom: '1.5rem' }}>Welcome to {course.title}</h2>
                    <p style={{ fontSize: '1.125rem', color: 'var(--edu-indigo)', lineHeight: '1.8' }}>{course.description}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ background: 'var(--edu-indigo)', color: '#FFFFFF', padding: '2rem', borderRadius: '2rem', boxShadow: '0 20px 25px -5px rgba(79,68,229,0.2)' }}>
                        <Trophy size={32} style={{ marginBottom: '1rem' }} />
                        <h4 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Academic GPA</h4>
                        <p style={{ opacity: 0.8, fontWeight: '500' }}>Grade: {gpaData.letter_grade} ({gpaData.gpa})</p>
                    </div>
                    <div className="edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '2rem', border: '1px solid #F1F5F9' }}>
                        <Clock size={32} color="#F59E0B" style={{ marginBottom: '1rem' }} />
                        <h4 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Mastery Level</h4>
                        <p style={{ color: '#64748B', fontWeight: '500' }}>{mastery}% Knowledge Retention</p>
                    </div>

                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="edu-card edu-rotate-in" style={{ padding: '2rem' }}>

                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Target color="#A855F7" /> Academic Roadmap
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {course.modules && course.modules.length > 0 ? (
                            course.modules.slice(0, 5).map((mod, i) => (
                                <div key={mod.id || i} style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '2rem', height: '2rem', background: i === 0 ? '#4F46E5' : '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: i === 0 ? '#FFFFFF' : '#64748B', flexShrink: 0 }}>{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1E293B' }}>{mod.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{mod.duration || 'Flexible duration'}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            [1, 2, 3].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '2rem', height: '2rem', background: i === 1 ? '#4F46E5' : '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: i === 1 ? '#FFFFFF' : '#64748B', flexShrink: 0 }}>{i}</div>
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '0.875rem' }}>Module {i}: {i === 1 ? 'Fundamentals & Scoping' : i === 2 ? 'Deep Architecture' : 'Production Scaling'}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{i === 1 ? 'Phase Complete' : 'Next in Roadmap'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {!course.enrolled ? (
                    <button
                        onClick={() => onEnroll(course.id)}
                        className="edu-btn edu-btn-primary"
                        style={{ padding: '1.25rem', borderRadius: '1.5rem', background: 'var(--edu-emerald)' }}
                    >
                        Enroll in Course
                    </button>
                ) : (
                    <button
                        onClick={onLaunchMSUAI}
                        className="edu-btn edu-btn-primary"
                        style={{ padding: '1.25rem', borderRadius: '1.5rem' }}
                    >
                        Launch Musa Session
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseOverview;
