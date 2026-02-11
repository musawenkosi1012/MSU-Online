import React, { useState } from 'react';
import { Library, Database, FileText, Play, Link as LinkIcon, Search, Sparkles, Loader2 } from 'lucide-react';
import QuestionCard from '../assessment/QuestionCard';

const RepositoryView = ({ repository }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/content/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Search Hub */}
            <section className="edu-card edu-rotate-in" style={{ padding: '2rem', background: 'linear-gradient(135deg, #4F46E5, #3730A3)', color: '#FFFFFF' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Search size={32} />
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Global Knowledge Hub</h2>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Search through course materials and verified AI research.</p>
                    </div>
                </div>
                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search for concepts, definitions, or research..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', borderRadius: '1.25rem', border: 'none', background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', backdropFilter: 'blur(10px)', outline: 'none', fontSize: '1.125rem' }}
                    />
                    <button type="submit" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: '#FFFFFF', color: 'var(--edu-indigo)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isSearching ? <Loader2 className="edu-spin" size={18} /> : <Search size={18} />}
                        Explore
                    </button>
                </form>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
                {searchResults.length > 0 && (
                    <section style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <Sparkles size={24} color="#F59E0B" />
                            <h2 style={{ fontSize: '1.5rem' }}>AI Research Insights</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {searchResults.map((res, i) => (
                                <div key={i} className="edu-card edu-card-interactive edu-rotate-in edu-shimmer edu-float" style={{ padding: '1.5rem', borderLeft: '4px solid #F59E0B' }}>

                                    <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>{res.title}</h4>
                                    <p style={{ fontSize: '0.875rem', color: '#64748B' }}>{res.content_clean.substring(0, 150)}...</p>
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#F59E0B' }}>VERIFIED BY MUSA</span>
                                        <a href={res.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--edu-indigo)', fontWeight: '700' }}>Reference Source</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Library size={24} color="#4F46E5" />
                        <h2 style={{ fontSize: '1.5rem' }}>Knowledge Artifacts</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {repository.materials.map(mat => (
                            <div key={mat.id} className="edu-card edu-card-interactive edu-rotate-in edu-shimmer" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="edu-icon-wrapper" style={{ width: '40px', height: '40px', background: '#F5F3FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {mat.type === 'pdf' ? <FileText color="#4F46E5" /> : <LinkIcon color="#4F46E5" />}
                                    </div>

                                    <div>
                                        <p style={{ fontWeight: '700' }}>{mat.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{mat.type === 'pdf' ? 'Extracted Text Archive' : 'External Intelligence'}</p>
                                    </div>
                                </div>
                                <button style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', cursor: 'pointer' }}><Play size={16} color="#4F46E5" /></button>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Database size={24} color="#10B981" />
                        <h2 style={{ fontSize: '1.5rem' }}>Question Intelligence</h2>
                    </div>
                    <div>
                        {repository.questions.map(q => <QuestionCard key={q.id} question={q} />)}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default RepositoryView;
