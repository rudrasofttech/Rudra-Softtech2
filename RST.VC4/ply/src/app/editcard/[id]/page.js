'use client'

export const dynamic = "force-dynamic";

import {useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getWithAuth, postWithAuth } from '@/utils/api';
import { APIURLS } from '@/utils/config';
import PlyNavbar from '@/components/plynavbar';
import Loader from '@/components/loader';
import "@/styles/globals.css";
import { toast } from 'react-toastify';

export default function EditCard() {
    const [redirectUrl, setRedirectUrl] = useState("");
    
    const router = useRouter();
    const params = useParams();
const id = params.id; //searchParams.get('id'); // Access a specific query parameter
    const [dummy, setDummy] = useState(Date.now()); // Dummy state to force re-render
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [website, setWebsite] = useState(null);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
    const [showEditContactModal, setShowEditContactModal] = useState(true);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [showEditSocialModal, setShowEditSocialModal] = useState(false);
    const [showEditThemeModal, setShowEditThemeModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [themes, setThemes] = useState(null);
    const [loadingTheme, setLoadingTheme] = useState(false);
    const [themePageIndex, setThemePageIndex] = useState(1);

    useEffect(() => {
        async function fetchThemes() {
            setLoadingTheme(true);
            var r = await getWithAuth(`${APIURLS.userWebsiteTheme}/?page=${themePageIndex}`, router);
            if (r.result) {
                if (themes === null) {
                    setThemes(r.data);
                } else {
                    setThemes((prev) => ({
                        items: [...prev.items, ...r.data.items],
                        pageIndex: r.data.pageIndex,
                        pageCount: r.data.pageCount,
                        totalRecords: r.data.totalRecords
                    }));
                }
            } else {
                toast.error("Failed to load themes: " + r.errors.join(', '));
            }
            setLoadingTheme(false);
        }
        fetchThemes();
    }, [themePageIndex]);

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
                facebook: website.vcard.facebook,
                id: website.id
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatevcard`, router, data);
            if (response.result) {
                setDummy(Date.now()); // Force re-render
                toast.success("Changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }

    const updateTheme = async (id) => {
        try {
            const data = {
                websiteId: website.id,
                themeId: id
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatetheme`, router, data);
            if (response.result) {
                setDummy(Date.now()); // Force re-render
                toast.success("Changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to create:', err.message);
        }
    }

    const updateStatus = async (status) => {
        try {
            
            const response = await getWithAuth(`${APIURLS.userWebsite}/updatestatus/${website.id}?status=${status}`, router);
            if (response.result) {
                setWebsite(prev => ({
                    ...prev,
                    status: status
                }));
                setDummy(Date.now()); // Force re-render
                toast.success("Status updated successfully!");
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
                    <nav className="col-md-2 col-lg-1 col-sm-2 d-md-block bg-light border-end sidebar" style={{ minHeight: "calc(100vh - 70px)" }}>
                        <div className="position-sticky">
                            <ul className="nav flex-column">
                                <li className="nav-item my-2">
                                    <a className={showEditContactModal ? "btn btn-outline-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(true);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(false);
                                    }}>Contact</a>
                                </li>
                                <li className="nav-item my-2">
                                    <button type="button" className={showEditCompanyModal ? "btn btn-outline-primary" : "btn btn-light"}
                                        onClick={() => {
                                            setShowEditCompanyModal(true);
                                            setShowEditContactModal(false);
                                            setShowEditPhoneModal(false);
                                            setShowEditSocialModal(false);
                                            setShowEditThemeModal(false);
                                        }}>Business</button>
                                </li>

                                <li className="nav-item my-2">
                                    <a className={showEditPhoneModal ? "btn btn-outline-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(true);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(false);
                                    }}>Phone</a>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditSocialModal ? "btn btn-outline-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(true);
                                        setShowEditThemeModal(false);
                                    }}>Social</a>
                                </li>
                                <li className="nav-item my-2">
                                    <a className={showEditThemeModal ? "btn btn-outline-primary" : "btn btn-light"} onClick={() => {
                                        setShowEditCompanyModal(false);
                                        setShowEditContactModal(false);
                                        setShowEditPhoneModal(false);
                                        setShowEditSocialModal(false);
                                        setShowEditThemeModal(true);
                                    }}>Themes</a>
                                </li>
                                <li className="nav-item my-2">
                                    {website.status === 1 ? <button disabled={loading} title="Site is Inactive, click to activate." type="button" className="btn btn-success" onClick={() => {
                                        updateStatus(0);
                                    }}>Activate</button> : null}
                                    {website.status === 0 ? <button title="Site is active, click to inactivate." disabled={loading} type="button" className="btn btn-danger " onClick={() => {
                                        updateStatus(1);
                                    }}>Inactivate</button> : null}
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
                                        if (isDirty) {
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
                            {loadingTheme ? <div className="position-relative"><Loader position='absolute' /></div> : null}
                            {themes !== null ? <>
                                <div className="row">{themes.items.map((item, index) => {
                                    return <div className="col-6 col-md-6" key={index}>
                                        <img src={item.thumbnail} className="img-fluid mb-2" alt={item.name}
                                            style={{ cursor: "pointer", border: website.themeId === item.id ? "2px solid blue" : "none" }} onClick={() => {
                                                setWebsite(prev => ({
                                                    ...prev,
                                                    themeId: item.id
                                                }));
                                                updateTheme(item.id);
                                            }} />
                                    </div>
                                })}
                                </div>
                            </> : null}
                            {themes !== null && themes.pageIndex < themes.pageCount ? <div className="text-center p-1">
                                <button type="button" className="btn btn-sm btm-outline-primary" onClick={() => { setThemePageIndex(themes.pageIndex + 1) }}>Load More</button>
                            </div> : null}
                        </> : null}
                    </div>
                    <div className="col-md col-lg col-sm">
                        <div className="iphone-frame mx-auto p-4">
                            <div className="notch"></div>
                            <div className="screen">
                                <HtmlIframe id={website.id} router={router} dummy={dummy} />
                            </div>
                            <div className="home-button"></div>
                        </div>

                        
                    </div>
                </div>
            </div>
        </div> : null}
    </>;
}

 function HtmlIframe({ id, router, dummy}) {
    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    useEffect(() => {
        async function fetchSite() {
            //setLoading(true);
            //setError('');
            var r = await getWithAuth(`${APIURLS.userWebsite}/html/${id}`, router);
            if (r.result) {
                setHtml(r.data.html);
            }
            //else {
            //    setError(r.errors.join(', '));
            //}
            //setLoading(false);
        }
        fetchSite();

        const iframeDoc = iframeRef.current?.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();
        }
    }, [dummy]);

    if (html === '') {
        return <div className="text-center p-5">Loading...</div>;
    } else {
        return <iframe ref={iframeRef} frameBorder="0" className="w-100" style={{ minHeight: "calc(100vh - 70px)" }} />;
    }
}


