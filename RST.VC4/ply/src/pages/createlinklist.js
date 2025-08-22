import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Container } from "react-bootstrap";
import PlyNavbar from "../components/plynavbar";
import "../styles/globals.css";
import Nav from 'react-bootstrap/Nav';
import { APIURLS } from '../utils/config';
import { postWithAuth } from '../utils/api';
import { toast } from 'react-toastify';

// Step 1: Website Info
const WizardStepWebsiteInfo = ({ next, formData, setFormData }) => {
    const [websiteName, setWebsiteName] = useState(formData.websiteName || '');
    const [name, setName] = useState(formData.name || '');
    const [line, setLine] = useState(formData.line || '');
    const [photo, setPhoto] = useState(formData.photo || '');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();

    const handleBlur = () => {
        setFormData({ ...formData, websiteName, name, line, photo });
    };

    const handleNext = async () => {
        try {
            setLoading(true);
            setErrors([]);
            const r = await postWithAuth(`${APIURLS.userWebsite}/isuniquename`, navigate, { name: websiteName }, { retries: 0 });
            setLoading(false);
            if (r.result) {
                setFormData({ ...formData, websiteName, name, line, photo });
                next();
            } else {
                setErrors(r.errors || ["Website name is not unique."]);
            }
        } catch (err) {
            setLoading(false);
            setErrors([err.message || 'Failed to check website name.']);
            console.error('Failed to create:', err.message);
        }
    };

    // Handle image upload, resize, and convert to base64
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new window.Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = 300;
                canvas.height = 300;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 300, 300);
                // Draw image centered and cover
                let sx = 0, sy = 0, sw = img.width, sh = img.height;
                if (img.width > img.height) {
                    sx = (img.width - img.height) / 2;
                    sw = sh = img.height;
                } else if (img.height > img.width) {
                    sy = (img.height - img.width) / 2;
                    sw = sh = img.width;
                }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 300, 300);
                const base64 = canvas.toDataURL('image/png');
                setPhoto(base64);
                setFormData({ ...formData, photo: base64 });
                setUploading(false);
            };
            img.onerror = function () {
                setUploading(false);
                alert('Invalid image file.');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">🔗 Create Link List Website</h2>
            <div className="mb-3">
                <label className="form-label">Website Name *</label>
                <input
                    type="text"
                    value={websiteName}
                    onChange={e => setWebsiteName(e.target.value)}
                    maxLength={50}
                    minLength={3}
                    required
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                <div className="text-end"><small>Min 3, Max 50 characters. Must be unique.<br/>Example: <b>my-links</b>, <b>rajkiran-links</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={100}
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                <div className="text-end"><small>Example: <b>Raj Kiran Singh</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Tagline</label>
                <input
                    type="text"
                    value={line}
                    onChange={e => setLine(e.target.value)}
                    maxLength={250}
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                <div className="text-end"><small>Describe your link list in one line.<br/>Example: <b>All my important links in one place</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                />
                {uploading && <div>Uploading...</div>}
                {photo && <div className="mt-2"><img src={photo} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ccc' }} /></div>}
                <div className="text-end"><small>Upload a square image. It will be resized to 300x300px and converted to base64.<br/>Example: <b>Your profile photo or logo</b></small></div>
            </div>
            {errors.length > 0 && (
                <div className="mb-2">
                    <ul>
                        {errors.map((item, idx) => <li key={idx} className="text-danger">{item}</li>)}
                    </ul>
                </div>
            )}
            <div className="wizard-controls pt-4">
                <button onClick={handleNext} disabled={websiteName.length < 3 || loading} type="button" className="btn btn-primary">
                    {loading ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : null}
                    Next <i className="bi bi-arrow-right-circle ms-2"></i>
                </button>
            </div>
        </div>
    );
};

// Step 2: Add Links
const WizardStepLinks = ({ next, prev, formData, setFormData }) => {
    const [links, setLinks] = useState(formData.links || [{ title: '', url: '' }]);

    const handleLinkChange = (idx, field, value) => {
        const updated = links.map((l, i) => i === idx ? { ...l, [field]: value } : l);
        setLinks(updated);
    };
    const addLink = () => setLinks([...links, { title: '', url: '' }]);
    const removeLink = (idx) => setLinks(links.filter((_, i) => i !== idx));

    useEffect(() => { setFormData({ ...formData, links }); }, [links]);

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">🔗 Add Links</h2>
            {links.map((link, idx) => (
                <div className="mb-3 row" key={idx}>
                    <div className="col-md-5">
                        <input
                            type="text"
                            value={link.title}
                            onChange={e => handleLinkChange(idx, 'title', e.target.value)}
                            placeholder="Link Title"
                            className="form-control"
                        />
                        <div className="text-end"><small>Example: <b>My Portfolio</b>, <b>GitHub</b>, <b>Resume</b></small></div>
                    </div>
                    <div className="col-md-5">
                        <input
                            type="text"
                            value={link.url}
                            onChange={e => handleLinkChange(idx, 'url', e.target.value)}
                            placeholder="https://example.com"
                            className="form-control"
                        />
                        <div className="text-end"><small>Example: <b>https://github.com/rajkiransingh</b></small></div>
                    </div>
                    <div className="col-2">
                        <button className="btn btn-danger" onClick={() => removeLink(idx)} disabled={links.length === 1}>
                            <i className="bi bi-trash me-1"></i>
                        </button>
                    </div>
                </div>
            ))}
            <button className="btn btn-secondary mb-3" onClick={addLink}>
                <i className="bi bi-plus-circle me-2"></i>Add Another Link
            </button>
            <div className="wizard-controls pt-4">
                <button onClick={prev} type="button" className="btn btn-secondary">
                    <i className="bi bi-arrow-left-circle me-2"></i>Back
                </button>
                <button onClick={next} type="button" className="btn btn-primary">
                    Next <i className="bi bi-arrow-right-circle ms-2"></i>
                </button>
            </div>
        </div>
    );
};

// Step 3: Social Links
const WizardStepSocialLinks = ({ next, prev, formData, setFormData }) => {
    const [social, setSocial] = useState({
        youtube: formData.youtube || '',
        instagram: formData.instagram || '',
        linkedIn: formData.linkedIn || '',
        twitter: formData.twitter || '',
        facebook: formData.facebook || '',
        telegram: formData.telegram || '',
        whatsApp: formData.whatsApp || ''
    });
    useEffect(() => { setFormData({ ...formData, ...social }); }, [social]);
    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">🌐 Social Links (Optional)</h2>
            {['youtube','instagram','linkedIn','twitter','facebook','telegram','whatsApp'].map(key => (
                <div className="mb-3" key={key}>
                    <label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                    <input
                        type="text"
                        value={social[key]}
                        onChange={e => setSocial({ ...social, [key]: e.target.value })}
                        className="form-control"
                        placeholder={
                            key === 'youtube' ? 'https://youtube.com/@yourchannel' :
                            key === 'instagram' ? 'https://instagram.com/yourprofile' :
                            key === 'linkedIn' ? 'https://linkedin.com/in/yourprofile' :
                            key === 'twitter' ? '@yourhandle' :
                            key === 'facebook' ? 'https://facebook.com/yourprofile' :
                            key === 'telegram' ? 'yourtelegramusername' :
                            key === 'whatsApp' ? '+919876543210' : ''
                        }
                    />
                    <div className="text-end"><small>
                        Example: {
                            key === 'youtube' ? 'https://youtube.com/@Bookwormfrom1983' :
                            key === 'instagram' ? 'https://instagram.com/Bookwormfrom1983' :
                            key === 'linkedIn' ? 'https://linkedin.com/in/rajkiran' :
                            key === 'twitter' ? '@rajkiransingh' :
                            key === 'facebook' ? 'https://facebook.com/singhrajkiran' :
                            key === 'telegram' ? 'rajkiransingh' :
                            key === 'whatsApp' ? '+919876543210' : ''
                        }
                    </small></div>
                </div>
            ))}
            <div className="wizard-controls pt-4">
                <button onClick={prev} type="button" className="btn btn-secondary">
                    <i className="bi bi-arrow-left-circle me-2"></i>Back
                </button>
                <button onClick={next} type="button" className="btn btn-primary">
                    Next <i className="bi bi-arrow-right-circle ms-2"></i>
                </button>
            </div>
        </div>
    );
};

// Step 4: Review & Submit
const WizardStepReview = ({ prev, formData, submit, loading, errors }) => (
    <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
        <h2 className="title mb-3">Review & Submit</h2>
        <div className="mb-2"><b>Website Name:</b> {formData.websiteName}</div>
        <div className="mb-2"><b>Name:</b> {formData.name}</div>
        <div className="mb-2"><b>Tagline:</b> {formData.line}</div>
        <div className="mb-2"><b>Photo:</b> {formData.photo ? <img src={formData.photo} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ccc' }} /> : <span>No photo</span>}</div>
        <div className="mb-2"><b>Links:</b>
            <ul>
                {formData.links && formData.links.map((l, i) => <li key={i}>{l.title}: {l.url}</li>)}
            </ul>
        </div>
        <div className="mb-2"><b>Social:</b>
            <ul>
                {['youtube','instagram','linkedIn','twitter','facebook','telegram','whatsApp'].map(key => formData[key] && <li key={key}>{key}: {formData[key]}</li>)}
            </ul>
        </div>
        {errors.length > 0 && <div className="text-danger mb-3"><ul>{errors.map((e,i) => <li key={i}>{e}</li>)}</ul></div>}
        <div className="wizard-controls pt-4">
            <button onClick={prev} className="btn btn-secondary">
                <i className="bi bi-arrow-left-circle me-2"></i>Back
            </button>
            <button onClick={submit} className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</> : <><i className="bi bi-check-circle me-2"></i>Create Link List Website</>}
            </button>
        </div>
    </div>
);

export default function CreateLinkList() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();
    const maxSteps = 3;

    const next = () => setStep(s => Math.min(s + 1, maxSteps));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const submit = async () => {
        setLoading(true);
        setErrors([]);
        try {
            const response = await postWithAuth(
                `${APIURLS.userWebsite}/createlinklist`,
                navigate,
                {
                    WebsiteName: formData.websiteName,
                    ThemeId: formData.themeId || "00000000-0000-0000-0000-000000000000", // Replace with actual theme selection if needed
                    Name: formData.name,
                    Line: formData.line,
                    Photo: formData.photo,
                    Links: formData.links,
                    Youtube: formData.youtube,
                    Instagram: formData.instagram,
                    LinkedIn: formData.linkedIn,
                    Twitter: formData.twitter,
                    Facebook: formData.facebook,
                    Telegram: formData.telegram,
                    WhatsApp: formData.whatsApp
                }
            );
            if (response.result) {
                toast.success('Link List Website created successfully!');
                navigate('/');
            } else {
                setErrors(response.errors || ['Unknown error']);
            }
        } catch (err) {
            setErrors([err.message]);
        }
        setLoading(false);
    };

    return (
        <>
            <PlyNavbar showLoginPopup={null}>
                <Nav className="justify-content-end flex-grow-1 pe-3"></Nav>
            </PlyNavbar>
            <Container className="my-5">
                {step === 0 && <WizardStepWebsiteInfo next={next} formData={formData} setFormData={setFormData} />}
                {step === 1 && <WizardStepLinks next={next} prev={prev} formData={formData} setFormData={setFormData} />}
                {step === 2 && <WizardStepSocialLinks next={next} prev={prev} formData={formData} setFormData={setFormData} />}
                {step === 3 && <WizardStepReview prev={prev} formData={formData} submit={submit} loading={loading} errors={errors} />}
            </Container>
        </>
    );
}
