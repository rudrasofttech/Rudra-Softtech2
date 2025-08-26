import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import LinkListForm from '../components/linklistform';
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

export default function EditLinkList() {
    const isMobile = useScreenSize();
    const navigate = useNavigate();
    const params = useParams();
    const id = params.id;
    const [dummy, setDummy] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    const [website, setWebsite] = useState(null);
    const [showEditInfoModal, setShowEditInfoModal] = useState(false);
    const [showEditLinksModal, setShowEditLinksModal] = useState(true);
    const [showEditSocialModal, setShowEditSocialModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoChanged, setPhotoChanged] = useState(false);
    const isFirstPhotoLoad = useRef(true);

    // Save when photo changes, but not on initial load
    useEffect(() => {
        if (!website || !photoChanged) return;
        if (isFirstPhotoLoad.current) {
            isFirstPhotoLoad.current = false;
            setPhotoChanged(false);
            return;
        }
        handleSave();
        setPhotoChanged(false);
    }, [website && website.linklist && website.linklist.photo]);

    const [statusLoading, setStatusLoading] = useState(false);
    const updateStatus = async (status) => {
        try {
            setStatusLoading(true);
            const response = await getWithAuth(`${APIURLS.userWebsite}/updatestatus/${website.id}?status=${status}`, navigate);
            if (response.result) {
                setWebsite(prev => ({
                    ...prev,
                    status: status
                }));
                setDummy(Date.now());
                toast.success("Status updated successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to update status:', err.message);
        } finally {
            setStatusLoading(false);
        }
    };

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
            const data = {
                id: website.id,
                name: website.linklist.name,
                line: website.linklist.line,
                photo: website.linklist.photo,
                links: website.linklist.links,
                youtube: website.linklist.youtube,
                instagram: website.linklist.instagram,
                linkedIn: website.linklist.linkedIn,
                twitter: website.linklist.twitter,
                facebook: website.linklist.facebook,
                telegram: website.linklist.telegram,
                whatsApp: website.linklist.whatsApp
            };
            const response = await postWithAuth(`${APIURLS.userWebsite}/updatelinklist`, navigate, data);
            if (response.result) {
                setDummy(Date.now());
                toast.success("Changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to save:', err.message);
        }
    }

    return <>
        <PlyNavbar showLoginPopup={null}>
            {website !== null ?
                <Nav className="justify-content-end flex-grow-1 pe-3">
                    <Nav.Link className={showEditLinksModal ? "active" : ""} onClick={() => {
                        setShowEditLinksModal(true);
                        setShowEditSocialModal(false);
                        setShowEditInfoModal(false);
                    }}>Links</Nav.Link>
                    <Nav.Link className={showEditInfoModal ? "active" : ""} onClick={() => {
                        setShowEditLinksModal(false);
                        setShowEditSocialModal(false);
                        setShowEditInfoModal(true);
                    }}>Personal Info</Nav.Link>
                    <Nav.Link className={showEditSocialModal ? "active" : ""} onClick={() => {
                        setShowEditLinksModal(false);
                        setShowEditSocialModal(true);
                        setShowEditInfoModal(false);
                    }}>Social</Nav.Link>
                    {website.status === 1 ? <Nav.Link disabled={statusLoading} title="Site is Inactive, click to activate." className="text-success" onClick={() => {
                        updateStatus(0);
                    }}>Activate</Nav.Link> : null}
                    {website.status === 0 ? <Nav.Link title="Site is active, click to inactivate." disabled={statusLoading} className="text-danger " onClick={() => {
                        updateStatus(1);
                    }}>Inactivate</Nav.Link> : null}
                    <Nav.Link target="_blank" className="text-primary link-underline-primary" href={`https://${website.name}.vc4.in`}>Visit {website.name}</Nav.Link>
                </Nav> : <Nav className="justify-content-end flex-grow-1 pe-3"></Nav>}
        </PlyNavbar>
        {loading ? <Loader /> : null}
        {website !== null ? <div className="border-top g-0">
            <div className="container-fluid">
                <div className="row">
                    {!isMobile ? <div className="col-md-6 col-lg-8 col-sm">
                        <HtmlIframe id={website.id} navigate={navigate} dummy={dummy} />
                    </div> : null}
                    <div className="col-md-6 col-lg-4 col-sm p-md-4 p-2 bg-light border-start">
                        {showEditLinksModal ? <>
                            <div className="fw-bold mb-2 fs-5">Link List Information</div>
                            <div className="mb-2">
                                <LinkListForm
                                    links={website.linklist.links}
                                    setLinks={links => setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links } }))}
                                    handleSave={handleSave}
                                    isDirty={isDirty}
                                    setIsDirty={setIsDirty}
                                />
                                <button className="btn btn-secondary btn-sm mt-2" onClick={() => {
                                    setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links: [...(prev.linklist.links || []), { title: '', url: '', description: '' }] } }));
                                    setIsDirty(true);
                                }}>Add Link</button>
                            </div>
                        </> : null}
                        {showEditInfoModal ? <>
                            <div className="fw-bold mb-2 fs-5">Personal Information</div>
                            <div className="mb-2">
                                <label className="form-label">Your Name</label>
                                <input type="text" className="form-control" value={website.linklist.name} maxLength={100}
                                    onChange={e => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            linklist: {
                                                ...prev.linklist,
                                                name: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Displayed as the main heading on your LinkList page.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Tag Line</label>
                                <input type="text" className="form-control" value={website.linklist.line} maxLength={250}
                                    onChange={e => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            linklist: {
                                                ...prev.linklist,
                                                line: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">A short tagline or description under your name (max 250 characters).</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Photo</label>
                                {website.linklist.photo !== "" ? <div>
                                    <img alt="" src={website.linklist.photo} className="img-fluid" style={{maxWidth:"200px"}} />
                                    <div className="my-2">
                                        <button type="button" className="btn btn-secondary btn-sm me-2" onClick={() => {
                                            setWebsite(prev => ({
                                                ...prev,
                                                linklist: {
                                                    ...prev.linklist,
                                                    photo: ""
                                                }
                                            }));
                                            setPhotoChanged(true);
                                        }}>Remove</button>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPhotoModal(true)}>Change</button>
                                    </div>
                                </div> : <div>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPhotoModal(true)}>Upload Photo</button>
                                </div>}
                                <small className="form-text text-muted">Recommended: Square image, max 300x300px. JPEG or PNG only.</small>
                                <div className="text-end"><small>Upload a photo in jpeg or png format</small></div>
                                <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)}>
                                    <Modal.Header closeButton>
                                        <Modal.Title>Upload Photo</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <ImageUploaderWithCrop maxWidth={300} maxHeight={300} onImageLoaded={base64 => {
                                            setWebsite(prev => ({
                                                ...prev,
                                                linklist: {
                                                    ...prev.linklist,
                                                    photo: base64
                                                }
                                            }));
                                            setPhotoChanged(true);
                                            setShowPhotoModal(false);
                                        }} />
                                    </Modal.Body>
                                </Modal>
                            </div>
                        </> : null}
                        {showEditSocialModal ? <>
                            <div className="fw-bold mb-2 fs-5">Social Links</div>
                            <div className="mb-2">
                                <label className="form-label">Youtube</label>
                                <input type="text" className="form-control" value={website.linklist.youtube} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, youtube: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Paste your YouTube channel or video URL.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Instagram</label>
                                <input type="text" className="form-control" value={website.linklist.instagram} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, instagram: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your Instagram profile URL (e.g., https://instagram.com/yourname).</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">LinkedIn</label>
                                <input type="text" className="form-control" value={website.linklist.linkedIn} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, linkedIn: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your LinkedIn profile URL.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Twitter</label>
                                <input type="text" className="form-control" value={website.linklist.twitter} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, twitter: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your Twitter/X profile URL.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Facebook</label>
                                <input type="text" className="form-control" value={website.linklist.facebook} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, facebook: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your Facebook profile or page URL.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Telegram</label>
                                <input type="text" className="form-control" value={website.linklist.telegram} maxLength={50}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, telegram: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your Telegram username or channel link.</small>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">WhatsApp</label>
                                <input type="text" className="form-control" value={website.linklist.whatsApp} maxLength={15}
                                    onChange={e => {
                                        setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, whatsApp: e.target.value } }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                                <small className="form-text text-muted">Your WhatsApp number (with country code) or click-to-chat link.</small>
                            </div>
                        </> : null}
                    </div>
                </div>
            </div>
        </div> : null}
    </>;
}

function HtmlIframe({ id, navigate, dummy }) {
    const iframeRef = useRef(null);
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !html) return;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
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
