import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, CreditCard, Building, Calendar, Phone, Hash, Users, Sparkles, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Comprehensive form data
    const [formData, setFormData] = useState({
        // Auth
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        login_id: '', // For login

        // Names
        first_name: '',
        last_name: '',
        middle_name: '',

        // Identity
        role: 'student',
        dob: '',
        gender: '',
        national_id: '',
        mobile_number: '',

        // Institutional
        institutional_name: '',
        title: '', // Mr, Mrs, Miss, Dr, etc.
        department: '',
        pay_number: '',

        // Consents
        terms_accepted: false,
        privacy_accepted: false,
        data_consent_accepted: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

        // Prepare payload
        let payload;
        if (isLogin) {
            payload = {
                login_id: formData.login_id || formData.username || formData.email,
                password: formData.password
            };
        } else {
            // Validate consents
            if (!formData.terms_accepted || !formData.privacy_accepted || !formData.data_consent_accepted) {
                setError('You must accept all terms and consents to proceed.');
                setIsLoading(false);
                return;
            }
            payload = { ...formData };
        }

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

    return (
        <div className="edu-min-h-screen edu-flex edu-items-center edu-justify-center edu-p-6 edu-relative edu-overflow-hidden" style={{ background: '#F8FAFC' }}>
            {/* Orbs */}
            <div className="edu-orb" style={{ top: '-10rem', left: '-10rem', width: '40rem', height: '40rem', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)' }}></div>
            <div className="edu-orb" style={{ bottom: '-10rem', right: '-10rem', width: '40rem', height: '40rem', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)' }}></div>

            <div className={`edu-card ${isLogin ? 'edu-max-w-md' : 'edu-max-w-4xl'} edu-w-full edu-relative edu-rotate-in`} style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.05)',
                padding: '3rem',
                borderRadius: '2.5rem'
            }}>
                <div className="edu-text-center edu-mb-8">
                    <div className="edu-flex edu-items-center edu-justify-center edu-gap-3 edu-mb-4">
                        <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #6366F1, #10B981)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                            <Sparkles color="#FFFFFF" size={24} />
                        </div>
                        <h1 className="edu-text-xl edu-font-black edu-tracking-tight" style={{ color: '#1E293B' }}>MSU <span style={{ color: '#10B981' }}>ONLINE</span></h1>
                    </div>
                    <h2 className="edu-text-3xl edu-font-black edu-mb-2" style={{ color: '#0F172A' }}>{isLogin ? 'Welcome Back' : 'Create Your Profile'}</h2>
                    <p className="edu-text-slate-500 edu-font-medium" style={{ fontSize: '0.95rem' }}>
                        {isLogin ? 'Use your username or email to continue.' : 'Provide your official credentials to join the network.'}
                    </p>
                </div>

                {error && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', background: '#FFF1F2', border: '1px solid #FFE4E6', color: '#E11D48', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isLogin ? (
                        <div className="edu-space-y-4">
                            <div className="edu-input-group">
                                <label className="edu-input-label">Username or Email</label>
                                <div className="edu-input-wrapper">
                                    <User className="edu-input-icon" />
                                    <input type="text" name="login_id" placeholder="Enter ID" required className="edu-input" value={formData.login_id} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Password</label>
                                <div className="edu-input-wrapper">
                                    <Lock className="edu-input-icon" />
                                    <input type="password" name="password" placeholder="••••••••" required className="edu-input" value={formData.password} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="edu-grid edu-grid-cols-1 md:edu-grid-cols-3 edu-gap-6">
                            {/* Personal Identification */}
                            <div className="edu-col-span-full edu-mb-2">
                                <h3 className="edu-flex edu-items-center edu-gap-2 edu-text-sm edu-font-black edu-text-slate-400 edu-uppercase edu-tracking-widest">
                                    <User size={14} /> Personal Identity
                                </h3>
                                <div style={{ height: '1px', background: '#E2E8F0', marginTop: '0.5rem' }}></div>
                            </div>

                            <div className="edu-input-group">
                                <label className="edu-input-label">Title</label>
                                <select name="title" className="edu-input" value={formData.title} onChange={handleInputChange}>
                                    <option value="">Select Title</option>
                                    <option value="Mr">Mr.</option>
                                    <option value="Mrs">Mrs.</option>
                                    <option value="Miss">Miss.</option>
                                    <option value="Ms">Ms.</option>
                                    <option value="Dr">Dr.</option>
                                    <option value="Prof">Prof.</option>
                                </select>
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">First Name</label>
                                <input type="text" name="first_name" placeholder="John" required className="edu-input" value={formData.first_name} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Middle Name</label>
                                <input type="text" name="middle_name" placeholder="Second Name" className="edu-input" value={formData.middle_name} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Last Name</label>
                                <input type="text" name="last_name" placeholder="Doe" required className="edu-input" value={formData.last_name} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Gender</label>
                                <select name="gender" required className="edu-input" value={formData.gender} onChange={handleInputChange}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Date of Birth</label>
                                <div className="edu-input-wrapper">
                                    <Calendar className="edu-input-icon" />
                                    <input type="date" name="dob" required className="edu-input" value={formData.dob} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Contact & Legal */}
                            <div className="edu-col-span-full edu-mt-4 edu-mb-2">
                                <h3 className="edu-flex edu-items-center edu-gap-2 edu-text-sm edu-font-black edu-text-slate-400 edu-uppercase edu-tracking-widest">
                                    <Mail size={14} /> Contact & Legal ID
                                </h3>
                                <div style={{ height: '1px', background: '#E2E8F0', marginTop: '0.5rem' }}></div>
                            </div>

                            <div className="edu-input-group">
                                <label className="edu-input-label">National ID Number</label>
                                <div className="edu-input-wrapper">
                                    <Hash className="edu-input-icon" />
                                    <input type="text" name="national_id" placeholder="ID Number" required className="edu-input" value={formData.national_id} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Email Address</label>
                                <div className="edu-input-wrapper">
                                    <Mail className="edu-input-icon" />
                                    <input type="email" name="email" placeholder="official@edu.com" required className="edu-input" value={formData.email} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Mobile Number</label>
                                <div className="edu-input-wrapper">
                                    <Phone className="edu-input-icon" />
                                    <input type="tel" name="mobile_number" placeholder="+263..." required className="edu-input" value={formData.mobile_number} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Institutional */}
                            <div className="edu-col-span-full edu-mt-4 edu-mb-2">
                                <h3 className="edu-flex edu-items-center edu-gap-2 edu-text-sm edu-font-black edu-text-slate-400 edu-uppercase edu-tracking-widest">
                                    <Building size={14} /> Institutional Data
                                </h3>
                                <div style={{ height: '1px', background: '#E2E8F0', marginTop: '0.5rem' }}></div>
                            </div>

                            <div className="edu-input-group">
                                <label className="edu-input-label">Institution Name</label>
                                <input type="text" name="institutional_name" placeholder="Midlands State University" required className="edu-input" value={formData.institutional_name} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Primary Role</label>
                                <select name="role" required className="edu-input" value={formData.role} onChange={handleInputChange}>
                                    <option value="student">Student</option>
                                    <option value="tutor">Tutor / Staff</option>
                                </select>
                            </div>

                            {formData.role === 'tutor' && (
                                <>
                                    <div className="edu-input-group">
                                        <label className="edu-input-label">Department</label>
                                        <input type="text" name="department" placeholder="Computer Science" required className="edu-input" value={formData.department} onChange={handleInputChange} />
                                    </div>
                                    <div className="edu-input-group">
                                        <label className="edu-input-label">Pay Number</label>
                                        <div className="edu-input-wrapper">
                                            <CreditCard className="edu-input-icon" />
                                            <input type="text" name="pay_number" placeholder="Staff ID / Pay #" required className="edu-input" value={formData.pay_number} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Credentials */}
                            <div className="edu-col-span-full edu-mt-4 edu-mb-2">
                                <h3 className="edu-flex edu-items-center edu-gap-2 edu-text-sm edu-font-black edu-text-slate-400 edu-uppercase edu-tracking-widest">
                                    <ShieldCheck size={14} /> System Credentials
                                </h3>
                                <div style={{ height: '1px', background: '#E2E8F0', marginTop: '0.5rem' }}></div>
                            </div>

                            <div className="edu-input-group">
                                <label className="edu-input-label">Username</label>
                                <input type="text" name="username" placeholder="Choose username" required className="edu-input" value={formData.username} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Secret Password</label>
                                <input type="password" name="password" placeholder="••••••••" required className="edu-input" value={formData.password} onChange={handleInputChange} />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Confirm Password</label>
                                <input type="password" name="confirm_password" placeholder="••••••••" required className="edu-input" value={formData.confirm_password} onChange={handleInputChange} />
                            </div>

                            {/* Consents */}
                            <div className="edu-col-span-full edu-mt-6 edu-p-6" style={{ background: '#F1F5F9', borderRadius: '1.5rem' }}>
                                <div className="edu-space-y-4">
                                    <label className="edu-flex edu-items-center edu-gap-3 edu-cursor-pointer">
                                        <input type="checkbox" name="terms_accepted" checked={formData.terms_accepted} onChange={handleInputChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#10B981' }} />
                                        <span className="edu-text-sm edu-font-bold edu-text-slate-600">I accept the Terms and Conditions of MSU Online.</span>
                                    </label>
                                    <label className="edu-flex edu-items-center edu-gap-3 edu-cursor-pointer">
                                        <input type="checkbox" name="privacy_accepted" checked={formData.privacy_accepted} onChange={handleInputChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#10B981' }} />
                                        <span className="edu-text-sm edu-font-bold edu-text-slate-600">I have read and agree to the Privacy Policy.</span>
                                    </label>
                                    <label className="edu-flex edu-items-center edu-gap-3 edu-cursor-pointer">
                                        <input type="checkbox" name="data_consent_accepted" checked={formData.data_consent_accepted} onChange={handleInputChange} style={{ width: '1.25rem', height: '1.25rem', accentColor: '#10B981' }} />
                                        <span className="edu-text-sm edu-font-bold edu-text-slate-600">I consent to the collection and processing of my academic data.</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="edu-btn edu-btn-primary"
                        style={{
                            marginTop: '2rem',
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)',
                            fontSize: '1rem',
                            borderRadius: '1.25rem'
                        }}
                    >
                        {isLoading ? 'Verifying Credentials...' : (isLogin ? 'Grant Access' : 'Initialize Account')}
                        {!isLoading && (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                    </button>
                </form>

                <div className="edu-text-center" style={{ marginTop: '2.5rem' }}>
                    <p className="edu-text-slate-400 edu-font-bold" style={{ fontSize: '0.9rem' }}>
                        {isLogin ? "New to the MSU community?" : "Already possess an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                marginLeft: '0.6rem',
                                fontWeight: '900',
                                color: '#6366F1',
                                background: 'none',
                                border: 'none',
                                borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isLogin ? 'Establish Profile' : 'Authenticate Identity'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
