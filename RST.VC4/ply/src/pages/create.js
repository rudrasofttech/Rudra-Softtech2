'use client'

import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Container } from "react-bootstrap";
import PlyNavbar from "../components/plynavbar";
import "../styles/globals.css";
import Nav from 'react-bootstrap/Nav';
import { APIURLS } from '../utils/config';
import { postWithAuth } from '../utils/api';
import { toast } from 'react-toastify';

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

const WizardStepCompanyInfo = ({ next, prev, formData, setFormData }) => {
    const [company, setCompany] = useState(formData.company || '');
    const [tagLine, setTagLine] = useState(formData.tagLine || '');

    // Update parent formData on blur or change
    const handleBlur = () => {
        setFormData({ company, tagLine });
    };

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">🏢 Tell us about your company</h2>
            <div className="mb-3">
                <label className="form-label">Company Name *</label>
                <input
                    type="text"
                    name="company"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Your company name"
                    required
                    maxLength={80}
                    className="form-control form-control-lg"
                    onBlur={handleBlur}
                />
                {company.length === 0 && (
                    <div className="text-end">
                        <small className="text-danger">Required</small>
                    </div>
                )}
                <div className="text-end"><small>Write your organization / business name here.</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Tagline</label>
                <input
                    type="text"
                    name="tagLine"
                    value={tagLine}
                    onChange={e => setTagLine(e.target.value)}
                    placeholder="e.g. We build the future"
                    className="form-control form-control-lg"
                    maxLength={120}
                    onBlur={handleBlur}
                    disabled={company.length === 0}
                />
                <div className="text-end">
                    <small>Describe your company in one line.</small>
                </div>
            </div>
            <div className="wizard-controls pt-4">
                <button onClick={prev} type="button" className="btn btn-secondary">Back</button>
                <button
                    onClick={next}
                    disabled={company.length === 0}
                    type="button"
                    className="btn btn-primary"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const WizardStepUserInfo = ({ next, prev, formData, setFormData }) => {
    const [name, setName] = useState(formData.name);
    const [designation, setDesignation] = useState(formData.designation);
    const [email, setEmail] = useState(formData.email);
    const [address, setAddress] = useState(formData.address);

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">👤 Tell us about yourself</h2>
            <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input type="text" name="fullName" value={name}
                    onChange={(e) => { setName(e.target.value); }}
                    placeholder="Your name" required maxLength={50}
                    className="form-control form-control-lg"
                    onBlur={() => { setFormData({ name, designation, email, address }); }}
                />
                {name.length === 0 ? <div className="text-end"><small className="text-danger">Required</small></div> : null}
            </div>
            <div className="mb-3">
                <label className="form-label">Designation</label>
                <input disabled={name.length === 0}
                    type="text"
                    name="designation"
                    value={designation}
                    onChange={(e) => { setDesignation(e.target.value); }}
                    placeholder=""
                    className="form-control form-control-lg"
                    maxLength={80}
                    onBlur={() => { setFormData({ name, designation, email, address }); }}
                />
                <div className="text-end"><small>Example- Designer, Developer, CEO, Director</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input disabled={name.length === 0}
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); }}
                    placeholder=""
                    className="form-control form-control-lg"
                    maxLength={100}
                    onBlur={() => { setFormData({ name, designation, email, address }); }}
                />
                <div className="text-end"><small>Example- you@example.com</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Address</label>
                <input disabled={name.length === 0}
                    type="text"
                    name="address"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); }}
                    placeholder=""
                    className="form-control form-control-lg"
                    maxLength={200}
                    onBlur={() => { setFormData({ name, designation, email, address }); }}
                />
                <div className="text-end"><small>Example- 112, Janpath, New Delhi 110022</small></div>
            </div>
            <div className="wizard-controls pt-4">
                <button onClick={prev} type="button" className="btn btn-secondary">Back</button>
                <button onClick={next} disabled={name.length === 0} type="button" className="btn btn-primary">Next</button>
            </div>
        </div>
    );
};

const WizardStepPhoneNumbers = ({ next, prev, phoneNumbers, setPhoneNumbers }) => {
    const [localNumbers, setLocalNumbers] = useState(phoneNumbers || ['', '', '']);

    const handleChange = (index, value) => {
        const updated = [...localNumbers];
        updated[index] = value;
        setLocalNumbers(updated);
        //setPhoneNumbers?.(updated); // Optional: sync to parent or Zustand
    };

    const canContinue = localNumbers[0]?.trim().length > 0;

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-3">📞 Enter up to 3 phone numbers</h2>

            {[0, 1, 2].map((i) => (
                <div className="mb-3" key={i}>
                    <label className="form-label">{`Phone Number ${i + 1}${i === 0 ? ' *' : ''}`}</label>
                    <input
                        type="tel"
                        value={localNumbers[i]}
                        onChange={(e) => handleChange(i, e.target.value)}

                        className="form-control form-control-lg"
                        maxLength={14} // Adjust as needed for phone number format
                        onBlur={() => setPhoneNumbers?.(localNumbers)} // Sync to parent or Zustand
                    />
                    <div className="text-end"><small>Example: +91 9876543210</small></div>
                </div>
            ))}
            {!canContinue && (
                <p style={{ color: 'red' }}>Please enter at least the first phone number to continue.</p>
            )}
            <div className="wizard-controls">
                <button onClick={prev} type="button" className="btn btn-secondary">Back</button>
                <button onClick={next} type="button" className="btn btn-primary">Next</button>
            </div>
        </div>
    );
};

const WizardStepSocialLinks = ({ next, prev, socialLinks, setSocialLinks }) => {
    const [wa, setWhatsapp] = useState(socialLinks.whatsapp || '');
    const [tw, setTwitter] = useState(socialLinks.twitter || '');
    const [fb, setFacebook] = useState(socialLinks.facebook || '');

    useEffect(() => {
        setWhatsapp(socialLinks.whatsapp || '');
        setTwitter(socialLinks.twitter || '');
        setFacebook(socialLinks.facebook || '');
    }, [socialLinks]);

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-4">🌐 Share your social links</h2>
            <div className="mb-3">
                <label className="form-label"><i className="bi bi-whatsapp"></i> Whatsapp</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={wa}
                    maxLength={10}
                    onChange={(e) => { setWhatsapp(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, whatsapp: wa })}
                />
                <div className="text-end"><small>Whatsapp number that you want to share.</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Twitter</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={tw}
                    maxLength={200}
                    onChange={(e) => { setTwitter(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, twitter: tw })}
                />
                <div className="text-end"><small>Your twitter handle e.g. @rajkiransingh</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Facebook</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={fb}
                    maxLength={200}
                    onChange={(e) => { setFacebook(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, facebook: fb })}
                />
                <div className="text-end"><small>Example- https://www.facebook.com/singhrajkiran</small></div>
            </div>

            <div className="wizard-controls">
                <button onClick={prev}>Back</button>
                <button onClick={next}>Next</button>
            </div>
        </div>
    );
};

const WizardStepMoreSocialLinks = ({ next, prev, socialLinks, setSocialLinks }) => {
    const [tg, setTelegram] = useState(socialLinks.telegram || '');
    const [yt, setYoutube] = useState(socialLinks.youtube || '');
    const [ig, setInstagram] = useState(socialLinks.instagram || '');
    const [li, setLinkedin] = useState(socialLinks.linkedin || '');

    useEffect(() => {
        setTelegram(socialLinks.telegram || '');
        setYoutube(socialLinks.youtube || '');
        setInstagram(socialLinks.instagram || '');
        setLinkedin(socialLinks.linkedin || '');
    }, [socialLinks]);

    return (
        <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title mb-4">🌐 Share more social links, this is optional</h2>
            <div className="mb-3">
                <label className="form-label">Youtube</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={yt}
                    maxLength={250}
                    onChange={(e) => { setYoutube(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, youtube: yt })}
                />
                <div className="text-end"><small>Example- https://www.youtube.com/@Bookwormfrom1983</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Instagram</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={ig}
                    maxLength={50}
                    onChange={(e) => { setInstagram(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, instagram: ig })}
                />
                <div className="text-end"><small>Example- https://www.instagram.com/Bookwormfrom1983/</small></div>

            </div>
            <div className="mb-3">
                <label className="form-label">LinkedIn</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={li}
                    maxLength={200}
                    onChange={(e) => { setLinkedin(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, linkedin: li })}
                />
                <div className="text-end"><small>Example- https://www.linkedin.com/in/rajkiran/</small></div>
            </div>
            <div className="mb-3">
                <label className="form-label">Telegram</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    value={tg}
                    maxLength={50}
                    onChange={(e) => { setTelegram(e.target.value); }}
                    placeholder=""
                    onBlur={() => setSocialLinks({ ...socialLinks, telegram: tg })}
                />
                <div className="text-end"><small>Your telegram username</small></div>
            </div>
            <div className="wizard-controls">
                <button onClick={prev}>Back</button>
                <button onClick={next}>Next</button>
            </div>
        </div>
    );
};

const WizardStepTheme = ({ prev, next, websiteName, name, logo, designation, email, company, tagLine, phoneNumbers, socialLinks, address, wsType }) => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState([]); // Local state for error messages
    const [loading, setLoading] = useState(false);

    const submitInfo = async () => {
        try {
            setLoading(true);
            let url = "";
            if (wsType === 'vc') {
                url = `${APIURLS.userWebsite}/createvcard`;
            }
            const r = await postWithAuth(url, navigate,
                {
                    websiteName, themeId: "593e47a0-efe5-4432-afb4-013e802bfe30", logo, company, tagLine, personName: name, designation,
                    whatsApp: socialLinks.whatsapp,
                    telegram: socialLinks.telegram,
                    youtube: socialLinks.youtube, instagram: socialLinks.instagram,
                    linkedin: socialLinks.linkedin, twitter: socialLinks.twitter, facebook: socialLinks.facebook,
                    email, address, phone1: phoneNumbers[0], phone2: phoneNumbers[1], phone3: phoneNumbers[2]
                }, { retries: 0 });

            if (r.result) {
                toast.success('Website created successfully!');
                next();
            } else {
                setErrors(r.errors);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }
    return <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
        <h2 className="title mb-3">Review & Submit</h2>
        {name.length > 0 ? <div className="mb-2">
            <label className="form-label me-2">Full Name - </label>
            <label className="form-label fw-bold">{name}</label>
        </div> : null}
        {designation.length > 0 ? <div className="mb-2">
            <label className="form-label me-2">Designation - </label>
            <label className="form-label fw-bold">{designation}</label>
        </div> : null}
        {email.length > 0 ? <div className="mb-2">
            <label className="form-label me-2">Email - </label>
            <label className="form-label fw-bold">{email}</label>
        </div> : null}
        {address.length > 0 ? <div className="mb-2">
            <label className="form-label me-2">Address - </label>
            <label className="form-label fw-bold">{address}</label>
        </div> : null}
        {phoneNumbers && phoneNumbers.length > 0 ? <>
            {phoneNumbers.map((num, index) => {
                if (!num || num.trim().length === 0) return null; // Skip empty numbers
                return <div className="mb-2" key={index}>
                    <label className="form-label me-2">Phone Number - </label>
                    <label className="form-label fw-bold">{num}</label>
                </div>;
            })}
        </> : null}
        {socialLinks && Object.keys(socialLinks).length > 0 ? <>
            {socialLinks.whatsapp ? <div className="mb-2"><label className="form-label me-2">Whatsapp - </label><label className="form-label">{socialLinks.whatsapp}</label></div> : null}
            {socialLinks.telegram ? <div className="mb-2"><label className="form-label me-2">Telegram - </label><label className="form-label">{socialLinks.telegram}</label></div> : null}
            {socialLinks.youtube ? <div className="mb-2"><label className="form-label me-2">Youtube - </label><label className="form-label">{socialLinks.youtube}</label></div> : null}
            {socialLinks.instagram ? <div className="mb-2"><label className="form-label me-2">Instagram - </label><label className="form-label">{socialLinks.instagram}</label></div> : null}
            {socialLinks.linkedin ? <div className="mb-2"><label className="form-label me-2">LinkedIn - </label><label className="form-label">{socialLinks.linkedin}</label></div> : null}
            {socialLinks.twitter ? <div className="mb-2"><label className="form-label me-2">Twitter - </label><label className="form-label">{socialLinks.twitter}</label></div> : null}
            {socialLinks.facebook ? <div className="mb-2"><label className="form-label me-2">Facebook - </label><label className="form-label">{socialLinks.facebook}</label></div> : null}
        </> : null}
        {errors.length > 0 ? <div className="text-danger mb-3">
            <ul>
                {errors.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div> : null}
        <div className="wizard-controls">
            <button disabled={loading} onClick={prev}>Back</button>
            <button disabled={loading} onClick={submitInfo}>Create Website</button>
        </div>
    </div>;
}

export default function Create() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const navigate = useNavigate();
    const [websiteName, setWebsiteName] = useState('');
    const [siteType, setSiteType] = useState('');
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [logo, setLogo] = useState('');
    const [company, setCompany] = useState('');
    const [tagLine, setTagLine] = useState('');
    const [phoneNumbers, setPhoneNumbers] = useState(['', '', '']);
    const [socialLinks, setSocialLinks] = useState({ whatsapp: '', telegram: '', youtube: '', instagram: '', linkedin: '', twitter: '', facebook: '' });
    const maxSteps = 5;
    const next = () => {
        if (step < maxSteps) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    }

    const prev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleFinish = () => {
        console.log('Wizard completed!');
        setRedirectUrl("/");
    };


    useEffect(() => {
        if (redirectUrl) {
            navigate(redirectUrl);
        }
    }, [redirectUrl]);

    return (
        <>
            <PlyNavbar showLoginPopup={null}>
                <Nav className="justify-content-end flex-grow-1 pe-3"></Nav>
            </PlyNavbar>
            <Container className="my-5">

                {step === 0 ? <WSSiteType
                    next={next}
                    onSelectType={(type, name) => {
                        setSiteType(type);
                        setWebsiteName(name); // Update website name in parent state
                    }}
                    wsType={siteType}
                    websiteName={websiteName}
                /> : null}
                {step === 1 ? <WizardStepCompanyInfo
                    next={next}
                    prev={prev}
                    formData={{
                        company,
                        tagLine
                    }}
                    setFormData={(d) => {
                        setCompany(d.company);
                        setTagLine(d.tagLine);
                    }}
                /> : null}
                {step === 2 ? <WizardStepUserInfo
                    next={next}
                    prev={prev}
                    formData={{
                        name,
                        designation,
                        email, address
                    }}
                    setFormData={(d) => {
                        console.log(d);
                        setName(d.name);
                        setDesignation(d.designation);
                        setEmail(d.email);
                        setAddress(d.address);
                    }}
                /> : null}
                {step === 3 ? <WizardStepPhoneNumbers
                    next={next}
                    prev={prev}
                    phoneNumbers={phoneNumbers}
                    setPhoneNumbers={setPhoneNumbers}
                /> : null}
                {step === 4 ? <WizardStepSocialLinks next={next}
                    prev={prev} socialLinks={socialLinks} setSocialLinks={setSocialLinks} /> : null}
                {step === 5 ? <WizardStepMoreSocialLinks next={next} prev={prev} socialLinks={socialLinks} setSocialLinks={setSocialLinks} /> : null}
                {step === 6 ? <WizardStepTheme next={next} prev={prev} name={name} company={company} logo={logo}
                    tagLine={tagLine} websiteName={websiteName} wsType={siteType} address={address}
                    designation={designation} email={email} phoneNumbers={phoneNumbers} socialLinks={socialLinks} /> : null}

            </Container>
        </>
    );
}