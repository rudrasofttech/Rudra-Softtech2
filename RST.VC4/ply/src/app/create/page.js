'use client'
import React from 'react';
import { Merienda } from 'next/font/google';
import { useAuth } from '../context/authprovider'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "react-bootstrap";
import PlyNavbar from "../plynavbar";
import "../globals.css";
import Loader from '../loader';

const ds = Merienda({
    subsets: ['latin'],
});

const WSSiteType = ({ next, onSelectType, wsType, websitename }) => {
    const [type, setType] = useState(wsType); // Local state for name input
    const [name, setName] = useState(websitename); // Local state for name input
    const { isLoggedIn, token } = useAuth();
    const handleSelect = (t) => {
        setType(t); // Update local state
        onSelectType?.(t); // Expose selected value to parent
        //setTimeout(() => { next(); }, 200);
    };
    const handleNameChange = (e) => { setName(e.target.value); };
    useEffect(() => { setName(wsType); }, [wsType]);
    const handleNext = () => {
    }
    return (
        <div className="wizard-step-type mx-auto bg-light rounded" style={{ width: "800px", maxWidth: "100%" }}>
            <h2 className="title">🚀 What type of site do you want to build?</h2>
            <div className="mb-3">
                <label className="form-label">Website Name</label>
                <input type="text" name="wsName" className="form-control form-control-lg" value={name} maxLength="50" onChange={handleNameChange} />
            </div>
            <div className="options-grid">
                <div
                    className={type == "vc" ? "option-card active" : "option-card"}
                    onClick={() => handleSelect('vc')}>
                    <h3>💼 Visiting Card</h3>
                    <p>Minimal profile to showcase your identity with punch.</p>
                </div>
                <div
                    className={type == "ll" ? "option-card active" : "option-card"}
                    onClick={() => handleSelect('ll')}>
                    <h3>🔗 Link List</h3>
                    <p>Curated list of links—perfect for creators and professionals.</p>
                </div>
            </div>
            <div className="text-end pt-5">
                <button onClick={next} type="button" className="btn btn-primary" style={{ width: "80px" }} disabled={type.length === 0 || name.length === 0}>Next</button>
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
                    onBlur={() => { setFormData({ name, designation, email }); }}
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
                    onBlur={() => { setFormData({ name, designation, email }); }}
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
                    onBlur={() => { setFormData({ name, designation, email }); }}
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

const WizardStepTheme = ({ prev, name, designation, email, phoneNumbers, socialLinks }) => <div className="wizard-step mx-auto bg-light p-3 rounded" style={{ width: "800px", maxWidth: "100%" }}>
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
    <div className="wizard-controls">
        <button onClick={prev}>Back</button>
    </div>
</div>;

export default function Create() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const router = useRouter();
    const { isLoggedIn, token } = useAuth();
    //const [dummy, setDummy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [siteType, setSiteType] = useState(null);
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumbers, setPhoneNumbers] = useState(['', '', '']);
    const [socialLinks, setSocialLinks] = useState({ whatsapp: '', telegram: '', youtube: '', instagram: '', linkedin: '', twitter: '', facebook: '' });
    const maxSteps = 5;
    const next = () => {
        if (step <= maxSteps) {
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

    useEffect(() => {
        if (!isLoggedIn) {
            setRedirectUrl("/");
        }
    }, [isLoggedIn]);

    const handleFinish = () => {
        console.log('Wizard completed!');
    };


    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    return (
        <>
            <PlyNavbar showLoginPopup={null} />
            <Container className="my-5">
                {loading ? <Loader /> : null}
                {error ? <div className="text-danger text-center my-2">{error}</div> : null}
                {step === 0 ? <WSSiteType
                    next={next}
                    onSelectType={(type) => {
                        console.log('Parent received type:', type);
                        setSiteType(type);
                    }}
                    wsType={siteType}
                /> : null}
                {step === 1 ? <WizardStepUserInfo
                    next={next}
                    prev={prev}
                    formData={{
                        name,
                        designation,
                        email, address
                    }}
                    setFormData={(d) => {
                        setName(d.name);
                        setDesignation(d.designation);
                        setEmail(d.email);
                        setAddress(d.address);
                    }}
                /> : null}
                {step === 2 ? <WizardStepPhoneNumbers
                    next={next}
                    prev={prev}
                    phoneNumbers={phoneNumbers}
                    setPhoneNumbers={setPhoneNumbers}
                /> : null}
                {step === 3 ? <WizardStepSocialLinks next={next}
                    prev={prev} socialLinks={socialLinks} setSocialLinks={setSocialLinks} /> : null}
                {step === 4 ? <WizardStepMoreSocialLinks next={next} prev={prev} socialLinks={socialLinks} setSocialLinks={setSocialLinks} /> : null}
                {step === 5 ? <WizardStepTheme prev={prev} name={name} designation={designation} email={email} phoneNumbers={phoneNumbers} socialLinks={socialLinks} /> : null}

            </Container>
        </>
    );
}