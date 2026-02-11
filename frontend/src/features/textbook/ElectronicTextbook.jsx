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
    Cpu
} from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure monaco to use local version
loader.config({ monaco });

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

    // New State for Assessment Integration
    const [viewMode, setViewMode] = useState('reading'); // 'reading' | 'exercise'
    const [chapterStatus, setChapterStatus] = useState({}); // { 0: {locked: false, completed: true} ... }

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isAILatent, setIsAILatent] = useState(false);
    const chatEndRef = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(null);

    // Programming State
    const [code, setCode] = useState('');
    const [labOutput, setLabOutput] = useState(null);
    const [isLabRunning, setIsLabRunning] = useState(false);


    // --- Derived ---

    const chapters = textbook?.chapters || [];
    const currentChapter = chapters[selectedChapter] || { title: "Untitled", intro: "", sections: [] };
    const sections = currentChapter.sections || [];
    const currentSection = sections[selectedSection] || { title: "Untitled", content: "" };

    const allChaptersComplete = chapters.length > 0 && chapters.every((_, idx) => chapterStatus[idx]?.completed);


    // --- Effects ---

    useEffect(() => {
        fetchTextbook();
    }, [courseId]);

    useEffect(() => {
        if (textbook) {
            fetchChapterStatus();
        }
    }, [textbook]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Reset audio when section changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setAudioUrl(null);

        // Update code when section changes
        if (currentSection?.practice_code) {
            setCode(currentSection.practice_code);
        } else {
            setCode('');
        }
        setLabOutput(null);
    }, [selectedChapter, selectedSection, currentSection]);

    // Track reading progress when user reaches bottom or spends time
    useEffect(() => {
        const timer = setTimeout(() => {
            // Assume 100% scroll depth for now if they stay on page for 30s
            // In a real app we'd track scroll events
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
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [selectedChapter, selectedSection, courseId]);


    // --- Handlers ---

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
            // Convert list to obj for easier lookup
            const statusObj = {};
            data.forEach(item => {
                statusObj[item.chapter_index] = item;
            });
            setChapterStatus(statusObj);
        } catch (err) {
            console.error("Failed to fetch chapter status", err);
        }
    };

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
            console.error("Failed to save structure", err);
            alert("Failed to save structure changes.");
        }
    };

    const handleTakeQuiz = async () => {
        setIsQuizLoading(true);
        try {
            const token = localStorage.getItem('token');
            const chapters = textbook?.chapters || [];
            const currentSection = chapters[selectedChapter]?.sections[selectedSection];

            if (!currentSection?.content) return;

            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/textbook/quiz/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ section_content: currentSection.content })
            });
            const data = await res.json();
            setQuizQuestions(data);
        } catch (err) {
            console.error("Quiz Error:", err);
            alert("Failed to generate quiz.");
        } finally {
            setIsQuizLoading(false);
        }
    };

    const handleQuizComplete = async (score) => {
        setQuizQuestions(null);
        try {
            const token = localStorage.getItem('token');
            const chapters = textbook?.chapters || [];
            const currentSection = chapters[selectedChapter]?.sections[selectedSection];

            // Calculate percentage score (0-100)
            const percentage = Math.round((score / 3) * 100);

            // Use a composite ID for the topic: courseId-chapterIdx-sectionIdx
            // Ideally this should match the ID scheme used in the course data
            const topicId = `${courseId}-${selectedChapter}-${selectedSection}`;

            await fetch(`${import.meta.env.VITE_API_BASE}/api/progress/exercise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic_id: topicId,
                    score: percentage
                })
            });
            if (onProgressUpdate) onProgressUpdate();

            alert(`Quiz Completed! Score: ${score}/3 (${percentage}%). Mastery recorded.`);
        } catch (err) {
            console.error("Progress Error:", err);
            // Non-blocking error
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
            const chapters = textbook?.chapters || [];
            const currentSection = chapters[selectedChapter]?.sections[selectedSection];

            if (!currentSection?.content) return;

            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/voice/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: currentSection.content.substring(0, 1000), // Limit for now to avoid timeout
                    voice: "p226"
                })
            });
            const data = await res.json();
            if (data.status === 'success' && data.audio_url) {
                setAudioUrl(data.audio_url);
                setTimeout(() => {
                    if (audioRef.current) audioRef.current.play();
                }, 100);
            }
        } catch (err) {
            console.error("TTS Error:", err);
            alert("Failed to generating audio narration.");
        }
    };

    const handleLabRun = async () => {
        setIsLabRunning(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/coding/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lesson_id: `topic-${selectedChapter}-${selectedSection}`,
                    code,
                    context_content: currentSection.content
                })
            });
            const data = await res.json();
            setLabOutput(data);
        } catch (err) {
            setLabOutput({ status: 'error', message: "Lab environment communication error." });
        } finally {
            setIsLabRunning(false);
        }
    };

    const handleLabSubmit = async () => {
        setIsLabRunning(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/coding/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lesson_id: `topic-${selectedChapter}-${selectedSection}`,
                    code
                })
            });
            const data = await res.json();
            setLabOutput(data);
            if (data.status === 'success' && data.score >= 80) {
                // Record progress
                await handleQuizComplete(3); // Assume full marks for passing lab
            }
        } catch (err) {
            setLabOutput({ status: 'error', message: "Auto-grading submission failed." });
        } finally {
            setIsLabRunning(false);
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
            const chapters = textbook?.chapters || [];
            const chapter = chapters[selectedChapter];
            const sections = chapter?.sections || [];
            const section = sections[selectedSection];

            if (!chapter || !section) {
                throw new Error("Missing textbook context");
            }

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
            setChatMessages(prev => [...prev, { role: 'ai', content: "Musa is temporarily unreachable. Please check your connection." }]);
        } finally {
            setIsAILatent(false);
        }
    };


    // --- Render Checks ---

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


    // --- Main Render ---

    return (
        <div className="edu-animate-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 350px', gap: '1px', background: '#F1F5F9', height: '85vh', borderRadius: '2.5rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>

            {/* Sidebar: Table of Contents */}
            <aside style={{ background: '#F8FAFC', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Course Scope</h4>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B' }}>{textbook.title || "Untitled Course"}</h3>
                    </div>
                </header>
                <button
                    onClick={() => setIsEditing(true)}
                    style={{
                        padding: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--edu-indigo)',
                        background: '#EEF2FF', border: '1px solid #4F46E5', borderRadius: '0.5rem', cursor: 'pointer'
                    }}
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
                                    <BookOpen size={16} /> Chapter {cIdx + 1}: {chapter.title}
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

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                    <button
                        onClick={() => {
                            if (!allChaptersComplete) {
                                alert("Complete all chapters to unlock the Final Exam.");
                                return;
                            }
                            setViewMode('final');
                        }}
                        style={{
                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                            background: viewMode === 'final' ? '#4F46E5' : (allChaptersComplete ? '#F0FDF4' : '#F8FAFC'),
                            color: viewMode === 'final' ? '#FFFFFF' : (allChaptersComplete ? '#16A34A' : '#94A3B8'),
                            fontWeight: '800',
                            border: allChaptersComplete ? '1px solid #16A34A' : '1px solid #E2E8F0',
                            cursor: allChaptersComplete ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            opacity: allChaptersComplete ? 1 : 0.7
                        }}
                    >
                        <Sparkles size={16} /> Final Exam
                        {!allChaptersComplete && <Lock size={14} />}
                    </button>
                </div>
            </aside>

            {viewMode === 'exercise' ? (
                <main style={{ background: '#FFFFFF', padding: '0', overflowY: 'auto' }}>
                    <ChapterExercises
                        courseId={courseId}
                        chapterIndex={selectedChapter}
                        chapter={currentChapter}
                        onBack={() => setViewMode('reading')}
                        onComplete={(unlockedNext) => {
                            if (unlockedNext) {
                                fetchChapterStatus(); // update locks
                            }
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
                            if (passed) {
                                alert("CONGRATULATIONS! Course Completed.");
                                fetchChapterStatus();
                            }
                            setViewMode('reading');
                        }}
                    />
                </main>
            ) : (
                <main style={{ background: '#FFFFFF', padding: '4rem', overflowY: 'auto' }}>
                    <div style={{ maxWidth: textbook?.is_programming ? '100%' : '800px', margin: '0 auto', height: textbook?.is_programming ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
                        <header style={{ marginBottom: textbook?.is_programming ? '1.5rem' : '3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--edu-indigo)', fontWeight: '900', fontSize: '0.875rem' }}>
                                    {textbook?.is_programming ? <Code size={16} /> : null}
                                    Chapter {selectedChapter + 1} <ChevronRight size={16} /> Section {selectedSection + 1}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {textbook?.is_programming && (
                                        <>
                                            <button onClick={handleLabRun} disabled={isLabRunning} className="edu-btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {isLabRunning ? <Loader2 size={14} className="edu-spin" /> : <Play size={14} />} Run
                                            </button>
                                            <button onClick={handleLabSubmit} disabled={isLabRunning} className="edu-btn edu-btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <CheckCircle2 size={14} /> Submit Lab
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={handleReadAloud}
                                        style={{
                                            background: audioUrl ? '#EEF2FF' : 'transparent',
                                            color: 'var(--edu-indigo)',
                                            border: '1px solid #4F46E5',
                                            borderRadius: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.75rem'
                                        }}
                                    >
                                        <Volume2 size={14} /> {audioUrl && audioRef.current && !audioRef.current.paused ? "Pause" : "Read"}
                                    </button>
                                </div>
                                <audio ref={audioRef} src={audioUrl} onEnded={() => setAudioUrl(null)} />
                            </div>
                            <h2 style={{ fontSize: textbook?.is_programming ? '1.75rem' : '2.5rem', fontWeight: '900', color: '#0F172A', lineHeight: '1.2' }}>{currentSection?.title || "Untitled"}</h2>
                        </header>

                        {textbook?.is_programming ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 35%) 1fr', gap: '1px', flex: 1, background: '#E2E8F0', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                {/* Left: Content */}
                                <div style={{ background: '#FFFFFF', padding: '1.5rem', overflowY: 'auto' }}>
                                    <div className="edu-textbook-content" style={{ fontSize: '0.925rem', lineHeight: '1.6', color: '#334155' }}>
                                        {selectedSection === 0 && (
                                            <p style={{ fontStyle: 'italic', color: '#475569', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '0.75rem' }}>
                                                {currentChapter?.intro}
                                            </p>
                                        )}
                                        {(currentSection?.content || "").split('\n\n').map((para, i) => (
                                            <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
                                        ))}
                                    </div>
                                </div>
                                {/* Center: Editor + Bottom Output */}
                                <div style={{ display: 'grid', gridTemplateRows: '1fr 200px', background: '#E2E8F0', gap: '1px' }}>
                                    <div style={{ background: '#1E1E1E' }}>
                                        <Editor
                                            height="100%"
                                            defaultLanguage="python"
                                            theme="vs-dark"
                                            value={code}
                                            onChange={(val) => setCode(val)}
                                            options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 10 } }}
                                        />
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '1rem', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontWeight: '900', fontSize: '0.625rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                            <Terminal size={12} /> Console Output
                                        </div>
                                        {!labOutput ? (
                                            <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.75rem' }}>
                                                Run code to see results
                                            </div>
                                        ) : (
                                            <div className="edu-animate-in">
                                                <div style={{ fontSize: '0.8125rem', color: labOutput.status === 'success' ? '#16A34A' : '#DC2626', fontWeight: '700', marginBottom: '0.5rem' }}>
                                                    {labOutput.status.toUpperCase()}: {labOutput.message}
                                                    {labOutput.score !== undefined && <span style={{ marginLeft: '1rem', color: 'var(--edu-indigo)' }}>Score: {labOutput.score}%</span>}
                                                </div>
                                                <pre style={{ fontSize: '0.75rem', background: '#0F172A', color: '#38BDF8', padding: '0.75rem', borderRadius: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                                    {labOutput.details?.stdout || labOutput.error || "No output"}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {selectedSection === 0 && (
                                    <section style={{ marginBottom: '3rem', padding: '2rem', background: '#F8FAFC', borderRadius: '1.5rem', borderLeft: '4px solid #4F46E5' }}>
                                        <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '1.125rem', lineHeight: '1.7' }}>
                                            {currentChapter?.intro || ""}
                                        </p>
                                    </section>
                                )}

                                <article className="edu-textbook-content" style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#334155' }}>
                                    {(currentSection?.content || "").split('\n\n').map((para, i) => (
                                        <p key={i} style={{ marginBottom: '1.5rem' }}>{para}</p>
                                    ))}
                                </article>

                                {selectedSection === currentChapter.sections.length - 1 && (
                                    <footer style={{ marginTop: '4rem', padding: '2.5rem', borderTop: '2px solid #F1F5F9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981', fontWeight: '900', marginBottom: '1rem' }}>
                                            <CheckCircle2 size={24} /> Chapter Summary
                                        </div>
                                        <p style={{ color: '#64748B', fontWeight: '500', marginBottom: '2rem' }}>{currentChapter?.summary || ""}</p>

                                        <button
                                            onClick={() => setViewMode('exercise')}
                                            style={{
                                                background: 'var(--edu-indigo)', color: '#FFFFFF', padding: '1rem 2rem', borderRadius: '1rem',
                                                fontWeight: '800', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)',
                                                width: '100%', justifyContent: 'center'
                                            }}
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
                                            style={{
                                                background: '#10B981', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '1rem',
                                                fontWeight: '800', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            {isQuizLoading ? <Loader2 className="edu-spin" /> : <CheckCircle2 size={20} />}
                                            Verify Understanding
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {quizQuestions && (
                            <PopUpQuiz
                                questions={quizQuestions}
                                onClose={() => setQuizQuestions(null)}
                                onComplete={handleQuizComplete}
                            />
                        )}
                    </div>
                </main>
            )}

            {/* Integrated Chatbot: Musa AI */}
            {/* Integrated Chatbot: Musa AI */}
            <aside style={{ background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
                {/* ... Chat UI ... */}
                {/* Using existing Chat UI logic, assuming it's preserved below or I need to keep it? 
                    Wait, I am replacing the END of the file basically? 
                    Line 349 is inside the <aside>.
                    I need to insert the Quiz Rendering logic.
                    It's better to put the Quiz Modal OUTSIDE the grid, at the end of the return.
                */}
                <header style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles color="#4F46E5" size={20} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '900' }}>Consult Musa</h4>
                            <p style={{ fontSize: '0.625rem', color: '#10B981', fontWeight: '900', textTransform: 'uppercase' }}>Context Aware Active</p>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chatMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                            <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Ask Musa about this section for deeper insights.</p>
                        </div>
                    )}
                    {chatMessages.map((msg, i) => (
                        <div key={i} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            padding: '1rem',
                            borderRadius: '1rem',
                            background: msg.role === 'user' ? 'var(--edu-indigo)' : '#FFFFFF',
                            borderColor: msg.role === 'user' ? 'var(--edu-indigo)' : '#E2E8F0',
                            color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            boxShadow: msg.role === 'ai' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            border: msg.role === 'ai' ? '1px solid #E2E8F0' : '1px solid var(--edu-indigo)'
                        }}>
                            {msg.content}
                        </div>
                    ))}
                    {isAILatent && (
                        <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div className="edu-typing-dots" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.4rem 0.8rem' }}>
                                <div className="edu-typing-dot"></div>
                                <div className="edu-typing-dot"></div>
                                <div className="edu-typing-dot"></div>
                            </div>
                            <span style={{ fontSize: '0.625rem', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>Musa is thinking</span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '1rem', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="Deepen your understanding..."
                            style={{
                                width: '100%', padding: '0.875rem 3rem 0.875rem 1.25rem', borderRadius: '1rem',
                                border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.875rem', fontWeight: '500'
                            }}
                        />
                        <button
                            onClick={handleSendChat}
                            disabled={!input.trim() || isAILatent}
                            style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--edu-indigo)', color: '#FFFFFF', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: input.trim() ? 1 : 0.5 }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </aside >
        </div >
    );
};

export default ElectronicTextbook;


