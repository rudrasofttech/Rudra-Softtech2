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

export default function EditLinkList() {
    const isMobile = useScreenSize();
    const navigate = useNavigate();
    const params = useParams();
    const id = params.id;
    const [dummy, setDummy] = useState(Date.now());
    const [loading, setLoading] = useState(false);
    const [website, setWebsite] = useState(null);
    const [showEditLinksModal, setShowEditLinksModal] = useState(true);
    const [showEditSocialModal, setShowEditSocialModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

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
                    }}>Links</Nav.Link>
                    <Nav.Link className={showEditSocialModal ? "active" : ""} onClick={() => {
                        setShowEditLinksModal(false);
                        setShowEditSocialModal(true);
                    }}>Social</Nav.Link>
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
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Photo</label>
                                <input type="text" className="form-control" value={website.linklist.photo} maxLength={300}
                                    onChange={e => {
                                        setWebsite(prev => ({
                                            ...prev,
                                            linklist: {
                                                ...prev.linklist,
                                                photo: e.target.value
                                            }
                                        }));
                                        setIsDirty(true);
                                    }}
                                    onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Links</label>
                                {(website.linklist.links || []).map((item, idx) => (
                                    <div key={idx} className="d-flex mb-1">
                                        <input type="text" className="form-control me-2" placeholder="Title" value={item.title}
                                            onChange={e => {
                                                const updated = website.linklist.links.map((l, i) => i === idx ? { ...l, title: e.target.value } : l);
                                                setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links: updated } }));
                                                setIsDirty(true);
                                            }}
                                            onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                        />
                                        <input type="text" className="form-control me-2" placeholder="URL" value={item.url}
                                            onChange={e => {
                                                const updated = website.linklist.links.map((l, i) => i === idx ? { ...l, url: e.target.value } : l);
                                                setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links: updated } }));
                                                setIsDirty(true);
                                            }}
                                            onBlur={() => { if (isDirty) { handleSave(); setIsDirty(false); } }}
                                        />
                                        <button className="btn btn-danger btn-sm" onClick={() => {
                                            const updated = website.linklist.links.filter((_, i) => i !== idx);
                                            setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links: updated } }));
                                            setIsDirty(true);
                                        }}>🗑️</button>
                                    </div>
                                ))}
                                <button className="btn btn-secondary btn-sm mt-2" onClick={() => {
                                    setWebsite(prev => ({ ...prev, linklist: { ...prev.linklist, links: [...(prev.linklist.links || []), { title: '', url: '' }] } }));
                                    setIsDirty(true);
                                }}>Add Link</button>
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
