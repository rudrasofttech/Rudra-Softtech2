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
    const [company, setCompany] = useState(formData.company || '');
    const [tagLine, setTagLine] = useState(formData.tagLine || '');
    const [logo, setLogo] = useState(formData.logo || '');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();

    const handleBlur = () => {
        setFormData({ ...formData, websiteName, company, tagLine, logo });
    };

    const handleNext = async () => {
        try {
            setLoading(true);
            setErrors([]);
            const r = await postWithAuth(`${APIURLS.userWebsite}/isuniquename`, navigate, { name: websiteName }, { retries: 0 });
            setLoading(false);
            if (r.result) {
                setFormData({ ...formData, websiteName, company, tagLine, logo });
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
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new window.Image();
            img.onload = function () {
                // Calculate new size while maintaining aspect ratio
                let targetW = 300, targetH = 300;
                let scale = Math.min(targetW / img.width, targetH / img.height, 1);
                let newW = Math.round(img.width * scale);
                let newH = Math.round(img.height * scale);
                // Center the image on a 300x300 canvas
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, targetW, targetH);
                const dx = Math.round((targetW - newW) / 2);
                const dy = Math.round((targetH - newH) / 2);
                ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, newW, newH);
                const base64 = canvas.toDataURL('image/png');
                setLogo(base64);
                setFormData({ ...formData, logo: base64 });
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
            <h2 className="title mb-3">💼 Create vCard Website</h2>
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
                <div className="text-end"><small>Min 3, Max 50 characters. Must be unique.<br/>Example: <b>my-vcard</b>, <b>rajkiran-card</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Company/Business Name</label>
                <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    maxLength={100}
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                <div className="text-end"><small>Example: <b>Rudra Softtech</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Tagline</label>
                <input
                    type="text"
                    value={tagLine}
                    onChange={e => setTagLine(e.target.value)}
                    maxLength={250}
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                <div className="text-end"><small>Describe your business in one line.<br/>Example: <b>We build the future</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Logo/Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                />
                {uploading && <div>Uploading...</div>}
                {logo && <div className="mt-2"><img src={logo} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ccc' }} /></div>}
                <div className="text-end"><small>Upload a square image. It will be resized to 300x300px and converted to base64.<br/>Example: <b>Your company logo or your photo</b></small></div>
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

// Step 2: Personal Info
const WizardStepPersonalInfo = ({ next, prev, formData, setFormData }) => {
    const [personName, setPersonName] = useState(formData.personName || '');
    const [designation, setDesignation] = useState(formData.designation || '');
    const [email, setEmail] = useState(formData.email || '');
    const [address, setAddress] = useState(formData.address || '');
    const [aboutInfo, setAboutInfo] = useState(formData.aboutInfo || '');

    useEffect(() => {
        setFormData({ ...formData, personName, designation, email, address, aboutInfo });
    }, [personName, designation, email, address, aboutInfo]);

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">👤 Personal Information</h2>
            <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" value={personName} onChange={e => setPersonName(e.target.value)} maxLength={80} className="form-control form-control-lg" />
                <div className="text-end"><small>Example: <b>Raj Kiran Singh</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} maxLength={50} className="form-control form-control-lg" />
                <div className="text-end"><small>Example: <b>CEO, Owner, Director</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} className="form-control form-control-lg" />
                <div className="text-end"><small>Example: <b>myemail@gmail.com</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} maxLength={200} className="form-control form-control-lg" />
                <div className="text-end"><small>Example: <b>112, Janpath, New Delhi 110022</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">About</label>
                <input type="text" value={aboutInfo} onChange={e => setAboutInfo(e.target.value)} maxLength={500} className="form-control form-control-lg" />
                <div className="text-end"><small>Write something about yourself or your business.</small></div>
            </div>
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

// Step 3: Phone Numbers
const WizardStepPhoneNumbers = ({ next, prev, formData, setFormData }) => {
    const [phone1, setPhone1] = useState(formData.phone1 || '');
    const [phone2, setPhone2] = useState(formData.phone2 || '');
    const [phone3, setPhone3] = useState(formData.phone3 || '');
    useEffect(() => {
        setFormData({ ...formData, phone1, phone2, phone3 });
    }, [phone1, phone2, phone3]);
    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">📞 Phone Numbers</h2>
            <div className="mb-3">
                <label className="form-label">Phone 1 *</label>
                <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)} maxLength={15} className="form-control form-control-lg" />
                <div className="text-end"><small>Example: <b>+91 9876543210</b></small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Phone 2</label>
                <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)} maxLength={15} className="form-control form-control-lg" />
            </div>
            <div className="mb-3">
                <label className="form-label">Phone 3</label>
                <input type="text" value={phone3} onChange={e => setPhone3(e.target.value)} maxLength={15} className="form-control form-control-lg" />
            </div>
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

// Step 4: Social Links
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

// Step 5: Review & Submit
const WizardStepReview = ({ prev, formData, submit, loading, errors }) => (
    <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
        <h2 className="title mb-3">Review & Submit</h2>
        <div className="mb-2"><b>Website Name:</b> {formData.websiteName}</div>
        <div className="mb-2"><b>Company:</b> {formData.company}</div>
        <div className="mb-2"><b>Tagline:</b> {formData.tagLine}</div>
        <div className="mb-2"><b>Logo:</b> {formData.logo ? <img src={formData.logo} alt="Preview" style={{ width: 100, height: 100, objectFit: 'cover', border: '1px solid #ccc' }} /> : <span>No logo</span>}</div>
        <div className="mb-2"><b>Full Name:</b> {formData.personName}</div>
        <div className="mb-2"><b>Designation:</b> {formData.designation}</div>
        <div className="mb-2"><b>Email:</b> {formData.email}</div>
        <div className="mb-2"><b>Address:</b> {formData.address}</div>
        <div className="mb-2"><b>About:</b> {formData.aboutInfo}</div>
        <div className="mb-2"><b>Phones:</b> {[formData.phone1, formData.phone2, formData.phone3].filter(Boolean).join(", ")}</div>
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
                {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</> : <><i className="bi bi-check-circle me-2"></i>Create vCard Website</>}
            </button>
        </div>
    </div>
);

export default function CreateVCard() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();
    const maxSteps = 4;

    const next = () => setStep(s => Math.min(s + 1, maxSteps));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const submit = async () => {
        setLoading(true);
        setErrors([]);
        try {
            const response = await postWithAuth(
                `${APIURLS.userWebsite}/createvcard`,
                navigate,
                {
                    WebsiteName: formData.websiteName,
                    ThemeId: "593e47a0-efe5-4432-afb4-013e802bfe30",
                    Company: formData.company,
                    TagLine: formData.tagLine,
                    Logo: formData.logo,
                    PersonName: formData.personName,
                    Designation: formData.designation,
                    Email: formData.email,
                    Address: formData.address,
                    AboutInfo: formData.aboutInfo,
                    Phone1: formData.phone1,
                    Phone2: formData.phone2,
                    Phone3: formData.phone3,
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
                toast.success('vCard Website created successfully!');
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
                {step === 1 && <WizardStepPersonalInfo next={next} prev={prev} formData={formData} setFormData={setFormData} />}
                {step === 2 && <WizardStepPhoneNumbers next={next} prev={prev} formData={formData} setFormData={setFormData} />}
                {step === 3 && <WizardStepSocialLinks next={next} prev={prev} formData={formData} setFormData={setFormData} />}
                {step === 4 && <WizardStepReview prev={prev} formData={formData} submit={submit} loading={loading} errors={errors} />}
            </Container>
        </>
    );
}
