import React, { useState } from 'react';
import { Save, Plus, Trash2, MoveUp, MoveDown, BookOpen, Layers } from 'lucide-react';

const TextbookEditor = ({ textbook, onSave, onCancel }) => {
    const [structure, setStructure] = useState(JSON.parse(JSON.stringify(textbook))); // Deep copy

    const handleChapterChange = (cIdx, field, value) => {
        const newChapters = [...structure.chapters];
        newChapters[cIdx][field] = value;
        setStructure({ ...structure, chapters: newChapters });
    };

    const handleSectionChange = (cIdx, sIdx, field, value) => {
        const newChapters = [...structure.chapters];
        newChapters[cIdx].sections[sIdx][field] = value;
        setStructure({ ...structure, chapters: newChapters });
    };

    const addChapter = () => {
        const newChapters = [...(structure.chapters || [])];
        newChapters.push({
            chapter_id: `ch_${Date.now()}`,
            title: "New Chapter",
            intro: "",
            sections: [],
            order: newChapters.length
        });
        setStructure({ ...structure, chapters: newChapters });
    };

    const addSection = (cIdx) => {
        const newChapters = [...structure.chapters];
        newChapters[cIdx].sections.push({
            title: "New Section",
            content: "",
            order: newChapters[cIdx].sections.length,
            learning_objectives: [],
            key_terms: []
        });
        setStructure({ ...structure, chapters: newChapters });
    };

    const deleteChapter = (cIdx) => {
        if (!window.confirm("Delete this chapter and all its contents?")) return;
        const newChapters = structure.chapters.filter((_, i) => i !== cIdx);
        setStructure({ ...structure, chapters: newChapters });
    };

    const deleteSection = (cIdx, sIdx) => {
        const newChapters = [...structure.chapters];
        newChapters[cIdx].sections = newChapters[cIdx].sections.filter((_, i) => i !== sIdx);
        setStructure({ ...structure, chapters: newChapters });
    };

    const moveChapter = (cIdx, direction) => {
        if ((direction === -1 && cIdx === 0) || (direction === 1 && cIdx === structure.chapters.length - 1)) return;
        const newChapters = [...structure.chapters];
        const temp = newChapters[cIdx];
        newChapters[cIdx] = newChapters[cIdx + direction];
        newChapters[cIdx + direction] = temp;
        setStructure({ ...structure, chapters: newChapters });
    };

    return (
        <div className="edu-animate-in" style={{ padding: '2rem', background: '#FFFFFF', borderRadius: '1.5rem', border: '1px solid #E2E8F0', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Layers color="var(--edu-indigo)" /> Structure Editor
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onCancel} style={{ padding: '0.75rem 1.5rem', border: '1px solid #CBD5E1', background: 'transparent', borderRadius: '0.75rem', fontWeight: '600', color: '#64748B', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={() => onSave(structure)} style={{ padding: '0.75rem 1.5rem', background: 'var(--edu-indigo)', border: 'none', borderRadius: '0.75rem', fontWeight: '700', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> Save Structure
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {structure.chapters?.map((chapter, cIdx) => (
                    <div key={chapter.chapter_id || cIdx} style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', padding: '1.5rem', background: '#F8FAFC' }}>

                        {/* Chapter Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <button onClick={() => moveChapter(cIdx, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><MoveUp size={16} /></button>
                                <button onClick={() => moveChapter(cIdx, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><MoveDown size={16} /></button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Chapter {cIdx + 1} Title</label>
                                <input
                                    type="text"
                                    value={chapter.title}
                                    onChange={(e) => handleChapterChange(cIdx, 'title', e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: '800', marginTop: '0.25rem' }}
                                />
                            </div>
                            <button onClick={() => deleteChapter(cIdx)} style={{ color: '#EF4444', background: '#FEE2E2', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Intro Field */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8' }}>Introduction / Context (for AI)</label>
                            <textarea
                                value={chapter.intro || ""}
                                onChange={(e) => handleChapterChange(cIdx, 'intro', e.target.value)}
                                rows={2}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.875rem', marginTop: '0.25rem', resize: 'vertical' }}
                                placeholder="Briefly describe what this chapter covers..."
                            />
                        </div>

                        {/* Sections List */}
                        <div style={{ paddingLeft: '1.5rem', borderLeft: '2px solid #E2E8F0' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', marginBottom: '0.75rem' }}>Sections</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {chapter.sections?.map((section, sIdx) => (
                                    <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <BookOpen size={16} color="#94A3B8" />
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => handleSectionChange(cIdx, sIdx, 'title', e.target.value)}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            placeholder="Section Title"
                                        />
                                        <button onClick={() => deleteSection(cIdx, sIdx)} style={{ color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                            <X size={16} /> {/* Note: Assuming X is imported or trash icon */}
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addSection(cIdx)}
                                    style={{
                                        padding: '0.5rem', border: '1px dashed #CBD5E1', borderRadius: '0.5rem',
                                        color: '#64748B', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'
                                    }}
                                >
                                    <Plus size={16} /> Add Section
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addChapter}
                    style={{
                        padding: '1rem', background: '#F1F5F9', border: '2px dashed #CBD5E1', borderRadius: '1rem',
                        color: '#475569', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                    }}
                >
                    <Plus size={20} /> Add New Chapter
                </button>
            </div>
        </div>
    );
};

export default TextbookEditor;
