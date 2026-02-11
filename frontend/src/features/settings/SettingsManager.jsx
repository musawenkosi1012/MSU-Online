
import React, { useState, useEffect } from 'react';
import {
    User, Shield, Lock, Eye, Bell, Sparkles,
    BookOpen, Target, CreditCard, Share2,
    Settings, Save, CheckCircle, AlertCircle, Loader2,
    Smartphone, Monitor, Globe, Mail, Trash2, Github, Linkedin, Clock
} from 'lucide-react';

const SettingsManager = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState('identity');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const role = currentUser?.role || 'student';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/settings/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Parse JSON strings from backend
            const parsedData = {};
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    try { parsedData[key] = JSON.parse(data[key]); }
                    catch { parsedData[key] = {}; }
                } else {
                    parsedData[key] = data[key] || {};
                }
            });
            setSettings(parsedData);
        } catch (err) {
            console.error("Failed to load settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (section, data) => {
        setSaving(true);
        setSaveStatus(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/settings/${section}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                setSaveStatus('success');
                setSettings(prev => ({
                    ...prev,
                    [section]: { ...prev[section], ...data }
                }));
            } else {
                const err = await res.json();
                setSaveStatus(`Error: ${err.detail || 'Save failed'}`);
            }
        } catch (err) {
            setSaveStatus('Network error');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="edu-flex edu-items-center edu-justify-center" style={{ height: '70vh' }}>
                <Loader2 className="edu-spin" color="var(--edu-indigo)" size={48} />
            </div>
        );
    }

    const navItems = [
        { id: 'identity', label: 'Account & Identity', icon: User, roles: ['student', 'tutor', 'admin'] },
        { id: 'security', label: 'Security & Access', icon: Shield, roles: ['student', 'tutor', 'admin'] },
        { id: 'privacy', label: 'Privacy & Data', icon: Eye, roles: ['student', 'tutor', 'admin'] },
        { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['student', 'tutor', 'admin'] },
        { id: 'learning', label: 'Learning Prefs', icon: BookOpen, roles: ['student'] },
        { id: 'teaching', label: 'Teaching Controls', icon: Target, roles: ['tutor'] },
        { id: 'skills', label: 'Skill & Evaluation', icon: Sparkles, roles: ['student', 'tutor', 'admin'] },
        { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['student', 'tutor', 'admin'] },
        { id: 'integrations', label: 'Integrations', icon: Share2, roles: ['student', 'tutor', 'admin'] },
        { id: 'system', label: 'System Admin', icon: Settings, roles: ['admin'] },
    ];

    const visibleNav = navItems.filter(item => item.roles.includes(role));

    const renderSection = () => {
        switch (activeTab) {
            case 'identity':
                return (
                    <div className="edu-animate-in">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Account & Identity</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Legal Name</label>
                                <input
                                    className="edu-input"
                                    value={settings.account_identity?.full_name || currentUser.full_name}
                                    onChange={(e) => setSettings({ ...settings, account_identity: { ...settings.account_identity, full_name: e.target.value } })}
                                    placeholder="Enter legal name"
                                />
                            </div>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Display Name</label>
                                <input
                                    className="edu-input"
                                    value={settings.account_identity?.display_name || ''}
                                    onChange={(e) => setSettings({ ...settings, account_identity: { ...settings.account_identity, display_name: e.target.value } })}
                                    placeholder="How others see you"
                                />
                            </div>
                            <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', border: '1px solid #E2E8F0' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Core System Role</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', background: 'var(--edu-indigo)', color: '#FFF', fontSize: '0.75rem', fontWeight: '800' }}>
                                        {role.toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '0.875rem', color: '#1E293B' }}>Verified MSU Identity</span>
                                </div>
                            </div>
                            <button
                                className="edu-btn edu-btn-primary"
                                onClick={() => handleUpdate('account_identity', settings.account_identity)}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="edu-spin" size={20} /> : <Save size={20} />}
                                Update Identity
                            </button>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="edu-animate-in">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Security & Access</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Lock size={18} /> Two-Factor Authentication
                                </h4>
                                <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Protect your account with an additional layer of security.</p>
                                <button className="edu-btn edu-btn-outline" style={{ width: 'fit-content' }}>Enable TOTP Authenticator</button>
                            </div>

                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <Monitor size={18} /> Active Sessions
                                </h4>
                                {[1, 2].map(i => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: i === 1 ? '1px solid #F1F5F9' : 'none' }}>
                                        <div>
                                            <p style={{ fontWeight: '700', fontSize: '0.875rem' }}>{i === 1 ? 'Chrome on Windows' : 'Mobile App'}</p>
                                            <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>IP: 192.168.1.{i * 45} • {i === 1 ? 'Active Now' : '2 hours ago'}</p>
                                        </div>
                                        {i !== 1 && <button style={{ color: '#DC2626', background: 'none', border: 'none', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' }}>Revoke</button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="edu-animate-in">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Privacy & Data Compliance</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="edu-glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <p style={{ fontWeight: '800' }}>Public Profile Visibility</p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Allow others to see your skill heatmap and certifications.</p>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                                        <input type="checkbox" defaultChecked />
                                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--edu-indigo)', borderRadius: '34px' }}></span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ border: '2px dashed #E2E8F0', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
                                <Globe size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                                <h4 style={{ marginBottom: '0.5rem' }}>GDPR Data Export</h4>
                                <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Download a portable archive of all your learning data, notes, and activity history.</p>
                                <button className="edu-btn edu-btn-outline" style={{ display: 'inline-flex', width: 'auto' }}>Request Data Archive</button>
                            </div>

                            <div style={{ border: '1px solid #FEE2E2', background: '#FEF2F2', borderRadius: '1rem', padding: '1.5rem' }}>
                                <h4 style={{ color: '#991B1B', marginBottom: '0.5rem' }}>Danger Zone</h4>
                                <button style={{ color: '#991B1B', border: '1px solid #991B1B', background: 'none', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Delete Account Performance Data</button>
                            </div>
                        </div>
                    </div>
                );

            case 'learning':
                return (
                    <div className="edu-animate-in">
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Learning Preferences</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="edu-input-group">
                                <label className="edu-input-label">Preferred Insight Language</label>
                                <select className="edu-input" style={{ appearance: 'auto' }}>
                                    <option>English (Academic)</option>
                                    <option>Shona (Vernacular)</option>
                                    <option>Ndebele (Vernacular)</option>
                                </select>
                            </div>

                            <div className="edu-input-group">
                                <label className="edu-input-label">AI Tutoring Pacing</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {['Intensive', 'Balanced', 'Easy'].map(p => (
                                        <button key={p} style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: p === 'Balanced' ? '2px solid var(--edu-indigo)' : '1px solid #E2E8F0', background: p === 'Balanced' ? '#F1F8F6' : '#FFF', fontWeight: '800', cursor: 'pointer' }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1rem', display: 'flex', gap: '1rem' }}>
                                <Sparkles color="var(--edu-indigo)" size={24} />
                                <div>
                                    <p style={{ fontWeight: '800' }}>Personalization Engine</p>
                                    <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Your assessment weighting is currently optimized for Visual-Linguistic learning patterns.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="edu-animate-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Lock size={40} color="#94A3B8" />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
                        <p style={{ color: '#64748B' }}>This professional architecture component is being populated with your institution data.</p>
                    </div>
                );
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1E293B', marginBottom: '0.5rem' }}>System Infrastructure Settings</h1>
                <p style={{ color: '#64748B', fontWeight: '500' }}>Manage your MSU identity, security compliance, and pedagogical preferences.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
                {/* Navigation Sidebar */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {visibleNav.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 1.25rem',
                                borderRadius: '1rem',
                                border: 'none',
                                background: activeTab === item.id ? 'var(--edu-indigo)' : 'transparent',
                                color: activeTab === item.id ? '#FFFFFF' : '#64748B',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: '700',
                                textAlign: 'left'
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                            {activeTab === item.id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', background: '#FFF', borderRadius: '50%' }}></div>}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="edu-card" style={{ padding: '3rem', minHeight: '600px', position: 'relative' }}>
                    {saveStatus && (
                        <div style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
                            background: saveStatus === 'success' ? '#DCFCE7' : '#FEE2E2',
                            color: saveStatus === 'success' ? '#166534' : '#991B1B',
                            fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            zIndex: 10, animation: 'edu-fade-in 0.3s ease-out'
                        }}>
                            {saveStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {saveStatus === 'success' ? 'Changes Saved' : saveStatus}
                        </div>
                    )}
                    {renderSection()}
                </main>
            </div>
        </div>
    );
};

export default SettingsManager;
