import React, { useState, useEffect } from 'react';
import {
    Compass,
    Search,
    Sparkles,
    Globe,
    TrendingUp,
    History,
    Loader2,
    ArrowUpRight,
    SearchCheck,
    BookOpen,
    FileText,
    Clock,
    Hash,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { API_BASE } from '../../shared/utils/api';

const ResearchHub = ({ isResearchMode, setIsResearchMode, handleSendMessage, chatHistory, aiLoading }) => {
    const [query, setQuery] = useState('');
    const [researchCache, setResearchCache] = useState([]);
    const [cacheLoading, setCacheLoading] = useState(false);

    // Deep Essay State
    const [essayData, setEssayData] = useState(null);
    const [essayLoading, setEssayLoading] = useState(false);
    const [essayError, setEssayError] = useState(null);
    const [showSources, setShowSources] = useState(false);

    useEffect(() => {
        fetchCache();
    }, []);

    const fetchCache = async () => {
        setCacheLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/research/cache`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setResearchCache(data.cache || []);
        } catch (err) {
            console.error("Error fetching research cache", err);
        } finally {
            setCacheLoading(false);
        }
    };

    const handleClearCache = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/research/cache`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setResearchCache([]);
        } catch (err) {
            console.error("Error clearing research cache", err);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        handleSendMessage(query, true);
        setQuery('');
        setTimeout(fetchCache, 3000);
    };

    const handleDeepEssay = async (topicOverride = null) => {
        const topic = topicOverride || query;
        if (!topic.trim() || essayLoading) return;

        setEssayLoading(true);
        setEssayError(null);
        setEssayData(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/research/deep-essay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: topic, style: 'academic' })
            });

            if (!res.ok) throw new Error(`Server responded with ${res.status} `);

            const data = await res.json();

            if (data.error) {
                setEssayError(data.error);
            } else {
                setEssayData(data);
            }
        } catch (err) {
            console.error("Deep essay error:", err);
            setEssayError(err.message || "Failed to generate essay. Please try again.");
        } finally {
            setEssayLoading(false);
        }
    };

    const suggestedTopics = researchCache.length > 0
        ? researchCache.slice(0, 4).map(c => c.topic)
        : [
            "Impact of Quantum Computing on Cryptography",
            "Recent breakthroughs in Database Indexing",
            "Ethics of Generative AI in Academia",
            "Distributed Systems Consensus Algorithms"
        ];

    // Simple markdown renderer for the essay content
    const renderMarkdown = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        const elements = [];
        let i = 0;

        for (const line of lines) {
            i++;
            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} style={{ fontSize: '2rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem', marginTop: '2rem', letterSpacing: '-0.02em' }}>{line.slice(2)}</h1>);
            } else if (line.startsWith('## ')) {
                elements.push(<h2 key={i} style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.75rem', marginTop: '2rem', paddingBottom: '0.5rem', borderBottom: '2px solid #EDE9FE' }}>{line.slice(3)}</h2>);
            } else if (line.startsWith('### ')) {
                elements.push(<h3 key={i} style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', marginTop: '1.5rem' }}>{line.slice(4)}</h3>);
            } else if (line.startsWith('- [')) {
                const linkMatch = line.match(/- \[(.+?)\]\((.+?)\)/);
                if (linkMatch) {
                    elements.push(
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', paddingLeft: '1rem' }}>
                            <ExternalLink size={14} color="var(--edu-indigo)" />
                            <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--edu-indigo)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>{linkMatch[1]}</a>
                        </div>
                    );
                } else {
                    elements.push(<li key={i} style={{ color: '#475569', lineHeight: '1.8', marginLeft: '1.5rem', marginBottom: '0.25rem' }}>{line.slice(2)}</li>);
                }
            } else if (line.trim() === '') {
                elements.push(<div key={i} style={{ height: '0.5rem' }} />);
            } else {
                elements.push(<p key={i} style={{ color: '#334155', lineHeight: '1.9', fontSize: '1.05rem', marginBottom: '0.5rem', fontFamily: "'Inter', 'Georgia', serif" }}>{line}</p>);
            }
        }
        return elements;
    };

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#F5F3FF', padding: '0.75rem 1.5rem', borderRadius: '999px', border: '1px solid #EDE9FE', marginBottom: '2rem' }}>
                    <Sparkles color="var(--edu-indigo)" size={20} />
                    <span style={{ fontWeight: '800', color: 'var(--edu-indigo)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Autonomous Research Engine</span>
                </div>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Explore Global Knowledge</h1>
                <p style={{ fontSize: '1.25rem', color: '#64748B', fontWeight: '500', maxWidth: '700px', margin: '0 auto 3rem' }}>
                    MSU deep researches the web to synthesize verified intelligence for your academic inquiries.
                </p>

                <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="edu-card" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)', borderRadius: '1.5rem' }}>
                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search color="#94A3B8" size={24} style={{ position: 'absolute', left: '1.5rem' }} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What would you like Musa to deep research?"
                                style={{ width: '100%', padding: '1.5rem 1.5rem 1.5rem 4rem', border: 'none', background: 'transparent', outline: 'none', fontSize: '1.25rem', fontWeight: '500' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={aiLoading}
                            style={{
                                background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-indigo-dark))',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0 2rem',
                                borderRadius: '1rem',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {aiLoading ? <Loader2 className="edu-spin" size={18} /> : <SearchCheck size={18} />}
                            {aiLoading ? 'Searching...' : 'Quick Search'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeepEssay()}
                            disabled={essayLoading || !query.trim()}
                            style={{
                                background: essayLoading
                                    ? 'linear-gradient(135deg, #6366F1, var(--edu-indigo))'
                                    : 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '0 2rem',
                                borderRadius: '1rem',
                                fontWeight: '900',
                                cursor: essayLoading || !query.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                opacity: !query.trim() ? 0.5 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {essayLoading ? <Loader2 className="edu-spin" size={18} /> : <BookOpen size={18} />}
                            {essayLoading ? 'Generating...' : 'Deep Essay'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Essay Loading Indicator */}
            {
                essayLoading && (
                    <div className="edu-card edu-animate-in" style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', borderRadius: '1.5rem', border: '2px solid #DDD6FE' }}>
                        <Loader2 className="edu-spin" size={48} color="#7C3AED" style={{ margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#5B21B6', marginBottom: '0.75rem' }}>Synthesizing Deep Essay</h3>
                        <p style={{ color: '#7C3AED', fontWeight: '500', fontSize: '1rem' }}>
                            Musa is scraping the web, cross-verifying sources, and writing a comprehensive 5000+ word academic essay. This may take 1-2 minutes...
                        </p>
                        <div style={{ margin: '1.5rem auto 0', width: '200px', height: '4px', borderRadius: '2px', background: '#DDD6FE', overflow: 'hidden' }}>
                            <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #7C3AED, var(--edu-indigo))', borderRadius: '2px', animation: 'pulse 2s ease-in-out infinite' }} />
                        </div>
                    </div>
                )
            }

            {/* Essay Error */}
            {
                essayError && (
                    <div className="edu-card edu-animate-in" style={{ padding: '2rem', background: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: '1rem' }}>
                        <p style={{ color: '#DC2626', fontWeight: '700', fontSize: '1rem' }}>⚠ Essay Generation Failed</p>
                        <p style={{ color: '#991B1B', marginTop: '0.5rem' }}>{essayError}</p>
                    </div>
                )
            }

            {/* Deep Essay Result */}
            {
                essayData && (
                    <div className="edu-card edu-animate-in" style={{ padding: '0', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 60px -15px rgba(79,70,229,0.15)' }}>
                        {/* Essay Header */}
                        <div style={{ background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-purple))', padding: '2rem 3rem', color: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <BookOpen size={24} />
                                <span style={{ fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.9 }}>Deep Research Essay</span>
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '1rem' }}>{essayData.query}</h2>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                                    <Hash size={16} />
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{essayData.word_count?.toLocaleString()} words</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                                    <FileText size={16} />
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{essayData.sources?.length || 0} sources</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                                    <Clock size={16} />
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Academic Style</span>
                                </div>
                            </div>
                        </div>

                        {/* Essay Body */}
                        <div style={{ padding: '3rem', background: '#FFFFFF' }}>
                            <div style={{ maxWidth: '750px', margin: '0 auto' }}>
                                {renderMarkdown(essayData.content)}
                            </div>
                        </div>

                        {/* Sources Panel */}
                        {essayData.sources && essayData.sources.length > 0 && (
                            <div style={{ borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                                <button
                                    onClick={() => setShowSources(!showSources)}
                                    style={{ width: '100%', padding: '1.25rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Globe size={18} color="var(--edu-indigo)" />
                                        <span style={{ fontWeight: '800', color: 'var(--edu-indigo)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            {essayData.sources.length} Verified Sources
                                        </span>
                                    </div>
                                    {showSources ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                                </button>
                                {showSources && (
                                    <div style={{ padding: '0 3rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {essayData.sources.map((s, i) => (
                                            <a
                                                key={i}
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E2E8F0', textDecoration: 'none', transition: 'border-color 0.2s' }}
                                            >
                                                <ExternalLink size={14} color="var(--edu-indigo)" />
                                                <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '0.9rem', flex: 1 }}>{s.title || 'Source'}</span>
                                                <span style={{ color: '#94A3B8', fontSize: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Suggested Topics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {suggestedTopics.map((topic, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setQuery(topic);
                            handleDeepEssay(topic);
                        }}
                        className="edu-card-interactive edu-rotate-in"
                        style={{ padding: '1.5rem', textAlign: 'left', background: '#FFFFFF', cursor: 'pointer', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                    >
                        <div>
                            <span style={{ fontWeight: '700', fontSize: '0.875rem', lineHeight: '1.5', color: '#1E293B' }}>{topic}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                                <BookOpen size={12} color="#7C3AED" />
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deep Essay</span>
                            </div>
                        </div>
                        <ArrowUpRight size={16} color="var(--edu-indigo)" />
                    </button>
                ))}
            </div>

            {/* Research Cache */}
            {
                researchCache.length > 0 && (
                    <section style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <History size={20} color="#64748B" />
                                <h3 style={{ fontWeight: '800', color: '#64748B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Recent Syntheses</h3>
                            </div>
                            <button
                                onClick={handleClearCache}
                                style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            >
                                Clear History
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {researchCache.slice(0, 3).map((item, i) => (
                                <div key={i} className="edu-card edu-rotate-in" style={{ padding: '2rem', background: '#FFFFFF', borderLeft: '4px solid #EDE9FE' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Globe size={18} color="var(--edu-indigo)" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--edu-indigo)' }}>{item.url.toUpperCase()}</span>
                                    </div>
                                    <p style={{ lineHeight: '1.8', color: '#64748B', fontWeight: '500', fontSize: '0.925rem' }}>{item.title}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Quick Search Chat Results */}
            {
                chatHistory.length > 0 && (
                    <section style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Sparkles size={20} color="var(--edu-indigo)" />
                            <h3 style={{ fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Deep Intelligence Report</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {chatHistory.filter(m => m.role === 'ai').slice(-1).map((msg, i) => (
                                <div key={i} className="edu-card edu-rotate-in" style={{ padding: '3rem', background: '#FFFFFF', borderLeft: '6px solid var(--edu-indigo)', borderRadius: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                        <Globe size={24} color="var(--edu-indigo)" />
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--edu-indigo)', letterSpacing: '0.05em' }}>SYNTHESIZED SCHOLARLY DATA</span>
                                    </div>
                                    <div style={{
                                        lineHeight: '1.8',
                                        color: '#1E293B',
                                        fontWeight: '500',
                                        fontSize: '1.1rem',
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        {msg.text}
                                    </div>
                                    <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #F1F5F9' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Research Note</p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.6' }}>
                                            This report was synthesized by Musa using deep-web scraping and cross-verification from academic repositories. Word counts and depth are optimized for academic rigor.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }

        </div >
    );
};

export default ResearchHub;
