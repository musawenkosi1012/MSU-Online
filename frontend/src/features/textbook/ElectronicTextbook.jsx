import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen,
    ChevronRight,
    MessageSquare,
    Send,
    Loader2,
    Sparkles,
    CheckCircle2,
    History,
    Menu,
    X,
    Lock,
    Volume2,
    Play,
    Terminal,
    AlertCircle,
    Code,
    Cpu,
    Save,
    PenTool
} from 'lucide-react';

import TextbookEditor from './TextbookEditor';
import PopUpQuiz from './PopUpQuiz';
import ChapterExercises from './ChapterExercises';

const ElectronicTextbook = ({ courseId, onBack, onProgressUpdate }) => {

    // --- State ---
    const [textbook, setTextbook] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState(null);
    const [isQuizLoading, setIsQuizLoading] = useState(false);

    const [selectedChapter, setSelectedChapter] = useState(0);
    const [selectedSection, setSelectedSection] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    const [viewMode, setViewMode] = useState('reading'); // 'reading' | 'exercise' | 'final'
    const [chapterStatus, setChapterStatus] = useState({});

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isAILatent, setIsAILatent] = useState(false);
    const chatEndRef = useRef(null);

    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(null);

    // Course Notes State
    const [courseNotes, setCourseNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // --- Derived ---
    const chapters = textbook?.chapters || [];
    const currentChapter = chapters[selectedChapter] || { title: "Untitled", intro: "", sections: [] };
    const sections = currentChapter.sections || [];
    const currentSection = sections[selectedSection] || { title: "Untitled", content: "" };
    const allChaptersComplete = chapters.length > 0 && chapters.every((_, idx) => chapterStatus[idx]?.completed);

    // --- Effects ---
    useEffect(() => {
        fetchTextbook();
        if (courseId) {
            fetchCourseNotes();
        }
    }, [courseId]);

    useEffect(() => {
        if (textbook) {
            fetchChapterStatus();
        }
    }, [textbook]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setAudioUrl(null);
    }, [selectedChapter, selectedSection]);

    // Track reading progress
    useEffect(() => {
        const timer = setTimeout(() => {
            const recordReading = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const topicId = `${courseId}-${selectedChapter}-${selectedSection}`;
                    await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/reading`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            topic_id: topicId,
                            scroll_depth: 1.0,
                            time_spent: 30.0
                        })
                    });
                    if (onProgressUpdate) onProgressUpdate();
                } catch (e) {
                    console.error("Reading tracking error", e);
                }
            };
            recordReading();
        }, 30000);

        return () => clearTimeout(timer);
    }, [selectedChapter, selectedSection, courseId]);

    // --- Data Fetching ---
    const fetchTextbook = async () => {
        if (!courseId || courseId === 'null') return;
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'error') {
                setError(data.message);
            } else {
                setTextbook(data);
            }
        } catch (err) {
            setError("Failed to connect to Nexus intelligence.");
        }
    };

    const fetchChapterStatus = async () => {
        if (!textbook) return;
        try {
            const token = localStorage.getItem('token');
            const totalChapters = textbook.chapters.length;
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/course/${courseId}/chapters?total_chapters=${totalChapters}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const statusObj = {};
            data.forEach(item => { statusObj[item.chapter_index] = item; });
            setChapterStatus(statusObj);
        } catch (err) {
            console.error("Failed to fetch chapter status", err);
        }
    };

    const fetchCourseNotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/notes/?course_id=${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.notes && data.notes.length > 0) {
                setCourseNotes(data.notes[0]);
            } else {
                setCourseNotes('');
            }
        } catch (err) {
            console.error("Failed to fetch course notes", err);
        }
    };

    // --- Handlers ---
    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ course_id: courseId })
            });
            const data = await res.json();
            setTextbook(data);
        } catch (err) {
            setError("Synthesis failed. Please ensure the backend is running.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!courseId) return;
        setIsSavingNotes(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_BASE}/api/notes/?course_id=${courseId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes: courseNotes })
            });
        } catch (err) {
            console.error("Failed to save notes", err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleChapterClick = (cIdx) => {
        const status = chapterStatus[cIdx] || { locked: cIdx > 0 };
        if (status.locked) {
            alert("Please complete the exercises in the previous chapter to unlock this one.");
            return;
        }
        setSelectedChapter(cIdx);
        setSelectedSection(0);
        setViewMode('reading');
    };

    const handleSaveStructure = async (newStructure) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/${courseId}/structure`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newStructure)
            });
            const data = await res.json();
            if (data) {
                setTextbook(data);
                setIsEditing(false);
            }
        } catch (err) {
            alert("Failed to save structure changes.");
        }
    };

    const handleTakeQuiz = async () => {
        setIsQuizLoading(true);
        try {
            const token = localStorage.getItem('token');
            const section = textbook?.chapters[selectedChapter]?.sections[selectedSection];
            if (!section?.content) return;
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/quiz/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ section_content: section.content })
            });
            const data = await res.json();
            setQuizQuestions(data);
        } catch (err) {
            alert("Failed to generate quiz.");
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleQuizComplete = async (score) => {
        setQuizQuestions(null);
        try {
            const token = localStorage.getItem('token');
            const percentage = Math.round((score / 3) * 100);
            const topicId = `${courseId}-${selectedChapter}-${selectedSection}`;
            await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/exercise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic_id: topicId, score: percentage })
            });
            if (onProgressUpdate) onProgressUpdate();
            alert(`Quiz Completed! Mastery recorded.`);
        } catch (err) {
            console.error("Progress Error:", err);
        }
    };

    const handleReadAloud = async () => {
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            return;
        }
        if (audioUrl) {
            audioRef.current.play();
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const section = textbook?.chapters[selectedChapter]?.sections[selectedSection];
            if (!section?.content) return;
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/voice/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: section.content.substring(0, 1000), voice: "p226" })
            });
            const data = await res.json();
            if (data.status === 'success' && data.audio_url) {
                setAudioUrl(data.audio_url);
                setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 100);
            }
        } catch (err) {
            alert("Failed to generating audio narration.");
        }
    };

    const handleSendChat = async () => {
        if (!input.trim() || isAILatent) return;
        const token = localStorage.getItem('token');
        const userMsg = { role: 'user', content: input };
        setChatMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsAILatent(true);
        try {
            const chapter = textbook?.chapters[selectedChapter];
            const section = chapter?.sections[selectedSection];
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    course_id: courseId,
                    chapter_id: chapter.chapter_id,
                    section_title: section.title,
                    query: input
                })
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, { role: 'ai', content: data.response }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'ai', content: "Musa is temporarily unreachable." }]);
        } finally {
            setIsAILatent(false);
        }
    };

    // --- Render Helpers ---
    if (error && !isGenerating) {
        return (
            <div className="edu-animate-in" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '2.5rem', border: '1px solid #F1F5F9' }}>
                <div style={{ width: '80px', height: '80px', background: '#FEE2E2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <BookOpen color="#EF4444" size={40} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '1rem' }}>Electronic Textbook Not Ready</h3>
                <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 2rem', fontWeight: '500' }}>
                    The electronic textbook for this course hasn't been synthesized yet. Click below to start the AI synthesis process.
                </p>
                <button
                    onClick={handleGenerate}
                    style={{ background: 'var(--edu-indigo)', color: '#FFFFFF', border: 'none', padding: '1rem 2rem', borderRadius: '1.25rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 auto' }}
                >
                    <Sparkles size={20} /> Synthesize Textbook
                </button>
            </div>
        );
    }

    if (isGenerating || !textbook) {
        return (
            <div className="edu-animate-in" style={{ padding: '6rem', textAlign: 'center' }}>
                <Loader2 className="edu-spin" color="#4F46E5" size={48} style={{ margin: '0 auto 2rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A', marginBottom: '1rem' }}>Synthesizing Knowledge...</h3>
                <p style={{ color: '#64748B', fontWeight: '500' }}>Musa is organizing your notes and resources into a structured electronic textbook.</p>
            </div>
        );
    }

    if (isEditing) {
        return <TextbookEditor textbook={textbook} onSave={handleSaveStructure} onCancel={() => setIsEditing(false)} />;
    }

    return (
        <div className="edu-animate-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 350px', gap: '1px', background: '#F1F5F9', height: '85vh', borderRadius: '2.5rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>

            {/* Sidebar: Table of Contents */}
            <aside style={{ background: '#F8FAFC', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <header style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Course Scope</h4>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B' }}>{textbook.title || "Untitled Course"}</h3>
                </header>
                <button
                    onClick={() => setIsEditing(true)}
                    style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--edu-indigo)', background: '#EEF2FF', border: '1px solid #4F46E5', borderRadius: '0.5rem', cursor: 'pointer' }}
                >
                    Edit Structure (Tutor)
                </button>
                <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {chapters.map((chapter, cIdx) => (
                        <div key={chapter.chapter_id}>
                            <button
                                onClick={() => handleChapterClick(cIdx)}
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', textAlign: 'left',
                                    background: selectedChapter === cIdx ? '#EEF2FF' : 'transparent',
                                    color: (chapterStatus[cIdx]?.locked && cIdx !== selectedChapter) ? '#CBD5E1' : (selectedChapter === cIdx ? '#4F46E5' : '#64748B'),
                                    fontWeight: '800', cursor: (chapterStatus[cIdx]?.locked && cIdx !== selectedChapter) ? 'not-allowed' : 'pointer', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BookOpen size={16} /> Ch {cIdx + 1}: {chapter.title}
                                </span>
                                {(chapterStatus[cIdx]?.locked && cIdx > 0) ? <Lock size={14} /> : (chapterStatus[cIdx]?.completed && <CheckCircle2 size={14} color="#10B981" />)}
                            </button>
                            {selectedChapter === cIdx && (
                                <div style={{ paddingLeft: '2.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {chapter.sections.map((section, sIdx) => (
                                        <button
                                            key={sIdx}
                                            onClick={() => setSelectedSection(sIdx)}
                                            style={{
                                                width: '100%', padding: '0.5rem', textAlign: 'left', fontSize: '0.8125rem',
                                                color: selectedSection === sIdx ? '#4F46E5' : '#94A3B8',
                                                fontWeight: selectedSection === sIdx ? '900' : '600',
                                                cursor: 'pointer', border: 'none', background: 'none'
                                            }}
                                        >
                                            {section.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Area: Reading View or Exercises */}
            {viewMode === 'exercise' ? (
                <main style={{ background: '#FFFFFF', padding: '0', overflowY: 'auto' }}>
                    <ChapterExercises
                        courseId={courseId}
                        chapterIndex={selectedChapter}
                        chapter={currentChapter}
                        onBack={() => setViewMode('reading')}
                        onComplete={(unlockedNext) => {
                            if (unlockedNext) fetchChapterStatus();
                            setViewMode('reading');
                        }}
                    />
                </main>
            ) : viewMode === 'final' ? (
                <main style={{ background: '#FFFFFF', padding: '0', overflowY: 'auto' }}>
                    <ChapterExercises
                        courseId={courseId}
                        mode="final"
                        chapter={{ title: "Final Comprehensive Exam" }}
                        onBack={() => setViewMode('reading')}
                        onComplete={(passed) => {
                            if (passed) alert("Course Completed!");
                            setViewMode('reading');
                        }}
                    />
                </main>
            ) : (
                <main style={{ background: '#FFFFFF', padding: '3rem', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <header style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--edu-indigo)', fontWeight: '900', fontSize: '0.875rem' }}>
                                    Chapter {selectedChapter + 1} <ChevronRight size={16} /> Section {selectedSection + 1}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={isSavingNotes}
                                        style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.75rem' }}
                                    >
                                        {isSavingNotes ? <Loader2 size={14} className="edu-spin" /> : <Save size={14} />} Save Notes
                                    </button>
                                    <button
                                        onClick={handleReadAloud}
                                        style={{ background: audioUrl ? '#EEF2FF' : 'transparent', color: 'var(--edu-indigo)', border: '1px solid #4F46E5', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.75rem' }}
                                    >
                                        <Volume2 size={14} /> {audioUrl && audioRef.current && !audioRef.current.paused ? "Pause" : "Read"}
                                    </button>
                                </div>
                            </div>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0F172A' }}>{currentSection?.title || "Untitled"}</h2>
                        </header>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', flex: 1, minHeight: 0 }}>
                            <div style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                                {selectedSection === 0 && (
                                    <p style={{ fontStyle: 'italic', color: '#475569', marginBottom: '2rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '1rem', borderLeft: '4px solid var(--edu-indigo)' }}>{currentChapter?.intro}</p>
                                )}
                                <article className="edu-textbook-content" style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#334155' }}>
                                    {(currentSection?.content || "").split('\n\n').map((para, i) => (
                                        <p key={i} style={{ marginBottom: '1.25rem' }}>{para}</p>
                                    ))}
                                </article>
                                {currentSection?.practice_code && (
                                    <div style={{ marginTop: '2.5rem' }}>
                                        <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '1rem' }}>Instructor Reference</h4>
                                        <pre style={{ background: '#1E293B', color: '#E2E8F0', padding: '1.5rem', borderRadius: '1rem', fontSize: '0.875rem', overflowX: 'auto' }}>
                                            <code>{currentSection.practice_code}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E293B', fontWeight: '900', fontSize: '0.875rem' }}>
                                    <PenTool size={18} color="var(--edu-indigo)" /> Course Scratchpad
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>These notes are specific to this course.</p>
                                <textarea
                                    style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1rem', fontSize: '0.875rem', resize: 'none', color: '#334155', outline: 'none' }}
                                    placeholder="Jot down notes for this course..."
                                    value={courseNotes}
                                    onChange={(e) => setCourseNotes(e.target.value)}
                                    onBlur={handleSaveNotes}
                                />
                                <div style={{ fontSize: '0.625rem', color: '#94A3B8', textAlign: 'right' }}>Auto-saving on blur</div>
                            </div>
                        </div>

                        {selectedSection === currentChapter.sections.length - 1 && (
                            <footer style={{ marginTop: '4rem', padding: '2.5rem', borderTop: '2px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981', fontWeight: '900', marginBottom: '1rem' }}>
                                    <CheckCircle2 size={24} /> Chapter Summary
                                </div>
                                <p style={{ color: '#64748B', fontWeight: '500', marginBottom: '2rem' }}>{currentChapter?.summary}</p>
                                <button
                                    onClick={() => setViewMode('exercise')}
                                    style={{ background: 'var(--edu-indigo)', color: '#FFFFFF', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'center' }}
                                >
                                    Go to Exercises <ChevronRight size={20} />
                                </button>
                            </footer>
                        )}

                        {selectedSection !== currentChapter.sections.length - 1 && (
                            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                                <button
                                    onClick={handleTakeQuiz}
                                    disabled={isQuizLoading}
                                    style={{ background: '#10B981', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                                >
                                    {isQuizLoading ? <Loader2 className="edu-spin" /> : <CheckCircle2 size={20} />} Verify Understanding
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* AI Assistant: Musa */}
            <aside style={{ background: '#F8FAFC', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0' }}>
                <header style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles color="#4F46E5" size={20} /></div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '900' }}>Consult Musa</h4>
                            <p style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: '900', textTransform: 'uppercase' }}>Active Assistant</p>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                            <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Ask Musa about this section.</p>
                        </div>
                    )}
                    {chatMessages.map((msg, i) => (
                        <div key={i} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%', padding: '1rem', borderRadius: '1rem',
                            background: msg.role === 'user' ? 'var(--edu-indigo)' : '#FFFFFF',
                            color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                            fontSize: '0.875rem', border: '1px solid #E2E8F0'
                        }}>
                            {msg.content}
                        </div>
                    ))}
                    {isAILatent && <div style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: '800' }}>Musa is thinking...</div>}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '1rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="Ask a question..."
                            style={{ width: '100%', padding: '0.875rem 3rem 0.875rem 1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.875rem' }}
                        />
                        <button
                            onClick={handleSendChat}
                            disabled={!input.trim() || isAILatent}
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--edu-indigo)', color: '#FFFFFF', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {quizQuestions && (
                <PopUpQuiz
                    questions={quizQuestions}
                    onClose={() => setQuizQuestions(null)}
                    onComplete={handleQuizComplete}
                />
            )}
            <audio ref={audioRef} src={audioUrl} onEnded={() => setAudioUrl(null)} />
        </div>
    );
};

export default ElectronicTextbook;
