import React from 'react';
import {
    Sparkles,
    Library,
    ClipboardCheck,
    BookMarked,
    Layout,
    LogOut,
    Home,
    GraduationCap,
    FlaskConical,
    Compass,
    FileCheck,
    Brain,
    Terminal,
    Settings
} from 'lucide-react';
import { getMasteryBadge } from '../utils/mastery';


const Sidebar = ({
    isSidebarOpen,
    setIsSidebarOpen,
    activeTab,
    setActiveTab,
    mastery,
    currentUser,
    handleLogout
}) => {
    return (
        <aside style={{
            width: isSidebarOpen ? '280px' : '80px',
            background: '#1E293B',
            color: '#FFFFFF',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 50,
            boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
        }}>
            <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--edu-indigo)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={24} />
                </div>
                {isSidebarOpen && <span style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.025em' }}>MSU Online</span>}
            </div>

            <nav style={{ padding: '1.5rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentUser.role === 'tutor' ? (
                    <button
                        onClick={() => setActiveTab('tutor')}
                        className="edu-sidebar-item"
                        style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'tutor' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                    >
                        <Layout size={20} /> {isSidebarOpen && 'Tutor Dashboard'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setActiveTab('student_dashboard')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'student_dashboard' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Home size={20} /> {isSidebarOpen && 'Dashboard'}
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'catalog' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Library size={20} /> {isSidebarOpen && 'Course Catalogue'}
                        </button>
                        <button
                            onClick={() => setActiveTab('exercises')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'exercises' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <GraduationCap size={20} /> {isSidebarOpen && 'Exercises'}
                        </button>
                        <button
                            onClick={() => setActiveTab('final_exam')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'final_exam' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <FileCheck size={20} /> {isSidebarOpen && 'Final Exam'}
                        </button>
                        <button
                            onClick={() => setActiveTab('musa_ai')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'musa_ai' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Brain size={20} /> {isSidebarOpen && 'Musa AI Hub'}
                        </button>
                        <button
                            onClick={() => setActiveTab('coding_lab')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'coding_lab' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Terminal size={20} /> {isSidebarOpen && 'Coding Lab'}
                        </button>
                        <button
                            onClick={() => setActiveTab('research_hub')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'research_hub' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Compass size={20} /> {isSidebarOpen && 'Research Hub'}
                        </button>
                        <button
                            onClick={() => setActiveTab('learning_hub')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'learning_hub' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <FlaskConical size={20} /> {isSidebarOpen && 'Learning Hub'}
                        </button>
                        <button
                            onClick={() => setActiveTab('notebook')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'notebook' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <BookMarked size={20} /> {isSidebarOpen && 'Study Notebook'}
                        </button>


                        <button
                            onClick={() => setActiveTab('settings')}
                            className="edu-sidebar-item"
                            style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: activeTab === 'settings' ? 'var(--edu-indigo)' : 'transparent', color: '#FFFFFF', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            <Settings size={20} /> {isSidebarOpen && 'System Settings'}
                        </button>

                        {isSidebarOpen && (
                            <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                                    <span style={{ opacity: 0.6 }}>Mastery: {getMasteryBadge(mastery).label}</span>
                                    <span style={{ color: '#FCD34D', fontWeight: '900' }}>{mastery}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '0.5rem' }}>
                                    <div style={{
                                        width: `${mastery}%`,
                                        height: '100%',
                                        background: getMasteryBadge(mastery).color,
                                        borderRadius: '3px',
                                        boxShadow: `0 0 10px ${getMasteryBadge(mastery).color}80`,
                                        transition: 'all 0.5s ease-out'
                                    }}></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.625rem', color: '#94A3B8', fontWeight: '700' }}>
                                    {React.createElement(getMasteryBadge(mastery).icon, { size: 10, color: getMasteryBadge(mastery).color })}
                                    Rank: {getMasteryBadge(mastery).label}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(239,68,68,0.1)', color: '#F87171', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
                >
                    <LogOut size={20} /> {isSidebarOpen && 'Secure Sign Out'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
