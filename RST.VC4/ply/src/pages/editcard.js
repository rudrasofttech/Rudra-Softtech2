'use client'

import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { getWithAuth, postWithAuth } from '../utils/api';
import { APIURLS } from '../utils/config';
import PlyNavbar from '../components/plynavbar';
import Loader from '../components/loader';
import "../styles/globals.css";
import Nav from 'react-bootstrap/Nav';
import { toast } from 'react-toastify';
import useScreenSize from '../hooks/useScreenSize';
import ResponsivePreview from '../components/responsivepreview';
import ImageUploaderWithCrop from '../components/imageuploaderwithcrop';
import Modal from 'react-bootstrap/Modal';
import ChooseTheme from '../components/choosetheme';
import ExpandableTextarea from '../components/expandabletextarea';


export default function EditCard() {
    //const [redirectUrl, setRedirectUrl] = useState("");
    const isMobile = useScreenSize();
    const navigate = useNavigate();
    const params = useParams();
    const id = params.id;
    const [dummy, setDummy] = useState(Date.now()); // Dummy state to force re-render
    const [loading, setLoading] = useState(false);
    const [website, setWebsite] = useState(null);
    const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
    const [showEditContactModal, setShowEditContactModal] = useState(true);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [showEditSocialModal, setShowEditSocialModal] = useState(false);
    const [showEditThemeModal, setShowEditThemeModal] = useState(false);
    const [showEditPhotosModal, setShowEditPhotosModal] = useState(false);

    //const [addPhotoFile, setAddPhotoFile] = useState(null);


    const [isDirty, setIsDirty] = useState(false);
    // const [themes, setThemes] = useState(null);
    // const [loadingTheme, setLoadingTheme] = useState(false);
    // const [themePageIndex, setThemePageIndex] = useState(1);
    const [showLogoModal, setShowLogoModal] = useState(false);

    const handleLogoModalClose = () => setShowLogoModal(false);
    const handleLogoModalShow = () => setShowLogoModal(true);

    const [logoChanged, setLogoChanged] = useState(false);
    const handleImageCropped = (base64Image) => {
        setWebsite(prev => ({
            ...prev,
            vcard: {
                ...prev.vcard,
                logo: base64Image
            }
        }));
        setLogoChanged(true);
        handleLogoModalClose();
    };

    // Save when logo changes, but not on initial load
    const isFirstLogoLoad = useRef(true);
    useEffect(() => {
        if (!website || !logoChanged) return;
        if (isFirstLogoLoad.current) {
            isFirstLogoLoad.current = false;
            setLogoChanged(false);
            return;
        }
        handleSave();
        setLogoChanged(false);
    }, [website && website.vcard && website.vcard.logo]);

    // useEffect(() => {
    //     async function fetchThemes() {
    //         setLoadingTheme(true);
    //         var r = await getWithAuth(`${APIURLS.userWebsiteTheme}/?page=${themePageIndex}&wstype=1`, navigate);
    //         if (r.result) {
    //             if (themes === null) {
    //                 setThemes(r.data);
    //             } else {
    //                 setThemes((prev) => ({
    //                     items: [...prev.items, ...r.data.items],
    //                     pageIndex: r.data.pageIndex,
    //                     pageCount: r.data.pageCount,
    //                     totalRecords: r.data.totalRecords
    //                 }));
    //             }
    //         } else {
    //             toast.error("Failed to load themes: " + r.errors.join(', '));
    //         }
    //         setLoadingTheme(false);
    //     }
    //     fetchThemes();
    // }, [themePageIndex, navigate]);


    useEffect(() => {
        async function fetchSite() {
            setLoading(true);
            var r = await getWithAuth(`${APIURLS.userWebsite}/${id}`, navigate);
            if (r.result) {
                setWebsite(r.data);
            } else {
                toast.error(r.errors.join(', '));
            }
            setLoading(false);
        }
        fetchSite();
    }, [id, navigate]);

    const handleSave = async () => {
        try {
            console.log('Saving website data:', website);
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
                aboutInfo: website.vcard.aboutInfo,
                facebook: website.vcard.facebook,
                id: website.id,
                photos: website.vcard.photos
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatevcard`, navigate, data);
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

    useEffect(() => {
        if (isDirty) {
            handleSave();
            setIsDirty(false);
        }
    }, [website && website.vcard && website.vcard.photos]);

    const updateTheme = async (id) => {
        try {
            const data = {
                websiteId: website.id,
                themeId: id
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatetheme`, navigate, data);
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

            const response = await getWithAuth(`${APIURLS.userWebsite}/updatestatus/${website.id}?status=${status}`, navigate);
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
        <PlyNavbar showLoginPopup={null}>
            {website !== null ?
                <Nav className="justify-content-end flex-grow-1 pe-3">
                    <Nav.Link className={showEditContactModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(false);
                        setShowEditContactModal(true);
                        setShowEditPhoneModal(false);
                        setShowEditSocialModal(false);
                        setShowEditThemeModal(false);
                        setShowEditPhotosModal(false);
                    }}>Contact</Nav.Link>
                    <Nav.Link className={showEditCompanyModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(true);
                        setShowEditContactModal(false);
                        setShowEditPhoneModal(false);
                        setShowEditSocialModal(false);
                        setShowEditThemeModal(false);
                        setShowEditPhotosModal(false);
                    }}>Business</Nav.Link>
                    <Nav.Link className={showEditPhoneModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(false);
                        setShowEditContactModal(false);
                        setShowEditPhoneModal(true);
                        setShowEditSocialModal(false);
                        setShowEditThemeModal(false);
                        setShowEditPhotosModal(false);
                    }}>Phone</Nav.Link>
                    <Nav.Link className={showEditSocialModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(false);
                        setShowEditContactModal(false);
                        setShowEditPhoneModal(false);
                        setShowEditSocialModal(true);
                        setShowEditThemeModal(false);
                        setShowEditPhotosModal(false);
                    }}>Social</Nav.Link>
                    <Nav.Link className={showEditThemeModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(false);
                        setShowEditContactModal(false);
                        setShowEditPhoneModal(false);
                        setShowEditSocialModal(false);
                        setShowEditThemeModal(true);
                        setShowEditPhotosModal(false);
                    }}>Themes</Nav.Link>
                    <Nav.Link className={showEditPhotosModal ? "active" : ""} onClick={() => {
                        setShowEditCompanyModal(false);
                        setShowEditContactModal(false);
                        setShowEditPhoneModal(false);
                        setShowEditSocialModal(false);
                        setShowEditThemeModal(false);
                        setShowEditPhotosModal(true);
                    }}>Photos</Nav.Link>
                    {website.status === 1 ? <Nav.Link disabled={loading} title="Site is Inactive, click to activate." className="text-success" onClick={() => {
                        updateStatus(0);
                    }}>Activate</Nav.Link> : null}
                    {website.status === 0 ? <Nav.Link title="Site is active, click to inactivate." disabled={loading} className="text-danger " onClick={() => {
                        updateStatus(1);
                    }}>Inactivate</Nav.Link> : null}
                    <Nav.Link title="Site is active, click to inactivate." target="_blank" className="text-primary link-underline-primary" href={`https://${website.name}.vc4.in`}>Visit {website.name}</Nav.Link>
                </Nav> : <Nav className="justify-content-end flex-grow-1 pe-3"></Nav>}
        </PlyNavbar>
        {loading ? <Loader /> : null}
        {website !== null ? <div className="container-fluid border-top">
            <div className="row">
                {!isMobile ? <div className="col-md-6 col-lg-8 col-sm ">
                    <div className='sticky-lg-top' style={{ top: "55px" }}>
                        <HtmlIframe id={website.id} navigate={navigate} dummy={dummy} />
                    </div>
                </div> : null}
                <div className="col-md-6 col-lg-4 col-sm p-md-4 p-2 bg-light border-start">
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

                            {website.vcard.logo !== "" ? <div>
                                <img alt="" src={website.vcard.logo} className="img-fluid" style={{ maxWidth: "200px" }} />
                                <div className="my-2">
                                    <button type="button" className="btn btn-secondary btn-sm me-2" onClick={() => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            vcard: {
                                                ...prev.vcard,
                                                logo: ""
                                            }
                                        }));
                                        setLogoChanged(true);
                                    }}>Remove</button>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogoModalShow}>Change</button>
                                </div>
                            </div> : <div>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogoModalShow}>Upload Logo</button>
                            </div>}
                            <div className="text-end"><small>Upload a logo in jpeg or png format</small></div>
                            <Modal show={showLogoModal} onHide={handleLogoModalClose}>
                                <Modal.Header closeButton>
                                    <Modal.Title>Upload Logo</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <ImageUploaderWithCrop maxWidth={300}
                                        maxHeight={300}

                                        onImageLoaded={handleImageCropped} />
                                </Modal.Body>
                            </Modal>
                            {/*{croppedImage && (*/}
                            {/*    <div className="mt-4">*/}
                            {/*        <h5>Cropped Image Preview:</h5>*/}
                            {/*        <img src={croppedImage} alt="Cropped" style={{ border: '1px solid #ccc' }} />*/}
                            {/*    </div>*/}
                            {/*)}*/}
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
                            <div className="text-end"><small>Your full name</small></div>
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
                            <div className="text-end"><small>CEO, Owner, Propreiter, Director etc</small></div>
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
                            <div className="text-end"><small>Your official or primary email address. e.g. myemail@gmail.com</small></div>
                        </div>
                        <div className="mb-2">
                            <label htmlFor="AddressTxt" className="form-label">Address</label>
                            <ExpandableTextarea rows={2} className="form-control" id="AddressTxt" 
                            value={website.vcard.address} maxLength={200}
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
                                }} />
                            <div className="text-end"><small>Provide full address including zipcode, disctrict, state name.</small></div>
                        </div>
                        <div className="mb-2">
                            <label htmlFor="BioTxt" className="form-label">Bio</label>
                            <ExpandableTextarea rows={4} className="form-control" id="BioTxt" value={website.vcard.aboutInfo} maxLength={350}
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
                                }} />
                            <div className="text-end"><small>Write something about the business/company/yourself.</small></div>
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
                            <div className="text-end"><small>It is recommended to include 1 phone number. <br />Example: +91 9876543210</small></div>
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
                            <div className="text-end"><small>Example: +91 9876543210</small></div>
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
                            <div className="text-end"><small>Example: +91 9876543210</small></div>
                        </div>
                    </> : null}
                    {showEditSocialModal ? <>
                        <div className="fw-bold mb-2 fs-5">Social Media Links</div>
                        <div className="text-start mb-2"><small>These will show as icons on your digital visiting card.</small></div>
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
                            <div className="text-end"><small>Whatsapp number that you want to share.</small></div>
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
                            <div className="text-end"><small>Your telegram username</small></div>
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
                            <div className="text-end"><small>Example- https://www.youtube.com/@Bookwormfrom1983</small></div>
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
                            <div className="text-end"><small>Example- https://www.instagram.com/Bookwormfrom1983/</small></div>
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
                            <div className="text-end"><small>Example- https://www.linkedin.com/in/rajkiran/</small></div>
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
                            <div className="text-end"><small>Your twitter handle e.g. @rajkiransingh</small></div>
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
                            <div className="text-end"><small>Example- https://www.facebook.com/singhrajkiran</small></div>
                        </div>
                    </> : null}
                    {showEditThemeModal ? <ChooseTheme themeType={1} onThemeSelect={(id) => {
                        setWebsite(prev => ({
                                                ...prev,
                                                themeId: id
                                            }));
                                            updateTheme(id); }} initialThemeId={website.themeId} /> : null}
                    {showEditPhotosModal ? <>
                        <div className="fw-bold mb-2 fs-5">Photo Gallery</div>
                        <div className="py-2 text-muted">Upload up to 12 photos (JPEG/PNG, max 50kb each).<br /> <strong>Existing: {website.vcard.photos ? website.vcard.photos.length : 0}/12</strong></div>
                        <div className="mb-2">
                            {website.vcard.photos && website.vcard.photos.length < 12 ? <div className='text-end'>
                                <div className="mb-2">
                                    <input type="file" accept="image/jpeg,image/png" onChange={e => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (!['image/jpeg', 'image/png'].includes(file.type)) {
                                            toast.error('Only JPEG and PNG files are allowed.');
                                            //setAddPhotoFile(null);
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onload = function (event) {
                                            const img = new window.Image();
                                            img.onload = function () {
                                                let targetW = img.width, targetH = img.height;
                                                if (targetW > 800 || targetH > 800) {
                                                    const scale = Math.min(800 / targetW, 800 / targetH);
                                                    targetW = Math.round(targetW * scale);
                                                    targetH = Math.round(targetH * scale);
                                                }
                                                const canvas = document.createElement('canvas');
                                                canvas.width = targetW;
                                                canvas.height = targetH;
                                                const ctx = canvas.getContext('2d');
                                                ctx.drawImage(img, 0, 0, targetW, targetH);
                                                let quality = 0.7;
                                                let base64 = '';
                                                do {
                                                    base64 = canvas.toDataURL(file.type, quality);
                                                    quality -= 0.1;
                                                } while (base64.length > 70000 && quality > 0.3); // ~50kb base64
                                                if (base64.length > 70000) {
                                                    toast.error('Could not reduce image below 50kb.');
                                                    //setAddPhotoFile(null);
                                                    return;
                                                }
                                                //setAddPhotoFile({ base64, type: file.type });
                                                setIsDirty(true);
                                                setWebsite(prev => ({
                                                    ...prev,
                                                    vcard: {
                                                        ...prev.vcard,
                                                        photos: [...(prev.vcard.photos || []), { photo: base64, title: '' }]
                                                    }
                                                }));
                                            };
                                            img.onerror = function () {
                                                toast.error('Invalid image file.');
                                                //setAddPhotoFile(null);
                                            };
                                            img.src = event.target.result;
                                        };
                                        reader.readAsDataURL(file);
                                    }} />
                                </div>
                            </div> : null}

                            <div className="mt-2">
                                {(website.vcard.photos || []).map((photoObj, idx) => (
                                    <div key={idx} className="card mb-2 flex-row align-items-center" style={{ width: "100%", border: '1px solid #ccc', background: '#fff' }}>
                                        <div className="p-2" style={{ flex: '0 0 40%' }}>
                                            <img src={photoObj.photo || photoObj} alt="" className="img-fluid rounded" />
                                        </div>
                                        <div className="p-2 flex-grow-1 d-flex flex-column justify-content-between" style={{ minWidth: 0 }}>
                                            <label className='form-label'>Title</label>
                                            <input type="text" className="form-control form-control-sm mb-2" placeholder="Photo Title" maxLength={100}
                                                value={photoObj.title || ''}
                                                onChange={e => {
                                                    const newPhotos = [...website.vcard.photos];
                                                    newPhotos[idx] = { ...photoObj, photo: photoObj.photo, title: e.target.value };
                                                    setWebsite(prev => ({
                                                        ...prev,
                                                        vcard: {
                                                            ...prev.vcard,
                                                            photos: newPhotos
                                                        }
                                                    }));

                                                }}
                                                onBlur={() => {
                                                    setIsDirty(true);
                                                }}
                                            />
                                            <button type="button" className="btn btn-danger btn-sm align-self-end" style={{ minWidth: 80 }} onClick={() => {
                                                const newPhotos = [...website.vcard.photos];
                                                newPhotos.splice(idx, 1);
                                                setIsDirty(true);
                                                setWebsite(prev => ({
                                                    ...prev,
                                                    vcard: {
                                                        ...prev.vcard,
                                                        photos: newPhotos
                                                    }
                                                }));
                                                // setTimeout(() => {
                                                //     setIsDirty(true);
                                                //     handleSave();
                                                //     setIsDirty(false);
                                                // }, 200);

                                            }}>Remove</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {website.vcard.photos && website.vcard.photos.length >= 12 ? <div className="text-danger mt-2">Maximum 12 photos allowed.</div> : null}
                        </div>
                    </> : null}
                </div>
            </div>
        </div> : null}
    </>;
}

function HtmlIframe({ id, navigate, dummy }) {
    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch HTML
    useEffect(() => {
        async function fetchSite() {
            setLoading(true);
            try {
                const r = await getWithAuth(`${APIURLS.userWebsite}/html/${id}`, navigate);
                if (r.result) {
                    setHtml(r.data.html);
                } else {
                    toast.error(r.errors.join(', '));
                }
            } catch (err) {
                toast.error('Unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        }

        fetchSite();
    }, [id, navigate, dummy]);

    // Write to iframe whenever html changes
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !html) return;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Clear and write fresh HTML
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
    }, [html]);

    return (
        <>
            <ResponsivePreview html={html} />
            {loading ? <Loader /> : null}
        </>
    );
}
