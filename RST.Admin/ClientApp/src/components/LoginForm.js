﻿import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FormGroup, FormControl, Button, ControlLabel, ProgressBar, Alert } from 'react-bootstrap';

export class LoginForm extends Component {
    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        
        let loggedin = true;
        if (token === null) {
            loggedin = false;
        } 
        this.state = { email: '', password: '', loading: false, loggedin: loggedin, error: false, message : '' };
        
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePassChange = this.handlePassChange.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
    }

    fetchToken() {
        this.setState({ loading: true });
        fetch('http://localhost:59709/token',
            {
                method: 'post',
                body: 'grant_type=password&password=' + this.state.password + '&username=' + this.state.email,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
            .then(response => {
                console.log(response.status);
                this.setState({ loading: false });
                if (response.status === 200) {
                    response.json().then(data => {
                        if (data.access_token !== undefined) {
                            localStorage.setItem("token", data.access_token);
                            this.setState({ error: false, loggedin: true });
                        }
                    });
                }
                else if (response.status === 401) {
                    this.setState({ error: true, message: "Authorization has been denied for this request." });
                }
                else {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({ error: false,loggedin: false });
                    });
                }
            });

    }

    getEmailValidationState() {
        const length = this.state.email.length;
        if (length > 10) return 'success';
        if (length < 10) return 'error';
        return null;
    }
    getPasswordValidationState() {
        const length = this.state.password.length;
        if (length > 2) return 'success';
        if (length < 2) return 'error';
        return null;
    }
    handleEmailChange(e) {
        this.setState({ email: e.target.value });
    }
    handlePassChange(e) {
        this.setState({ password: e.target.value });
    }
    formSubmit(e) {
        e.preventDefault();
        this.fetchToken();
    }
    renderForm() {
        if (this.state.loggedin) {
            return (<Redirect to="/custompagelist" />);
        } else {
            let alert=<span />;
            if (this.state.error) {
                alert = <Alert>{this.state.message}</Alert>;
            }
            return (
                <div>
                    <ProgressBar active now={100} style={{ display: this.state.loading ? 'block' : 'none' }} />
                    {alert}
                    <form onSubmit={this.formSubmit}>
                        <FormGroup controlId="emailtxt" validationState={this.getEmailValidationState()} >
                            <ControlLabel>Email</ControlLabel>
                            <FormControl
                                type="text"
                                value={this.state.email}
                                placeholder="contact@rudrasofttech.com"
                                onChange={this.handleEmailChange}
                            />

                        </FormGroup>
                        <FormGroup controlId="passwordtxt" validationState={this.getPasswordValidationState()}>
                            <ControlLabel>Password</ControlLabel>
                            <FormControl
                                type="password"
                                value={this.state.password}
                                onChange={this.handlePassChange}
                            />
                        </FormGroup>
                        <Button type="submit">Submit</Button>
                    </form>
                </div>
            );
        }
    }
    render() {
        let contents = this.renderForm();
        return (
            <div>
                <h1>Login</h1>
                {contents}
            </div>
        );
    }
}