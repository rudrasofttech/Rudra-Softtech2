import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import settings from '../setting-lines.png';
import Spinner from './shared/Spinner';

export class WebsiteSettings extends Component {
    displayName = WebsiteSettings.name

    constructor(props) {
        super(props);

        this.state = {
            Address: "", AdminName: "", CommonHeadContent: "", ContactEmail: "", EmailSignature: "",
            NewsletterEmail: "", Phone: "", SiteFooter: "",
            SiteHeader: "", SiteName: "", SiteTitle: "", SiteUrl: "", token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true,
            bsstyle: '', message: ''
        };

        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(API.GetURL() + '/WebsiteSettings', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json()
                        .then(data => {
                            console.log(data);
                            for (var k in data) {
                                if (data[k].keyName === "Address") {
                                    this.setState({ Address: data[k].keyValue });
                                } else if (data[k].keyName === "AdminName") {
                                    this.setState({ AdminName: data[k].keyValue });
                                } else if (data[k].keyName === "CommonHeadContent") {
                                    this.setState({ CommonHeadContent: data[k].keyValue });
                                } else if (data[k].keyName === "ContactEmail") {
                                    this.setState({ ContactEmail: data[k].keyValue });
                                } else if (data[k].keyName === "EmailSignature") {
                                    this.setState({ EmailSignature: data[k].keyValue });
                                } else if (data[k].keyName === "NewsletterEmail") {
                                    this.setState({ NewsletterEmail: data[k].keyValue });
                                } else if (data[k].keyName === "Phone") {
                                    this.setState({ Phone: data[k].keyValue });
                                } else if (data[k].keyName === "SiteFooter") {
                                    this.setState({ SiteFooter: data[k].keyValue });
                                } else if (data[k].keyName === "SiteHeader") {
                                    this.setState({ SiteHeader: data[k].keyValue });
                                } else if (data[k].keyName === "SiteName") {
                                    this.setState({ SiteName: data[k].keyValue });
                                } else if (data[k].keyName === "SiteTitle") {
                                    this.setState({ SiteTitle: data[k].keyValue });
                                } else if (data[k].keyName === "SiteURL") {
                                    this.setState({ SiteUrl: data[k].keyValue });
                                }
                            }
                        });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.error });
                    }).catch(err => {
                        this.setState({ bsstyle: 'danger', message: "Unable to process request." });
                    });
                }
            }).catch(err => {
                this.setState({ bsstyle: 'danger', message: "Unable to contact server." });
            }).finally(() => {
                this.setState({ loading: false });
            });
    }

    handleChange(e) {
        if (e.target.name === "Address") {
            this.setState({ Address: e.target.value });

        } else if (e.target.name === "AdminName") {
            this.setState({ AdminName: e.target.value });
        } else if (e.target.name === "ContactEmail") {
            this.setState({ ContactEmail: e.target.value });
        }
        else if (e.target.name === "CommonHeadContent") {
            this.setState({ CommonHeadContent: e.target.value });
        } else if (e.target.name === "EmailSignature") {
            this.setState({ EmailSignature: e.target.value });
        } else if (e.target.name === "NewsletterEmail") {
            this.setState({ NewsletterEmail: e.target.value });
        } else if (e.target.name === "Phone") {
            this.setState({ Phone: e.target.value });
        } else if (e.target.name === "SiteHeader") {
            this.setState({ SiteHeader: e.target.value });
        } else if (e.target.name === "SiteFooter") {
            this.setState({ SiteFooter: e.target.value });
        } else if (e.target.name === "SiteName") {
            this.setState({ SiteName: e.target.value });
        } else if (e.target.name === "SiteTitle") {
            this.setState({ SiteTitle: e.target.value });
        } else if (e.target.name === "SiteURL") {
            this.setState({ SiteUrl: e.target.value });
        }
        this.saveWebsiteSetting(e.target.name, e.target.value);
    }

    saveWebsiteSetting(keyname, keyvalue) {
        this.setState({ bsstyle: '', message: '' });
        fetch(API.GetURL() + '/websitesettings/update',
            {
                method: 'post',
                body: JSON.stringify({ keyName: keyname, keyValue: keyvalue }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    this.setState({ bsstyle: 'success', message: "Website setting saved." });
                }
                else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.error });
                    }).catch(err => {
                        this.setState({ bsstyle: 'danger', message: "Unable to process request." });
                    });
                }
            }).catch(err => {
                console.log(err);
                this.setState({ bsstyle: 'danger', message: "Unable to contact server." });
            });
    }

    renderTable() {
        return (
            <div>
                <div className="fixedBottom">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <div className="mb-4">
                    <FormGroup controlId="Address">
                        <ControlLabel className="fw-bold">Address</ControlLabel>
                        <FormControl
                            name="Address"
                            type="text"
                            value={this.state.Address}
                            placeholder="Enter Office Address"
                            onChange={this.handleChange}
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="AdminName">
                        <ControlLabel className="fw-bold">Admin Name</ControlLabel>
                        <FormControl
                            name="AdminName"
                            type="text"
                            value={this.state.AdminName}
                            placeholder=""
                            onChange={this.handleChange}
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="ContactEmail">
                        <ControlLabel className="fw-bold">Contact Email</ControlLabel>
                        <FormControl name="ContactEmail" onChange={this.handleChange}
                            type="email"
                            value={this.state.ContactEmail}
                            placeholder=""
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="NewsletterEmail">
                        <ControlLabel className="fw-bold">Newsletter Email</ControlLabel>
                        <FormControl name="NewsletterEmail" onChange={this.handleChange}
                            type="email" value={this.state.NewsletterEmail}
                            rows="4"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="Phone">
                        <ControlLabel className="fw-bold">Phone</ControlLabel>
                        <FormControl name="Phone" onChange={this.handleChange}
                            type="text"
                            value={this.state.Phone} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteTitle">
                        <ControlLabel className="fw-bold">Site Title</ControlLabel>
                        <FormControl name="SiteTitle" onChange={this.handleChange}
                            type="text"
                            value={this.state.SiteTitle} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteName">
                        <ControlLabel className="fw-bold">Site Name</ControlLabel>
                        <FormControl name="SiteName" onChange={this.handleChange}
                            type="text"
                            value={this.state.SiteName} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteUrl">
                        <ControlLabel className="fw-bold">Site Url</ControlLabel>
                        <FormControl name="SiteUrl" onChange={this.handleChange}
                            type="text"
                            value={this.state.SiteUrl} />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="CommonHeadContent">
                        <ControlLabel className="fw-bold">Common Head Content</ControlLabel>
                        <FormControl name="CommonHeadContent" onChange={this.handleChange}
                            componentClass="textarea"
                            value={this.state.CommonHeadContent}
                            placeholder="" rows="10"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="EmailSignature">
                        <ControlLabel className="fw-bold">Email Signature</ControlLabel>
                        <FormControl name="EmailSignature" onChange={this.handleChange}
                            componentClass="textarea"
                            value={this.state.EmailSignature}
                            rows="4"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteFooter">
                        <ControlLabel className="fw-bold">Site Footer</ControlLabel>
                        <FormControl name="SiteFooter" onChange={this.handleChange}
                            componentClass="textarea"
                            value={this.state.SiteFooter}
                            rows="8"
                        />
                    </FormGroup>
                </div>
                <div className="mb-4">
                    <FormGroup controlId="SiteHeader">
                        <ControlLabel className="fw-bold">Site Header</ControlLabel>
                        <FormControl name="SiteHeader" onChange={this.handleChange}
                            componentClass="textarea"
                            value={this.state.SiteHeader}
                            rows="8"
                        />
                    </FormGroup>
                </div>
            </div>
        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <Spinner />
                : this.renderTable();
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
}