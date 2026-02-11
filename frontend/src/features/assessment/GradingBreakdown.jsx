import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Info, BarChart } from 'lucide-react';

const GradingBreakdown = ({ breakdown }) => {
    if (!breakdown) return null;

    const { exercises, final_exam, percentage, grade, status } = breakdown;

    const getStatusIcon = () => {
        if (!status) return <Info color="#64748B" size={20} />;
        if (status.includes('Fail')) return <XCircle color="#EF4444" size={20} />;
        if (status.includes('Remedial')) return <AlertTriangle color="#F59E0B" size={20} />;
        return <ShieldCheck color="#10B981" size={20} />;
    };

    const getStatusColor = () => {
        if (!status) return '#F1F5F9';
        if (status.includes('Fail')) return '#FEF2F2';
        if (status.includes('Remedial')) return '#FFFBEB';
        return '#F0FDF4';
    };

    const formatStatus = (s) => s ? s.toUpperCase() : 'NO DATA';

    return (
        <div className="edu-card edu-animate-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1E293B' }}>Academic Weights</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: getStatusColor(), padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                    {getStatusIcon()}
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: status?.includes('Fail') ? '#991B1B' : status?.includes('Remedial') ? '#92400E' : '#065F46' }}>
                        {formatStatus(status)}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Exercises Weighting */}
                <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '1.5rem', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Exercises (40%)</span>
                        <span style={{ fontSize: '1rem', fontWeight: '900', color: '#1E293B' }}>{exercises?.score || 0}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: '#94A3B8' }}>MCQ (40%)</span>
                            <span style={{ fontWeight: '700' }}>{exercises?.mcq || 0}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: '#94A3B8' }}>Open-Ended (60%)</span>
                            <span style={{ fontWeight: '700', color: (exercises?.open || 0) < 30 ? '#EF4444' : '#1E293B' }}>{exercises?.open || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Final Exam Weighting */}
                <div style={{ padding: '1.5rem', background: '#F5F3FF', borderRadius: '1.5rem', border: '1px solid #EDE9FE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--edu-indigo)', textTransform: 'uppercase' }}>Final Exam (60%)</span>
                        <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--edu-indigo)' }}>{final_exam?.score || 0}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: '#94A3B8' }}>MCQ (40%)</span>
                            <span style={{ fontWeight: '700' }}>{final_exam?.mcq || 0}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                            <span style={{ color: '#94A3B8' }}>Open-Ended (60%)</span>
                            <span style={{ fontWeight: '700', color: (final_exam?.open || 0) < 40 ? '#EF4444' : 'var(--edu-indigo)' }}>{final_exam?.open || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F1F5F9', borderRadius: '1rem' }}>
                <Info size={18} color="#64748B" />
                <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                    Final Grade is calculated as:
                    <code style={{ background: '#E2E8F0', padding: '2px 4px', borderRadius: '4px', margin: '0 4px' }}>(Exercises * 0.4) + (Final Exam * 0.6)</code>.
                    Mandatory minimums apply to Open-Ended sections.
                </p>
            </div>
        </div>
    );
};

export default GradingBreakdown;
