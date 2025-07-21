import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { FormGroup, FormControl, Button, ControlLabel, ProgressBar, Alert, Col, Grid, Row } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';

export class LoginForm extends Component {
    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");

        let loggedin = true;
        if (token === null) {
            loggedin = false;
        }
        this.state = { email: '', password: '', loading: false, redirect: '', error: false, message: '', bsstyle: '' };

        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePassChange = this.handlePassChange.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
    }

    fetchToken() {
        this.setState({ loading: true });
        fetch(API.GetURL() + '/account/login',
            {
                method: 'post',
                body: JSON.stringify({ email: this.state.email, password: this.state.password }),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
                console.log(response.status);
                
                if (response.status === 200) {
                    response.json().then(data => {
                        localStorage.setItem("token", data.token);
                        this.setState({ redirect: '/custompagelist' });
                    });
                }
                else if (response.status === 401) {
                    this.setState({ redirect: '/loginform' });
                }
                else {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({ bsstyle: 'danger', message: data.error });
                    }).catch(err => {
                        console.log(err);
                        this.setState({ bsstyle: 'danger', message: "Unable to process request." });
                    });
                }
            }).catch(err2 => {
                console.log(err2);
                this.setState({ bsstyle: 'danger', message: "Unable to contact server." });
            }).finally(() => {
                this.setState({ loading: false });
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

    render() {
        if (this.state.redirect !== "") {
            return <Redirect to={this.state.redirect} />;
        } 
        return <div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Login</h1>
                {/*<div className="btn-toolbar mb-2 mb-md-0">*/}
                {/*    <div className="btn-group mr-2">*/}
                {/*        <button type="button" className="btn btn-sm btn-outline-secondary">Share</button>*/}
                {/*        <button type="button" className="btn btn-sm btn-outline-secondary">Export</button>*/}
                {/*    </div>*/}
                {/*    <button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle">*/}
                {/*        <span data-feather="calendar"></span>*/}
                {/*        This week*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>
            <div style={{maxWidth:"500px"} }>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <form onSubmit={this.formSubmit}>
                    <div className="mb-3">
                        <label className='form-label' htmlFor="emailtxt">Email</label>
                        <input type='text' required maxLength="300" value={this.state.email}
                            placeholder="contact@rudrasofttech.com"
                            onChange={this.handleEmailChange} className="form-control" id="emailtxt"/>
                    </div>
                    <div className="mb-3">
                        <label className='form-label' htmlFor="passwordtxt">Password</label>
                        <input type='password' required maxLength="300" value={this.state.password}
                            onChange={this.handlePassChange} className="form-control" id="passwordtxt" />
                    </div>
                    <button disabled={this.state.loading} type="submit" className="btn btn-primary">
                        {this.state.loading ? <div className="spinner-border spinner-border-sm me-2" role="status">
                        </div> : null}
                        Login</button>
                </form>
            </div>
        </div>;
    }
}