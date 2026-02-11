import React from 'react';
import { ArrowLeft } from 'lucide-react';

const DashboardTabs = ({ activeTab, setActiveTab, onBack }) => {
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'repository', label: 'Evidence Bank' },
        { id: 'tutor_ai', label: 'MSU AI' }
    ];

    return (
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', borderBottom: '2px solid var(--edu-border-color)', paddingBottom: '0.5rem' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--edu-indigo)' }}>
                <ArrowLeft size={24} />
            </button>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '0.5rem 0',
                        fontSize: '0.875rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: activeTab === tab.id ? 'var(--edu-indigo)' : '#94A3B8',
                        borderBottom: activeTab === tab.id ? '3px solid var(--edu-indigo)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};

export default DashboardTabs;
