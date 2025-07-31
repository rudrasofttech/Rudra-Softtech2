'use client'

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getWithAuth, postWithAuth } from '@/utils/api';
import { APIURLS } from '@/utils/config';
import PlyNavbar from '@/components/plynavbar';
import Loader from '@/components/loader';
import "../globals.css";
import { toast } from 'react-toastify';

const EditCompany = ({ website, onSave }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState(website.company || '');
    const [tagLine, setTagLine] = useState(website.tagLine || '');
    const [logo, setLogo] = useState(website.logo || '');

    useEffect(() => {
        setCompany(website.company);
        setTagLine(website.tagLine);
        setLogo(website.logo);
    }, [website.company, website.tagLine, website.logo]);

    const handleSave = async (fieldName, fieldValue) => {
        try {
            setLoading(true);
            const data = { fieldName, fieldValue, id: website.id };
            const response = await postWithAuth(`${APIURLS.updateWebsite}/updatevcard`, data, router);
            setLoading(false);
            if (response.result) {
                toast.success("Changes saved successfully!");
                onSave && onSave();
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }

    return <div className="my-4">
        <div className="fs-5 mb-2">Edit Company Information</div>
        <div className="mb-3">
            <label htmlFor="company" className="form-label">Company Name</label>
            <input type="text" disabled={loading} maxLength="45" className="form-control" id="company" value={company}
                onChange={(e) => setCompany(e.target.value)} onBlur={() => { handleSave("company", company); } } />
        </div>
    </div>;
};

const EditContact = ({ personName, designation, email, address, website, onSave }) => {

};

const EditPhoneNumbers = ({ phone1, phone2, phone3, website, onSave }) => {

};

const EditSocialLinks = ({ whatsApp, telegram, youtube, instagram, linkedIn, twitter, facebook, website, onSave }) => { }

const EditTheme = ({ themeId, website, onSave }) => { }

export default function EditSite() {
    const [redirectUrl, setRedirectUrl] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id'); // Access a specific query parameter

    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');
    const [website, setWebsite] = useState(null);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(true);
    const [showEditContactModal, setShowEditContactModal] = useState(false);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [showEditSocialModal, setShowEditSocialModal] = useState(false);
    const [showEditThemeModal, setShowEditThemeModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [redirectUrl, router]);

    useEffect(() => {
        async function fetchSite() {
            setLoading(true);
            setError('');
            var r = await getWithAuth(`${APIURLS.userWebsite}/${id}`, router);
            if (r.result) {
                console.log(r.data);
                setWebsite(r.data);
            } else {
                setError(r.errors.join(', '));
            }
            setLoading(false);
        }
        fetchSite();
    }, [id]);

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            const data = {
                company: website.vcard.company,
                logo: website.vcard.logo,
                tagLine: website.vcard.tagLine,
                keywords: website.vcard.keywords,
                personName: website.vcard.personName,
                designation: website.vcard.designation,
                email: website.vcard.email,
                address: website.vcard.address,
                phone1: website.vcard.phone1,
                phone2: website.vcard.phone2,
                phone3: website.vcard.phone3,
                whatsApp: website.vcard.whatsApp,
                telegram: website.vcard.telegram,
                youtube: website.vcard.youtube,
                instagram: website.vcard.instagram,
                linkedIn: website.vcard.linkedIn,
                twitter: website.vcard.twitter,
                address: website.vcard.address,
                aboutInfo: website.vcard.aboutInfo,
                id: website.id
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatevcard`, router, data);
            setSaveLoading(false);
            if (response.result) {
                toast.success("Changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }

    return <>
        <PlyNavbar showLoginPopup={null} />
        {loading ? <Loader /> : null}
        {website !== null ? <div className="border-top g-0">
            <div className="container-fluid">
                <div className="row">
                    <nav className="col-md-2 col-lg-1 col-sm-2 d-md-block bg-light sidebar" style={{ minHeight: "calc(100vh - 70px)" }}>
                        <div className="position-sticky">
                            <ul className="nav flex-column">
                                <li className="nav-item my-2">
                                    <button type="button" className={showEditCompanyModal ? "btn btn-primary" : "btn btn-light"}
                                        onClick={() => {
                                            setShowEditCompanyModal(true);
                                            setShowEditContactModal(false);
                                            setShowEditPhoneModal(false);
                                            setShowEditSocialModal(false);
                                            setShowEditThemeModal(false);
                                        }}>Business</button>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditContactModal ? "btn btn-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(true);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(false);
                                    }}>Contact</a>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditPhoneModal ? "btn btn-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(true);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(false);
                                    }}>Phone</a>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditSocialModal ? "btn btn-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(true);
                                        setShowEditThemeModal(false);
                                    }}>Social</a>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditThemeModal ? "btn btn-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(true);
                                    }}>Themes</a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                    <div className="col-md-6 col-lg-4 col-sm p-md-4 p-2">
                        {showEditCompanyModal ? <>
                            <div className="fw-bold mb-2 fs-5">Business Information</div>
                            <div className="mb-2">
                                <label htmlFor="companyTxt" className="form-label">Business/Company/Organisation Name</label>
                                <input type="text" className="form-control" id="companyTxt" value={website.vcard.company} maxLength={50}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                company: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if(isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="tagLineTxt" className="form-label">Tag Line</label>
                                <input type="text" className="form-control" id="tagLineTxt" value={website.vcard.tagLine} maxLength={100}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                tagLine: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }} 
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="logoTxt" className="form-label">Logo URL</label>
                                <input type="text" className="form-control" id="logoTxt" value={website.vcard.logo} maxLength={200}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                logo: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            
                        </> : null}
                        {showEditContactModal ? <>
                            <div className="fw-bold mb-2 fs-5">Contact Information</div>
                            <div className="mb-2">
                                <label htmlFor="personNameTxt" className="form-label">Person Name</label>
                                <input type="text" className="form-control" id="personNameTxt" value={website.vcard.personName} maxLength={80}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                personName: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="DesignationTxt" className="form-label">Designation</label>
                                <input type="text" className="form-control" id="DesignationTxt" value={website.vcard.designation} maxLength={50}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                designation: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="EmailTxt" className="form-label">Email</label>
                                <input type="text" className="form-control" id="EmailTxt" value={website.vcard.email} maxLength={200}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                email: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="AddressTxt" className="form-label">Address</label>
                                <input type="text" className="form-control" id="AddressTxt" value={website.vcard.address} maxLength={200}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                address: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="BioTxt" className="form-label">Bio</label>
                                <input type="text" className="form-control" id="BioTxt" value={website.vcard.aboutInfo} maxLength={500}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                aboutInfo: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                        </> : null}
                        {showEditPhoneModal ? <>
                            <div className="fw-bold mb-2 fs-5">Phone Numbers</div>
                            <div className="mb-2">
                                <label htmlFor="phone1Txt" className="form-label">Phone 1</label>
                                <input type="text" className="form-control" id="phone1Txt" value={website.vcard.phone1} maxLength={15}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                phone1: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="phone2Txt" className="form-label">Phone 2</label>
                                <input type="text" className="form-control" id="phone2Txt" value={website.vcard.phone2} maxLength={15}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                phone2: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="phone3Txt" className="form-label">Phone 3</label>
                                <input type="text" className="form-control" id="phone3Txt" value={website.vcard.phone3} maxLength={15}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                phone3: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                        </> : null}
                        {showEditSocialModal ? <>
                            <div className="fw-bold mb-2 fs-5">Social Media Links</div>
                            <div className="mb-2">
                                <label htmlFor="whatsAppTxt" className="form-label">Whats App</label>
                                <input type="text" className="form-control" id="whatsAppTxt" value={website.vcard.whatsApp} maxLength={15}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                whatsApp: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="TelegramTxt" className="form-label">Telegram</label>
                                <input type="text" className="form-control" id="TelegramTxt" value={website.vcard.telegram} maxLength={50}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                telegram: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="YoutubeTxt" className="form-label">Youtube</label>
                                <input type="text" className="form-control" id="YoutubeTxt" value={website.vcard.youtube} maxLength={300}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                youtube: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="InstagramTxt" className="form-label">Instagram</label>
                                <input type="text" className="form-control" id="InstagramTxt" value={website.vcard.instagram} maxLength={300}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                instagram: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="LinkedInTxt" className="form-label">LinkedIn</label>
                                <input type="text" className="form-control" id="LinkedInTxt" value={website.vcard.linkedIn} maxLength={300}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                linkedIn: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="TwitterTxt" className="form-label">Twitter</label>
                                <input type="text" className="form-control" id="TwitterTxt" value={website.vcard.twitter} maxLength={300}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                twitter: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="FacebookTxt" className="form-label">Facebook</label>
                                <input type="text" className="form-control" id="FacebookTxt" value={website.vcard.facebook} maxLength={300}
                                    onChange={(e) => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                facebook: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => {
                                        if (isDirty) {
                                            handleSave();
                                            setIsDirty(false);
                                        }
                                    }}
                                />
                            </div>
                        </> : null}
                        {showEditThemeModal ? <>
                            <EditTheme themeId={website.themeId} website={website} />
                        </> : null}
                    </div>
                </div>
            </div>
        </div> : null}


    </>;

}