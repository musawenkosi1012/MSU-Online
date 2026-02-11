import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Sparkles, LogIn, UserPlus } from 'lucide-react';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : { full_name: formData.fullName, email: formData.email, password: formData.password };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onLogin(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="edu-min-h-screen edu-flex edu-items-center edu-justify-center edu-p-6 edu-relative edu-overflow-hidden">
            {/* Background Decorations */}
            <div className="edu-orb" style={{ top: '-5rem', left: '-5rem', width: '32rem', height: '32rem', background: 'radial-gradient(circle, rgba(24, 69, 59, 0.15) 0%, transparent 70%)' }}></div>
            <div className="edu-orb" style={{ bottom: '-5rem', right: '-5rem', width: '32rem', height: '32rem', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}></div>

            <div className="edu-card edu-max-w-md edu-w-full edu-relative edu-rotate-in" style={{

                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
            }}>
                <div className="edu-text-center edu-mb-10" style={{ marginBottom: '2.5rem' }}>
                    <div className="edu-flex edu-items-center edu-justify-center edu-gap-4 edu-mb-6" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ width: '3.5rem', height: '3.5rem', background: 'linear-gradient(135deg, var(--edu-indigo), #0B9A6D)', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -5px var(--edu-indigo-glow)' }}>
                            <Sparkles color="#FFFFFF" size={28} />
                        </div>
                        <h1 className="edu-text-2xl edu-font-black edu-tracking-tight" style={{ fontSize: '1.75rem', color: '#1E293B' }}>MSU Online</h1>
                    </div>
                    <h2 className="edu-text-3xl edu-font-black edu-mb-2" style={{ marginBottom: '0.5rem', color: '#0F172A' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="edu-text-slate-500 edu-font-bold" style={{ fontSize: '1rem' }}>
                        {isLogin
                            ? 'Unlock your personalized academic journey.'
                            : 'Join the premier AI-driven learning community.'}
                    </p>
                </div>

                {error && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', borderRadius: '1.25rem', fontSize: '0.875rem', fontWeight: '700', textAlign: 'center', animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="edu-input-group">
                            <label className="edu-input-label">Full Name</label>
                            <div className="edu-input-wrapper">
                                <User className="edu-input-icon" />
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Enter your name"
                                    required
                                    className="edu-input"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    )}

                    <div className="edu-input-group">
                        <label className="edu-input-label">Institutional Email</label>
                        <div className="edu-input-wrapper">
                            <Mail className="edu-input-icon" />
                            <input
                                type="email"
                                name="email"
                                placeholder="name@university.edu"
                                required
                                className="edu-input"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="edu-input-group">
                        <div className="edu-flex edu-justify-between edu-items-center" style={{ marginLeft: '0.25rem' }}>
                            <label className="edu-input-label">Secret Credential</label>
                            {isLogin && <a href="#" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--edu-indigo)', textDecoration: 'none' }}>Recover?</a>}
                        </div>
                        <div className="edu-input-wrapper">
                            <Lock className="edu-input-icon" />
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                required
                                className="edu-input"
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="edu-btn edu-btn-primary"
                        style={{
                            marginTop: '1.5rem',
                            background: 'linear-gradient(135deg, var(--edu-indigo), var(--edu-indigo-dark))',
                            boxShadow: '0 15px 30px -10px var(--edu-indigo-glow)'
                        }}
                    >
                        {isLoading ? 'Processing Access...' : (isLogin ? 'Grant Access' : 'Register Profile')}
                        {!isLoading && (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                    </button>
                </form>

                <div className="edu-flex edu-items-center edu-gap-4" style={{ margin: '2.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #E2E8F0, transparent)' }}></div>
                    <span style={{ fontSize: '0.625rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Unified Intelligence Login</span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #E2E8F0, transparent)' }}></div>
                </div>

                <div className="edu-flex edu-gap-4">
                    <button className="edu-btn edu-btn-outline" style={{ padding: '0.875rem', borderRadius: '1.25rem', background: '#FFFFFF' }}>
                        <Chrome size={20} style={{ color: '#EA4335' }} />
                        <span style={{ fontSize: '0.875rem' }}>Google</span>
                    </button>
                    <button className="edu-btn edu-btn-outline" style={{ padding: '0.875rem', borderRadius: '1.25rem', background: '#FFFFFF' }}>
                        <Github size={20} />
                        <span style={{ fontSize: '0.875rem' }}>GitHub</span>
                    </button>
                </div>

                <div className="edu-text-center" style={{ marginTop: '3rem' }}>
                    <p className="edu-text-slate-500 edu-font-bold" style={{ fontSize: '0.875rem' }}>
                        {isLogin ? "New to the platform?" : "Already a member?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                marginLeft: '0.5rem',
                                fontWeight: '900',
                                color: 'var(--edu-indigo)',
                                background: 'none',
                                border: 'none',
                                borderBottom: '2px solid var(--edu-indigo-glow)',
                                cursor: 'pointer',
                                padding: '0 0 2px 0',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.borderBottom = '2px solid var(--edu-indigo)'}
                            onMouseOut={(e) => e.target.style.borderBottom = '2px solid var(--edu-indigo-glow)'}
                        >
                            {isLogin ? 'Create Profile' : 'Gain Access'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
