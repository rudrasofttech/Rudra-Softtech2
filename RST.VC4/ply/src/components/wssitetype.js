'use client'

import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/globals.css";
import { APIURLS } from '../utils/config';
import { postWithAuth } from '../utils/api';

const WSSiteType = ({ next, onSelectType, wsType, websiteName }) => {
    const navigate = useNavigate();
    const [type, setType] = useState(wsType); // Local state for name input
    const [name, setName] = useState(websiteName); // Local state for name input
    const [errors, setErrors] = useState([]); // Local state for error messages
    const [loading, setLoading] = useState(false);
    const handleSelect = (t) => {
        setType(t);
    };

    const handleNameChange = (e) => { setName(e.target.value); };

    useEffect(() => {
        setType(wsType);
        setName(websiteName || '');
    }, [wsType, websiteName]);

    const handleNext = async () => {
        try {
            setLoading(true);
            const r = await postWithAuth(`${APIURLS.userWebsite}/isuniquename`, navigate, { name }, { retries: 0 });
            setLoading(false);
            if (r.result) {
                onSelectType?.(type, name); // Expose selected value to parent
                next();
            } else {
                setErrors(r.errors);
            }
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }
    return (
        <div className="wizard-step-type mx-auto bg-light rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title">🚀 What type of site do you want to build?</h2>
            <div className="mb-4 mt-3">
                <label className="form-label fw-bold">Website Name</label>
                <input type="text" name="wsName" className="form-control form-control-lg" value={name} maxLength="50" onChange={handleNameChange} />
                <div className="text-end"><small>Choose a unique and attractive name for your website. It can only contain letter, number and underscores _ .</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label fw-bold">Choose type of website</label>
                <div className="options-grid">
                    <div
                        className={type === "vc" ? "option-card active" : "option-card"}
                        onClick={() => handleSelect('vc')}>
                        <h3>💼 Visiting Card</h3>
                        <p>Minimal profile to showcase your identity with punch.</p>
                    </div>
                    <div
                        className={type === "ll" ? "option-card active" : "option-card"}
                        onClick={() => handleSelect('ll')}>
                        <h3>🔗 Link List</h3>
                        <p>Curated list of links—perfect for creators and professionals.</p>
                    </div>
                </div>
            </div>
            {errors.length > 0 ? <div>
                <ul>
                    {errors.map((item, index) => { return <li key={index} className="text-danger">{item}</li>; })}
                </ul>
            </div> : null}
            <div className="text-end pt-5">
                <button onClick={handleNext} type="button" className="btn btn-primary" style={{ width: "80px" }} disabled={loading || type.length === 0 || name.length === 0}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
                    Next</button>
            </div>
        </div>
    );
};

export default WSSiteType;