import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../shared/utils/api';
import {
    MessageCircle,
    GraduationCap,
    Globe,
    Send,
    Loader2,
    ChevronDown,
    Sparkles,
    Brain,
    Target,
    Lightbulb,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    MoreVertical,
    History
} from 'lucide-react';

/**
 * MSU Online AI Hub
 * Chat Mode: Quick Q&A, optional web scraping
 * Interactive Mode: Tutor-driven, mastery-aware learning
 */
const MusaAIHub = ({ courses }) => {
    // Mode state
    const [mode, setMode] = useState('chat'); // 'chat' | 'interactive'

    // Context state
    const [enrolledCourses, setEnrolledCourses] = useState(courses || []);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topics, setTopics] = useState([]);

    // Web scrape toggle
    const [allowWebScrape, setAllowWebScrape] = useState(false);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Interactive state
    const [tutorState, setTutorState] = useState('INTRODUCE');
    const [mastery, setMastery] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [revisionQuestions, setRevisionQuestions] = useState([]);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(new Audio());

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const authToken = localStorage.getItem('token');

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch enrolled courses on mount
    useEffect(() => {
        const init = async () => {
            await fetchEnrolledCourses();
        };
        init();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/agents/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ agent: 'course', action: 'list_enrolled' })
            });
            const data = await res.json();
            if (data.courses) {
                setEnrolledCourses(data.courses);
                if (data.courses.length > 0 && !selectedCourse) {
                    handleCourseSelect(data.courses[0].id);
                }
            }
        } catch (err) {
            console.error("Error fetching enrolled courses:", err);
        }
    };

    const handleCourseSelect = (courseId) => {
        setSelectedCourse(courseId);
    };

    // Fetch topics when course changes
    useEffect(() => {
        if (selectedCourse) {
            fetchTopics();
        }
    }, [selectedCourse]);

    const fetchTopics = async () => {
        if (!selectedCourse) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/agents/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ agent: 'course', action: 'get_outline', course_id: selectedCourse })
            });
            const data = await res.json();
            // Using the agent-processed flat_topics directly (Thin Client)
            setTopics(data.flat_topics || []);
            if (data.flat_topics?.length > 0) {
                setSelectedTopic(data.flat_topics[0].topic_id || data.flat_topics[0].id);
            }
        } catch (err) {
            console.error("Error fetching topics:", err);
        }
    };

    // Send message
    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        // Ensure we have context
        if (!selectedCourse) {
            setMessages(prev => [...prev, { role: 'ai', content: "Please select a course context above before we begin." }]);
            return;
        }

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const payload = {
                agent: 'intelligence',
                mode: mode, // 'chat' or 'interactive'
                message: userMessage,
                session_id: sessionId ? String(sessionId) : null,
                course_id: selectedCourse ? String(selectedCourse) : null,
                topic_id: selectedTopic ? String(selectedTopic) : null,
                allow_web_scrape: allowWebScrape
            };

            const res = await fetch(`${API_BASE}/api/agents/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || data.message || "Agent request failed");
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                webDataUsed: data.web_data_used,
                affectsGpa: data.affects_gpa
            }]);

            // Auto-speak if voice mode is on
            if (isVoiceMode) {
                speak(data.response);
            }

            if (mode === 'interactive') {
                setTutorState(data.current_state || 'INTRODUCE');
                setMastery(data.mastery || 0);
                setHintsUsed(data.hints_used || 0);
                setSessionId(data.session_id);
            }
        } catch (err) {
            console.error("Error sending message to agent:", err);

            let errorMsg = "I'm having trouble connecting to Musa Intelligence. Please try again.";
            if (err.message) {
                errorMsg = typeof err.message === 'object'
                    ? JSON.stringify(err.message)
                    : err.message;
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `ERROR: ${errorMsg}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Voice Mode Implementation
    const toggleVoiceMode = () => {
        setIsVoiceMode(!isVoiceMode);
        if (isSpeaking) {
            audioRef.current.pause();
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => setIsRecording(true);
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
        };

        recognitionRef.current.start();
    };

    const stopRecording = () => {
        recognitionRef.current?.stop();
    };

    const speak = async (text) => {
        if (isSpeaking) {
            audioRef.current.pause();
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);

        try {
            // Try backend TTS first for premium Musa voice
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/voice/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: text.substring(0, 500), voice: "p226" })
            });

            const data = await res.json();

            if (res.ok && data.audio_url) {
                audioRef.current.src = `${import.meta.env.VITE_API_BASE}/api/voice/stream/${data.audio_filename || data.audio_url.split('/').pop()}`;
                audioRef.current.play().catch(e => {
                    console.warn("Autoplay blocked or audio error, falling back to browser TTS", e);
                    browserFallbackSpeak(text);
                });
                audioRef.current.onended = () => setIsSpeaking(false);
            } else {
                throw new Error("Backend TTS unavailable");
            }
        } catch (err) {
            console.warn("Voice synthesis backend failed, using browser fallback", err);
            browserFallbackSpeak(text);
        }
    };

    const browserFallbackSpeak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Request hint (interactive mode only)
    const handleRequestHint = async () => {
        if (mode !== 'interactive' || !sessionId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/agents/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    agent: 'intelligence',
                    mode: 'interactive',
                    action: 'hint',
                    message: "I need a hint please",
                    session_id: String(sessionId),
                    course_id: String(selectedCourse),
                    topic_id: String(selectedTopic)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || data.message || "Hint request failed");
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                isHint: true
            }]);
            setHintsUsed(data.hints_used || 0);
        } catch (err) {
            console.error("Error requesting hint:", err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `HINT ERROR: ${err.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear chat
    const handleClearChat = () => {
        setMessages([]);
        setSessionId(null);
        setTutorState('INTRODUCE');
        setMastery(0);
        setHintsUsed(0);
    };

    // State color mapping
    const stateColors = {
        INTRODUCE: { bg: '#EEF2FF', color: 'var(--edu-indigo)', icon: BookOpen },
        EXPLAIN: { bg: '#F0FDF4', color: '#10B981', icon: Brain },
        CHECK_UNDERSTANDING: { bg: '#FEF3C7', color: '#F59E0B', icon: Target },
        ASSESS: { bg: '#FEE2E2', color: '#EF4444', icon: GraduationCap },
        UPDATE_MASTERY: { bg: '#F5F3FF', color: '#8B5CF6', icon: Sparkles },
        ADVANCE: { bg: '#ECFDF5', color: '#059669', icon: CheckCircle2 },
        REMEDIATE: { bg: '#FFF7ED', color: '#EA580C', icon: RefreshCw }
    };

    const currentStateInfo = stateColors[tutorState] || stateColors.INTRODUCE;
    const StateIcon = currentStateInfo.icon;

    return (
        <div className="edu-animate-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', gap: '1.5rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                padding: '1.5rem 2rem',
                borderRadius: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #F1F5F9'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-purple))',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Brain size={28} color="#FFFFFF" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0F172A' }}>Musa AI</h1>
                        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Your intelligent learning companion</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div style={{
                    display: 'flex',
                    background: '#F1F5F9',
                    borderRadius: '1rem',
                    padding: '0.25rem'
                }}>
                    <button
                        onClick={() => setMode('chat')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: mode === 'chat' ? '#FFFFFF' : 'transparent',
                            color: mode === 'chat' ? '#4F46E5' : '#64748B',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: mode === 'chat' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <MessageCircle size={18} /> Chat
                    </button>
                    <button
                        onClick={() => setMode('interactive')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: mode === 'interactive' ? '#FFFFFF' : 'transparent',
                            color: mode === 'interactive' ? '#4F46E5' : '#64748B',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: mode === 'interactive' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <GraduationCap size={18} /> Interactive
                    </button>
                </div>

                {/* Clear button */}
                <button
                    onClick={handleClearChat}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        color: '#64748B',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <RefreshCw size={16} /> Clear
                </button>
            </header>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
                {/* Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Context Selector */}
                    <div className="edu-card" style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontWeight: '800', marginBottom: '1rem', fontSize: '0.875rem', color: '#64748B' }}>
                            Context
                        </h4>
                        <select
                            value={selectedCourse || ''}
                            onChange={(e) => handleCourseSelect(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: '1px solid #E2E8F0',
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            {enrolledCourses?.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        {mode === 'interactive' && topics.length > 0 && (
                            <select
                                value={selectedTopic || ''}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #E2E8F0',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {topics.map(t => (
                                    <option key={t.topic_id} value={t.topic_id}>{t.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Revision Questions Hub */}
                    {revisionQuestions.length > 0 && (
                        <div className="edu-card" style={{ padding: '1.25rem', background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <RefreshCw size={18} color="var(--edu-indigo)" />
                                <h4 style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.875rem' }}>REVISION CORNER</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {revisionQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInputValue(`Let's revise this: ${q.question}`)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            background: '#FFFFFF',
                                            border: '1px solid #E2E8F0',
                                            fontSize: '0.75rem',
                                            textAlign: 'left',
                                            color: '#475569',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: '600'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--edu-indigo)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                                    >
                                        {q.question.substring(0, 60)}...
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Interactive Mode State Display */}
                    {mode === 'interactive' && (
                        <div className="edu-card" style={{ padding: '1.25rem', background: currentStateInfo.bg, border: `1px solid ${currentStateInfo.color}30` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <StateIcon size={20} color={currentStateInfo.color} />
                                <h4 style={{ fontWeight: '800', color: currentStateInfo.color, fontSize: '0.875rem' }}>
                                    {tutorState.replace(/_/g, ' ')}
                                </h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#64748B', marginBottom: '0.25rem' }}>MASTERY</div>
                                    <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px' }}>
                                        <div style={{
                                            width: `${mastery * 100}%`,
                                            height: '100%',
                                            background: mastery >= 0.7 ? '#10B981' : 'var(--edu-indigo)',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s'
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', marginTop: '0.25rem' }}>{(mastery * 100).toFixed(0)}%</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span style={{ color: '#64748B' }}>Hints Used</span>
                                <span style={{ fontWeight: '700', color: hintsUsed > 2 ? '#EF4444' : '#1E293B' }}>{hintsUsed}</span>
                            </div>
                        </div>
                    )}

                    {/* Mode Info */}
                    <div className="edu-card" style={{ padding: '1.25rem', background: mode === 'chat' ? '#F0FDF4' : '#FEF3C7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {mode === 'chat' ? <MessageCircle size={16} color="#10B981" /> : <AlertCircle size={16} color="#F59E0B" />}
                            <span style={{ fontWeight: '800', fontSize: '0.75rem', color: mode === 'chat' ? '#065F46' : '#92400E' }}>
                                {mode === 'chat' ? 'Chat Mode' : 'Interactive Mode'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: mode === 'chat' ? '#047857' : '#B45309', lineHeight: '1.4' }}>
                            {mode === 'chat'
                                ? 'Quick Q&A. Does not affect your grades.'
                                : 'Tutor-guided learning. Exercises affect your GPA.'
                            }
                        </p>
                    </div>
                </aside>

                {/* Chat Area */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        background: '#FFFFFF',
                        borderRadius: '2rem 2rem 0 0',
                        border: '1px solid #F1F5F9',
                        borderBottom: 'none',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                                <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ fontWeight: '600' }}>Start a conversation with Musa AI</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    {mode === 'chat' ? "Ask questions or get explanations" : "Begin your interactive learning session"}
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '1rem 1.25rem',
                                        borderRadius: msg.role === 'user' ? '1.25rem 1.25rem 0 1.25rem' : '1.25rem 1.25rem 1.25rem 0',
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, var(--edu-indigo), var(--edu-purple))'
                                            : msg.isHint ? '#FEF3C7' : '#F8FAFC',
                                        color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                                        border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0'
                                    }}>
                                        <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            {msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => speak(msg.content)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        padding: 0,
                                                        color: isSpeaking ? 'var(--edu-indigo)' : '#64748B',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.625rem',
                                                        fontWeight: '700'
                                                    }}
                                                >
                                                    {isSpeaking ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                                    {isSpeaking ? 'Stop' : 'Read Aloud'}
                                                </button>
                                            )}
                                            {msg.webDataUsed && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', color: '#64748B' }}>
                                                    <Globe size={10} /> Web data used
                                                </div>
                                            )}
                                            {msg.affectsGpa && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', color: '#EF4444', fontWeight: '700' }}>
                                                    <AlertCircle size={10} /> This affects your grade
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '0 0 2rem 2rem',
                        border: '1px solid #F1F5F9',
                        borderTop: 'none',
                        padding: '1rem 1.5rem 1.5rem'
                    }}>
                        {/* Web Scrape Toggle (Chat mode only) */}
                        {mode === 'chat' && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <button
                                    onClick={() => setAllowWebScrape(!allowWebScrape)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid',
                                        borderColor: allowWebScrape ? 'var(--edu-indigo)' : '#E2E8F0',
                                        background: allowWebScrape ? 'var(--edu-indigo-light)' : '#FFFFFF',
                                        color: allowWebScrape ? 'var(--edu-indigo)' : '#64748B',
                                        fontWeight: '700',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Globe size={14} />
                                    {allowWebScrape ? 'Web Data Enabled' : 'Use Latest Web Data'}
                                </button>
                            </div>
                        )}

                        {/* Input + Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            {mode === 'interactive' && tutorState === 'ASSESS' && (
                                <button
                                    onClick={handleRequestHint}
                                    disabled={isLoading}
                                    style={{
                                        padding: '0.875rem 1rem',
                                        borderRadius: '1rem',
                                        border: '1px solid #FDE68A',
                                        background: '#FFFBEB',
                                        color: '#92400E',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <Lightbulb size={18} /> Hint
                                </button>
                            )}

                            <button
                                onClick={toggleVoiceMode}
                                style={{
                                    padding: '0.875rem',
                                    borderRadius: '1rem',
                                    border: '1px solid #E2E8F0',
                                    background: isVoiceMode ? 'var(--edu-indigo)' : '#FFFFFF',
                                    color: isVoiceMode ? '#FFFFFF' : '#64748B',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                title="Toggle Voice Mode"
                            >
                                {isVoiceMode ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>

                            {isVoiceMode ? (
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={stopRecording}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        borderRadius: '1.25rem',
                                        border: 'none',
                                        background: isRecording ? '#EF4444' : '#F1F5F9',
                                        color: isRecording ? '#FFFFFF' : '#1E293B',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
                                    }}
                                >
                                    {isRecording ? (
                                        <>
                                            <div style={{
                                                width: 12, height: 12, borderRadius: '50%',
                                                background: '#FFF',
                                                animation: 'pulse 1.5s infinite'
                                            }} />
                                            LISTENING...
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={20} />
                                            HOLD TO SPEAK
                                        </>
                                    )}
                                </button>
                            ) : (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={mode === 'chat' ? "Ask Musa anything..." : "Type your response..."}
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem 1.25rem',
                                        borderRadius: '1rem',
                                        border: '1px solid #E2E8F0',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        outline: 'none'
                                    }}
                                />
                            )}

                            <button
                                onClick={handleSend}
                                disabled={isLoading || (!inputValue.trim() && !isVoiceMode)}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    borderRadius: '1rem',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-purple))',
                                    color: '#FFFFFF',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: isLoading || (!inputValue.trim() && !isVoiceMode) ? 0.5 : 1
                                }}
                            >
                                {isLoading ? <Loader2 size={18} className="edu-spin" /> : <Send size={18} />}
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default MusaAIHub;
