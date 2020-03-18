import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, Button, ControlLabel, ProgressBar, Alert, Grid, Row, Table, Col } from 'react-bootstrap';

export class ChangePassword extends Component {
    displayName = ChangePassword.name;

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.handleChange = this.handleChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.handleDismiss = this.handleDismiss.bind(this);

        this.state = {
            cpdata: { MemberID: 0, NewPassword: '' }, loading: true, loggedin: loggedin, reload: false, bsstyle: '', message: ''
        };
        if (loggedin) {
            this.fetchData(token, this.props.match.params.ID === null ? '0' : this.props.match.params.ID);
        }
    }

    fetchData(t, id) {
        fetch('http://localhost:59709/api/Members/' + id, {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Can't get member details. Authorization has been denied for this request.", loggedin: false });
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                this.setState({ cpdata: { MemberID: data.ID, NewPassword: '' }, member: data, loading: false, message: '', bsstyle: '' });
            });
    }

    saveData(e) {
        let saveurl = 'http://localhost:59709/api/Members/ChangePassword/' + this.state.member.ID;
        let method = 'post';
        this.setState({ loading: true });
        fetch(saveurl, {
            method: method,
            body: JSON.stringify(this.state.cpdata),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token"),
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loggedin: false });
                } else if (response.status === 200) {
                    this.setState({ loading: false, message: "Password for " + this.state.member.Email + " changed.", bsstyle: 'success' });
                } else {
                    this.setState({ loading: false, message: "Password cannot be saved.", bsstyle: 'danger' });
                }
            });
    }
    handleChange(e) {
        var temp = this.state.cpdata;
        switch (e.target.name) {
            case 'NewPassword':
                temp.NewPassword = e.target.value;
                break;
        }
        this.setState({ cpdata: temp });
    }

    handleDismiss(e) {
        this.setState({ message: '', bsstyle: '' });
    }
    renderTable(page) {
        let messagehtml = <span />;
        if (this.state.message !== '') {
            messagehtml = <Alert className="noMargin noRadius" bsStyle={this.state.bsstyle}>
                <p>
                    {this.state.message}
                </p>
                <p>
                    <Button className="btn btn-sm" onClick={this.handleDismiss}>Hide</Button>
                </p>
            </Alert>;
        }
        return (
            <div>
                <div className="fixedBottom ">
                    {messagehtml}
                </div>
                <Grid fluid>
                    <Row>
                        <Col sm={6}>
                            <Table className='table'>
                                <tbody>
                                    <tr>
                                        <td>
                                            <FormGroup controlId="Member" >
                                                <ControlLabel>Member</ControlLabel>
                                                <FormControl type="text" value={page.Email} required />
                                            </FormGroup>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            <FormGroup controlId="Password" >
                                                <ControlLabel>Password (Required)</ControlLabel>
                                                <FormControl name="NewPassword" minLength="8" type="text" value={this.state.cpdata.NewPassword} onChange={this.handleChange} />
                                            </FormGroup>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Button type="button" onClick={this.saveData}>Save</Button>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Grid>
            </div>
        );
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else if (this.state.reload) {
            return <Redirect to={'/customdatasourcelist'} />;
        }
        else {
            let contents = this.state.loading
                ? <ProgressBar active now={100} />
                : this.renderTable(this.state.member);
            return (
                <div>
                    <h1>Category</h1>
                    {contents}
                </div>
            );
        }
    }
}