import React from 'react';
import { API_BASE } from '../../shared/utils/api';
import { Bot, Sparkles, Search, Mic, Send, Loader2, Zap } from 'lucide-react';

const MusaTutor = ({
    chatHistory,
    aiLoading,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    isResearchMode,
    setIsResearchMode,
    isVoiceActive,
    setIsVoiceActive,
    generateQuiz,
    courseId
}) => {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [ragStats, setRagStats] = React.useState(null);
    const mediaRecorderRef = React.useRef(null);
    const audioChunksRef = React.useRef([]);
    const handleSyncKnowledge = async () => {
        if (!courseId) return;
        setIsSyncing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/ai/index/course`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ course_id: courseId })
            });
            const data = await res.json();
            alert(`Sync Complete: ${data.indexed_count} chunks embedded.`);
            fetchRagStats();
        } catch (err) {
            console.error("Sync error", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchRagStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/ai/rag/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRagStats(data);
        } catch (err) {
            console.error("Error fetching RAG stats", err);
        }
    };

    React.useEffect(() => {
        fetchRagStats();
    }, []);

    // Initialize Server-side Voice Capture (STT)
    const startRecording = async () => {
        try {
            // Use Browser Speech Recognition if available (Instant STT)
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript;
                    if (text) {
                        setInputMessage(prev => prev + (prev ? " " : "") + text);
                    }
                };

                recognition.onerror = (event) => {
                    console.error("Speech Recognition Error", event.error);
                    // Fallback to manual recording if browser recognition fails
                    startManualRecording();
                };

                recognition.onend = () => setIsVoiceActive(false);
                recognition.start();
            } else {
                startManualRecording();
            }
        } catch (err) {
            console.error("Mic access error", err);
            setIsVoiceActive(false);
        }
    };

    const startManualRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE}/api/voice/stt`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ audio_data: base64Audio })
                    });
                    const data = await res.json();
                    if (data.text) {
                        setInputMessage(prev => prev + (prev ? " " : "") + data.text);
                    }
                } catch (err) {
                    console.error("STT Error", err);
                }
            };
        };

        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    // Handle Start/Stop Listening based on UI toggle
    React.useEffect(() => {
        if (isVoiceActive) voice_active_start: startRecording();
        else stopRecording();
        return () => stopRecording();
    }, [isVoiceActive]);

    // Handle Server-side TTS for AI messages
    React.useEffect(() => {
        const playTts = async (text) => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/voice/tts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text, voice: 'p225' })
                });
                const data = await res.json();
                if (data.audio_url) {
                    const audio = new Audio(data.audio_url);
                    audio.play();
                }
            } catch (err) {
                console.error("TTS Error", err);
                // Fallback to browser synthesis
                const utterance = new SpeechSynthesisUtterance(text);
                window.speechSynthesis.speak(utterance);
            }
        };

        if (isVoiceActive && chatHistory.length > 0) {
            const lastMessage = chatHistory[chatHistory.length - 1];
            if (lastMessage.role === 'ai') {
                playTts(lastMessage.text);
            }
        }
    }, [chatHistory, isVoiceActive]);

    return (

        <div className="edu-animate-in" style={{ height: '70vh', background: '#FFFFFF', borderRadius: '2.5rem', border: '1px solid #F1F5F9', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(to right, #FFFFFF, #F8FAFC)' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '12px', height: '12px', background: '#10B981', border: '2px solid white', borderRadius: '50%', position: 'absolute', bottom: '0', right: '0', zIndex: 10 }}></div>
                    <div style={{ width: '48px', height: '48px', background: '#EEF2FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot color="#4F46E5" size={28} />
                    </div>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B' }}>MSU Online Intelligence</h2>
                    <p style={{ fontSize: '0.75rem', color: isVoiceActive ? '#F59E0B' : '#10B981', fontWeight: '700' }}>
                        {isVoiceActive ? 'Listening for Insights...' : 'Contextual Tutor Active'}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleSyncKnowledge}
                        disabled={isSyncing}
                        style={{ background: '#F0FDF4', color: '#10B981', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isSyncing ? <Loader2 className="edu-spin" size={14} /> : <Zap size={14} />}
                        Sync Knowledge
                    </button>
                    <button onClick={generateQuiz} style={{ background: '#EEF2FF', color: 'var(--edu-indigo)', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>Generate Instant Quiz</button>
                </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#FDFDFF' }}>
                {chatHistory.length === 0 && (
                    <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '400px' }}>
                        <Sparkles size={48} color="#E2E8F0" style={{ marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                        <h4 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>Welcome to your Brainspace</h4>
                        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>MSU Online Intelligence has indexed your repository evidence. Ask anything about the course materials.</p>
                    </div>
                )}
                {chatHistory.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '80%', padding: '1rem 1.5rem', borderRadius: '1.5rem', background: msg.role === 'user' ? '#4F46E5' : '#FFFFFF', color: msg.role === 'user' ? '#FFFFFF' : '#1E293B', boxShadow: msg.role === 'user' ? '0 10px 15px rgba(79,70,229,0.2)' : '0 1px 2px rgba(0,0,0,0.1)', border: msg.role === 'ai' ? '1px solid #F1F5F9' : 'none', fontWeight: '500' }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {aiLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="edu-spin"><Bot color="#4F46E5" size={20} /></div>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>
                                {isResearchMode ? "Musa is deep researching..." : "Musa is thinking..."}
                            </span>
                        </div>
                        <div className="edu-typing-dots" style={{ background: '#EEF2FF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0', padding: '0.6rem 1.2rem' }}>
                            <div className="edu-typing-dot" style={{ width: '8px', height: '8px' }}></div>
                            <div className="edu-typing-dot" style={{ width: '8px', height: '8px' }}></div>
                            <div className="edu-typing-dot" style={{ width: '8px', height: '8px' }}></div>
                        </div>
                    </div>
                )}

            </div>

            <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setIsResearchMode(!isResearchMode)}
                            title="Toggle Deep Research"
                            style={{ background: isResearchMode ? '#4F46E5' : 'transparent', color: isResearchMode ? '#FFF' : '#64748B', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '0.4rem' }}
                        >
                            <Search size={18} />
                        </button>
                        <button
                            onClick={() => setIsVoiceActive(!isVoiceActive)}
                            title="Voice Mode"
                            style={{ background: isVoiceActive ? '#EF4444' : 'transparent', color: isVoiceActive ? '#FFF' : '#64748B', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '0.4rem' }}
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder={isResearchMode ? "Musa is researching the web..." : "Ask Musa anything..."}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        style={{ width: '100%', padding: '1.25rem 1.5rem 1.25rem 5.5rem', background: '#F8FAFC', border: '2px solid #F1F5F9', borderRadius: '1.5rem', outline: 'none', fontSize: '1rem', transition: 'all 0.3s' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={aiLoading}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--edu-indigo)', color: '#FFFFFF', border: 'none', width: '3rem', height: '3rem', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,68,229,0.3)', transition: 'all 0.2s' }}
                    >
                        {aiLoading ? <Loader2 className="edu-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MusaTutor;
