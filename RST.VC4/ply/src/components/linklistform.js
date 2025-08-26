import React, { useState, useEffect } from 'react';


export default function LinkListForm({ links = [], setLinks, handleSave, isDirty, setIsDirty }) {
    // const onDragEnd = result => {
    //     if (!result.destination) return;
    //     const reordered = Array.from(links);
    //     const [removed] = reordered.splice(result.source.index, 1);
    //     reordered.splice(result.destination.index, 0, removed);
    //     setLinks(reordered);
    //     setIsDirty(true);
    //     handleSave();
    //     setIsDirty(false);
    // };

    return (
        <>
            {(links || []).map((item, idx) => (
                <div style={{ border: '1px solid #ccc', borderRadius: 8, marginBottom: 20 }}>
                    <div className="d-flex align-items-center justify-content-between p-2" style={{ borderBottom: '1px solid #eee', background: '#f8f9fa', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                        <div className="d-flex align-items-center">
                            <strong style={{ minWidth: 60 }}>
                                {item.title ? item.title : `Link ${idx + 1}` }
                            </strong>
                        </div>
                        <div>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                                const updated = links.filter((_, i) => i !== idx);
                                setLinks(updated);
                                setIsDirty(true);
                            }}><i className='bi bi-trash'/></button>
                        </div>
                    </div>
                    <div className="p-3 pt-2">
                        <div className="row mb-2">
                            <div className="col-6">
                                <input type="text" className="form-control" placeholder="Title" value={item.title}
                                    onChange={e => {
                                        const updated = links.map((l, i) => i === idx ? { ...l, title: e.target.value } : l);
                                        setLinks(updated);
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Enter a descriptive title for this link.</small>
                            </div>
                            <div className="col-6">
                                <input type="text" className="form-control" placeholder="URL" value={item.url}
                                    onChange={e => {
                                        const updated = links.map((l, i) => i === idx ? { ...l, url: e.target.value } : l);
                                        setLinks(updated);
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Paste the full URL (e.g., https://example.com).</small>
                            </div>
                        </div>
                        <div className="mb-2">
                            <input type="text" className="form-control" placeholder="Description" value={item.description || ''}
                                onChange={e => {
                                    const updated = links.map((l, i) => i === idx ? { ...l, description: e.target.value } : l);
                                    setLinks(updated);
                                    setIsDirty(true);
                                }}
                                onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                            />
                            <small className="form-text text-muted">Add a short description (optional).</small>
                        </div>
                    </div>
                </div>
            ))}

        </>
    );
}
