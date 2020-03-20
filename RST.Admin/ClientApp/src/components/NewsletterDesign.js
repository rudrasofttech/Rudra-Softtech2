import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';

export class NewsletterDesign extends Component {
    displayName = NewsletterDesign.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = {
            NewsletterDesign: "", loading: true, loggedin: loggedin, EmailGroup: "", Subject: "", bsstyle: '', message: ''
        };

        this.handleChange = this.handleChange.bind(this);
        this.sendNewsLetter = this.sendNewsLetter.bind(this);
        if (loggedin) {
            this.fetchData(token);
        }
    }

    fetchData(t) {
        fetch('http://localhost:59709/api/WebsiteSettings/NewsletterDesign', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                } else {
                    response.json()
                        .then(data => {
                            this.setState({ loading: false, NewsletterDesign: data.KeyValue, bsstyle: '', message: '' });
                        });
                }
            });
    }

    handleChange(e) {
        switch (e.target.name) {
            case 'NewsletterDesign':
                
                this.saveWebsiteSetting(e.target.value);
                this.setState({ NewsletterDesign: e.target.value });
                break;
            case 'EmailGroup':
                this.setState({ EmailGroup: e.target.value });
                break;
            case 'Subject':
                this.setState({ Subject: e.target.value });
                break;
        }

    }

    saveWebsiteSetting(keyvalue) {
        fetch('http://localhost:59709/api/websitesettings/NewsletterDesign',
            {
                method: 'Put',
                body: JSON.stringify({ KeyName: 'NewsletterDesign', KeyValue: keyvalue }),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("token"),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    this.setState({ bsstyle: 'success', message: "Saved" });
                }
                else if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.Message });
                    });
                }
            });
    }

    sendNewsLetter() {
        this.setState({ loading: true });
        fetch('http://localhost:59709/api/EmailMessages/SendNewsletter',
            {
                method: 'Post',
                body: JSON.stringify({ EmailGroup: this.state.EmailGroup, Subject: this.state.Subject }),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("token"),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    console.log(response.status);
                    response.json().then(data => {
                        this.setState({ bsstyle: 'success', message: data + " Newsletter Sent.", loading: false });
                    });
                }
                else if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.Message, loading: false });
                    });
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
                                <FormGroup controlId="NewsletterDesign">
                                    <FormControl name="NewsletterDesign" onChange={this.handleChange} componentClass="textarea" value={this.state.NewsletterDesign} placeholder="" rows="20" />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="EmailGroup">
                                    <ControlLabel>Email Group</ControlLabel>
                                    <FormControl name="EmailGroup" onChange={this.handleChange} value={this.state.EmailGroup} placeholder="" />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Subject">
                                    <ControlLabel>Subject (Required)</ControlLabel>
                                    <FormControl name="Subject" onChange={this.handleChange} value={this.state.Subject} placeholder="" />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <button type="button" onClick={this.sendNewsLetter} className="btn btn-primary">Send</button>
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
                    <h1>Newsletter Design</h1>
                    {contents}
                </div>
            );
        }
    }
}