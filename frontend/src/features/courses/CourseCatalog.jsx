import React, { useState } from 'react';
import IconMap from '../../shared/components/IconMap';
import { Sparkles, Filter, Search } from 'lucide-react';

const CourseCatalog = ({ currentUser, courses, featuredCourses, categories, activeCategory, searchQuery, onSelectCategory, onSearch, onSelectCourse, onEnroll }) => {
    // Backend filtering integrated via App.jsx props
    const filteredCourses = courses;

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '0.5rem' }}>Good afternoon, {currentUser.full_name}</h1>
                    <p style={{ fontSize: '1.25rem', color: '#64748B', fontWeight: '500' }}>Your personalized academic roadmap is ready for exploration.</p>
                </div>

                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search for courses, technologies..."
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: '1.25rem',
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s'
                        }}
                    />
                </div>
            </header>

            {featuredCourses.length > 0 && activeCategory === 'All' && (
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Sparkles color="#4F46E5" size={20} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B' }}>Featured for You</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                        {featuredCourses.map(course => (
                            <div
                                key={course.id}
                                className="edu-card edu-card-interactive"
                                style={{
                                    padding: '2rem',
                                    background: 'linear-gradient(135deg, #FFFFFF, #F5F3FF)',
                                    border: '1px solid #EDE9FE',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onClick={() => onSelectCourse(course.id)}
                            >
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>{course.category}</p>
                                </div>
                                <div style={{ background: '#4F46E5', color: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800' }}>
                                    ADAPTIVE XP
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', marginRight: '0.5rem' }}>
                        <Filter size={16} /> <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>Filter</span>
                    </div>
                    {['All', ...categories].map(cat => (
                        <button
                            key={cat}
                            onClick={() => onSelectCategory(cat)}
                            style={{
                                padding: '0.625rem 1.25rem',
                                borderRadius: '999px',
                                background: activeCategory === cat ? 'var(--edu-indigo)' : '#FFFFFF',
                                color: activeCategory === cat ? '#FFFFFF' : '#64748B',
                                border: '1px solid',
                                borderColor: activeCategory === cat ? 'var(--edu-indigo)' : '#E2E8F0',
                                fontWeight: '700',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {filteredCourses.map(course => (
                        <div key={course.id} className="edu-card edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => onSelectCourse(course.id)}>
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div className="edu-icon-wrapper" style={{ width: '56px', height: '56px', background: '#F5F3FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconMap name={course.category || 'Database'} className="lucide-icon" style={{ color: 'var(--edu-indigo)' }} />
                                    </div>
                                    {course.enrolled && <span style={{ background: '#ECFDF5', color: '#10B981', padding: '4px 12px', borderRadius: '999px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Enrolled</span>}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                                    <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: '1.6' }}>{course.shortDescription}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '24px', height: '24px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{course.instructor?.avatar || '🎓'}</div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>{course.instructor?.name || 'MSU AI'}</span>
                                    </div>
                                    {!course.enrolled && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEnroll(course.id); }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'var(--edu-indigo)',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '800',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Enroll
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};


export default CourseCatalog;
