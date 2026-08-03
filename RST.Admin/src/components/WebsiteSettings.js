import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import settings from '../setting-lines.png';
import Spinner from './shared/Spinner';

export function WebsiteSettings() {
    const token = localStorage.getItem("token");
    const initialFormData = {
        Address: "",
        AdminName: "",
        CommonHeadContent: "",
        ContactEmail: "",
        EmailSignature: "",
        NewsletterEmail: "",
        Phone: "",
        SiteFooter: "",
        SiteHeader: "",
        SiteName: "",
        SiteTitle: "",
        SiteUrl: ""
    };
    const [formData, setFormData] = useState({
        ...initialFormData
    });
    const [loading, setLoading] = useState(false);
    const [bsstyle, setBsstyle] = useState('');
    const [message, setMessage] = useState('');
    const [loggedin] = useState(localStorage.getItem("token") !== null);
    const [fetchingSitemap, setFetchingSitemap] = useState(false);
    const [generatingSitemap, setGeneratingSitemap] = useState(false);

    useEffect(() => {
        let isMounted = true;

        setLoading(true);
        setBsstyle('');
        setMessage('');

        fetch(API.GetURL() + '/WebsiteSettings', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    return response.json().then(data => {
                        if (!isMounted) {
                            return;
                        }

                        const updatedData = { ...initialFormData };
                        for (var k in data) {
                            if (data[k].keyName === "Address") {
                                updatedData.Address = data[k].keyValue;
                            } else if (data[k].keyName === "AdminName") {
                                updatedData.AdminName = data[k].keyValue;
                            } else if (data[k].keyName === "CommonHeadContent") {
                                updatedData.CommonHeadContent = data[k].keyValue;
                            } else if (data[k].keyName === "ContactEmail") {
                                updatedData.ContactEmail = data[k].keyValue;
                            } else if (data[k].keyName === "EmailSignature") {
                                updatedData.EmailSignature = data[k].keyValue;
                            } else if (data[k].keyName === "NewsletterEmail") {
                                updatedData.NewsletterEmail = data[k].keyValue;
                            } else if (data[k].keyName === "Phone") {
                                updatedData.Phone = data[k].keyValue;
                            } else if (data[k].keyName === "SiteFooter") {
                                updatedData.SiteFooter = data[k].keyValue;
                            } else if (data[k].keyName === "SiteHeader") {
                                updatedData.SiteHeader = data[k].keyValue;
                            } else if (data[k].keyName === "SiteName") {
                                updatedData.SiteName = data[k].keyValue;
                            } else if (data[k].keyName === "SiteTitle") {
                                updatedData.SiteTitle = data[k].keyValue;
                            } else if (data[k].keyName === "SiteURL") {
                                updatedData.SiteUrl = data[k].keyValue;
                            }
                        }

                        setFormData(updatedData);
                    });
                }

                return response.json().then(data => {
                    if (isMounted) {
                        setBsstyle('danger');
                        setMessage(data.error);
                    }
                }).catch(() => {
                    if (isMounted) {
                        setBsstyle('danger');
                        setMessage("Unable to process request.");
                    }
                });
            })
            .catch(() => {
                if (isMounted) {
                    setBsstyle('danger');
                    setMessage("Unable to contact server.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    const saveWebsiteSetting = (keyname, keyvalue) => {
        setBsstyle('');
        setMessage('');

        fetch(API.GetURL() + '/websitesettings/update',
            {
                method: 'post',
                body: JSON.stringify({ keyName: keyname, keyValue: keyvalue }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    setBsstyle('success');
                    setMessage("Website setting saved.");
                }
                else {
                    response.json().then(data => {
                        setBsstyle('danger');
                        setMessage(data.error);
                    }).catch(() => {
                        setBsstyle('danger');
                        setMessage("Unable to process request.");
                    });
                }
            }).catch(err => {
                console.log(err);
                setBsstyle('danger');
                setMessage("Unable to contact server.");
            });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        saveWebsiteSetting(name, value);
    };

    const getSitemap = () => {
        setBsstyle('');
        setMessage('');
        setFetchingSitemap(true);

        fetch(API.GetURL() + '/utility/sitemap', {
            method: 'get',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || "Unable to download sitemap.");
                    }).catch(() => {
                        throw new Error("Unable to download sitemap.");
                    });
                }

                return response.blob();
            })
            .then(blob => {
                const fileUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = 'sitemap.xml';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(fileUrl);

                setBsstyle('success');
                setMessage('Sitemap downloaded successfully.');
            })
            .catch(err => {
                setBsstyle('danger');
                setMessage(err.message || "Unable to contact server.");
            })
            .finally(() => {
                setFetchingSitemap(false);
            });
    };

    const generateSitemap = () => {
        setBsstyle('');
        setMessage('');
        setGeneratingSitemap(true);

        fetch(API.GetURL() + '/utility/generate-sitemap', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    setBsstyle('success');
                    setMessage('Sitemap generated successfully.');
                    return;
                }

                response.json().then(data => {
                    setBsstyle('danger');
                    setMessage(data.error || "Unable to generate sitemap.");
                }).catch(() => {
                    setBsstyle('danger');
                    setMessage("Unable to process request.");
                });
            })
            .catch(() => {
                setBsstyle('danger');
                setMessage("Unable to contact server.");
            })
            .finally(() => {
                setGeneratingSitemap(false);
            });
    };

    const renderTable = () => {
        return (
            <div>
                <div className="fixedBottom">
                    <MessageStrip message={message} bsstyle={bsstyle} />
                </div>
                <div className="mb-4">
                    <ControlLabel className="fw-bold d-block">Sitemap</ControlLabel>
                    <div className="d-flex gap-2 flex-wrap">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={getSitemap}
                            disabled={fetchingSitemap || generatingSitemap}
                        >
                            {fetchingSitemap ? 'Downloading...' : 'Get Sitemap'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={generateSitemap}
                            disabled={fetchingSitemap || generatingSitemap}
                        >
                            {generatingSitemap ? 'Generating...' : 'Generate Sitemap'}
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="Address">
                        <ControlLabel className="fw-bold">Address</ControlLabel>
                        <FormControl
                            name="Address"
                            type="text"
                            value={formData.Address}
                            placeholder="Enter Office Address"
                            onChange={handleChange}
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="AdminName">
                        <ControlLabel className="fw-bold">Admin Name</ControlLabel>
                        <FormControl
                            name="AdminName"
                            type="text"
                            value={formData.AdminName}
                            placeholder=""
                            onChange={handleChange}
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="ContactEmail">
                        <ControlLabel className="fw-bold">Contact Email</ControlLabel>
                        <FormControl name="ContactEmail" onChange={handleChange}
                            type="email"
                            value={formData.ContactEmail}
                            placeholder=""
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="NewsletterEmail">
                        <ControlLabel className="fw-bold">Newsletter Email</ControlLabel>
                        <FormControl name="NewsletterEmail" onChange={handleChange}
                            type="email" value={formData.NewsletterEmail}
                            rows="4"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="Phone">
                        <ControlLabel className="fw-bold">Phone</ControlLabel>
                        <FormControl name="Phone" onChange={handleChange}
                            type="text"
                            value={formData.Phone} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteTitle">
                        <ControlLabel className="fw-bold">Site Title</ControlLabel>
                        <FormControl name="SiteTitle" onChange={handleChange}
                            type="text"
                            value={formData.SiteTitle} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteName">
                        <ControlLabel className="fw-bold">Site Name</ControlLabel>
                        <FormControl name="SiteName" onChange={handleChange}
                            type="text"
                            value={formData.SiteName} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteUrl">
                        <ControlLabel className="fw-bold">Site Url</ControlLabel>
                        <FormControl name="SiteUrl" onChange={handleChange}
                            type="text"
                            value={formData.SiteUrl} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="CommonHeadContent">
                        <ControlLabel className="fw-bold">Common Head Content</ControlLabel>
                        <FormControl name="CommonHeadContent" onChange={handleChange}
                            componentClass="textarea"
                            value={formData.CommonHeadContent}
                            placeholder="" rows="10"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="EmailSignature">
                        <ControlLabel className="fw-bold">Email Signature</ControlLabel>
                        <FormControl name="EmailSignature" onChange={handleChange}
                            componentClass="textarea"
                            value={formData.EmailSignature}
                            rows="4"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteFooter">
                        <ControlLabel className="fw-bold">Site Footer</ControlLabel>
                        <FormControl name="SiteFooter" onChange={handleChange}
                            componentClass="textarea"
                            value={formData.SiteFooter}
                            rows="8"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteHeader">
                        <ControlLabel className="fw-bold">Site Header</ControlLabel>
                        <FormControl name="SiteHeader" onChange={handleChange}
                            componentClass="textarea"
                            value={formData.SiteHeader}
                            rows="8"
                        />
                    </FormGroup>
                </div>
            </div>
        );
    };

    if (!loggedin) {
        return (<Redirect to="/loginform" />);
    } else {
            let contents = loading
                ? <Spinner />
                : renderTable();
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={settings} className="img-fluid icon-large me-2" /> Website Settings</h1>
                        <div className="btn-toolbar mb-2 mb-md-0"></div>
                    </div>
                    {contents}
                </div>
            );
    }
}