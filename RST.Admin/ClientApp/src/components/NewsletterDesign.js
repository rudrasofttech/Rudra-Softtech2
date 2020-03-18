import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

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
            NewsletterDesign: "", loading: true, loggedin: loggedin, EmailGroup: "", Subject: ""
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
                    localStorage.removeItem("token");
                    this.setState({ error: true, message: "Authorization has been denied for this request.", loggedin: false });
                }
                return response.json();
            })
            .then(data => {
                this.setState({ loading: false });
                this.setState({ NewsletterDesign: data.KeyValue });
            });
    }

    handleChange(e) {
        switch (e.target.name) {
            case 'NewsletterDesign':
                this.setState({ NewsletterDesign: e.target.value });
                this.saveWebsiteSetting(e.target.value);
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

                this.setState({ loading: false });
                if (response.status === 200 || response.status === 204) {
                    console.log(response.status);
                }
                else if (response.status === 401) {
                    this.setState({ error: true, message: "Authorization has been denied for this request." });
                    alert("Authorization has been denied for this request.");
                } else {
                    alert("Unable to save newsletter.");
                }
            });
    }

    sendNewsLetter() {
        this.setState({ loading: true });
        fetch('http://localhost:59709/api/EmailMessages/SendNewsletter',
            {
                method: 'Post',
                body: JSON.stringify({ EmailGroup: this.state.EmailGroup, Subject: this.state.Subject}),
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("token"),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {

                this.setState({ loading: false });
                if (response.status === 200 || response.status === 204) {
                    console.log(response.status);
                    response.json().then(data => { alert(data + " Newsletter Sent."); });
                }
                else if (response.status === 401) {
                    this.setState({ error: true, message: "Authorization has been denied for this request." });
                    alert("Authorization has been denied for this request.");
                } else {
                    alert("Unable to send newsletter.");
                }
            });
    }

    renderTable() {
        return (
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