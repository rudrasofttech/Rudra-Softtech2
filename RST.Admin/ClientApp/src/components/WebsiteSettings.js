import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';

export class WebsiteSettings extends Component {
    displayName = WebsiteSettings.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = {
            Address: "", AdminName: "", CommonHeadContent: "", ContactEmail: "", EmailSignature: "",
            NewsletterEmail: "", Phone: "", SiteFooter: "",
            SiteHeader: "", SiteName: "", SiteTitle: "", SiteURL: "", loading: true, loggedin: loggedin,
            bsstyle: '', message: ''
        };

        this.handleChange = this.handleChange.bind(this);

        if (loggedin) {
            fetch('http://localhost:59709/api/WebsiteSettings', {
                method: 'get',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
                .then(response => {
                    if (response.status === 401) {
                        this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                    } else {
                        response.json()
                            .then(data => {
                                for (var k in data) {
                                    if (data[k].KeyName === "Address") {
                                        this.setState({ Address: data[k].KeyValue });
                                    } else if (data[k].KeyName === "AdminName") {
                                        this.setState({ AdminName: data[k].KeyValue });
                                    } else if (data[k].KeyName === "CommonHeadContent") {
                                        this.setState({ CommonHeadContent: data[k].KeyValue });
                                    } else if (data[k].KeyName === "ContactEmail") {
                                        this.setState({ ContactEmail: data[k].KeyValue });
                                    } else if (data[k].KeyName === "EmailSignature") {
                                        this.setState({ EmailSignature: data[k].KeyValue });
                                    } else if (data[k].KeyName === "NewsletterEmail") {
                                        this.setState({ NewsletterEmail: data[k].KeyValue });
                                    } else if (data[k].KeyName === "Phone") {
                                        this.setState({ Phone: data[k].KeyValue });
                                    } else if (data[k].KeyName === "SiteFooter") {
                                        this.setState({ SiteFooter: data[k].KeyValue });
                                    } else if (data[k].KeyName === "SiteHeader") {
                                        this.setState({ SiteHeader: data[k].KeyValue });
                                    } else if (data[k].KeyName === "SiteName") {
                                        this.setState({ SiteName: data[k].KeyValue });
                                    } else if (data[k].KeyName === "SiteTitle") {
                                        this.setState({ SiteTitle: data[k].KeyValue });
                                    } else if (data[k].KeyName === "SiteURL") {
                                        this.setState({ SiteURL: data[k].KeyValue });
                                    }
                                }
                                this.setState({ loading: false });
                            });
                    }
                });
        }
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
            this.setState({ SiteURL: e.target.value });
        }
        this.saveWebsiteSetting(e.target.name, e.target.value);
    }

    saveWebsiteSetting(keyname, keyvalue) {
        fetch('http://localhost:59709/api/websitesettings/' + keyname,
            {
                method: 'Put',
                body: JSON.stringify({ KeyName: keyname, KeyValue: keyvalue }),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("token"),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    this.setState({ bsstyle: 'success', message: "Website setting saved.", loading: false });
                }
                else if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                }
            });
    }

    renderTable() {
        return (
            <div>
                <div className="fixedBottom">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Table striped bordered>
                    <tbody>
                        <tr>
                            <td>
                                <FormGroup controlId="Address">
                                    <ControlLabel>Address</ControlLabel>
                                    <FormControl
                                        name="Address"
                                        type="text"
                                        value={this.state.Address}
                                        placeholder="Enter Office Address"
                                        onChange={this.handleChange}
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="AdminName">
                                    <ControlLabel>Admin Name</ControlLabel>
                                    <FormControl
                                        name="AdminName"
                                        type="text"
                                        value={this.state.AdminName}
                                        placeholder=""
                                        onChange={this.handleChange}
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="ContactEmail">
                                    <ControlLabel>Contact Email</ControlLabel>
                                    <FormControl name="ContactEmail" onChange={this.handleChange}
                                        type="email"
                                        value={this.state.ContactEmail}
                                        placeholder=""
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="NewsletterEmail">
                                    <ControlLabel>Newsletter Email</ControlLabel>
                                    <FormControl name="NewsletterEmail" onChange={this.handleChange}
                                        type="email" value={this.state.NewsletterEmail}
                                        rows="4"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Phone">
                                    <ControlLabel>Phone</ControlLabel>
                                    <FormControl name="Phone" onChange={this.handleChange}
                                        type="text"
                                        value={this.state.Phone} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="SiteTitle">
                                    <ControlLabel>Site Title</ControlLabel>
                                    <FormControl name="SiteTitle" onChange={this.handleChange}
                                        type="text"
                                        value={this.state.SiteTitle} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="SiteName">
                                    <ControlLabel>Site Name</ControlLabel>
                                    <FormControl name="SiteName" onChange={this.handleChange}
                                        type="text"
                                        value={this.state.SiteName} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="SiteUrl">
                                    <ControlLabel>Site Url</ControlLabel>
                                    <FormControl name="SiteUrl" onChange={this.handleChange}
                                        type="text"
                                        value={this.state.SiteUrl} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="CommonHeadContent">
                                    <ControlLabel>Common Head Content</ControlLabel>
                                    <FormControl name="CommonHeadContent" onChange={this.handleChange}
                                        componentClass="textarea"
                                        value={this.state.CommonHeadContent}
                                        placeholder="" rows="10"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="EmailSignature">
                                    <ControlLabel>Email Signature</ControlLabel>
                                    <FormControl name="EmailSignature" onChange={this.handleChange}
                                        componentClass="textarea"
                                        value={this.state.EmailSignature}
                                        rows="4"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="SiteFooter">
                                    <ControlLabel>Site Footer</ControlLabel>
                                    <FormControl name="SiteFooter" onChange={this.handleChange}
                                        componentClass="textarea"
                                        value={this.state.SiteFooter}
                                        rows="8"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="SiteHeader">
                                    <ControlLabel>Site Header</ControlLabel>
                                    <FormControl name="SiteHeader" onChange={this.handleChange}
                                        componentClass="textarea"
                                        value={this.state.SiteHeader}
                                        rows="8"
                                    />
                                </FormGroup>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable();
            return (
                <div>
                    <h1>Website Settings</h1>
                    {contents}
                </div>
            );
        }
    }
}