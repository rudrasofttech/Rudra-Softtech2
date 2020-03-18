import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Col, Grid, Row, FormGroup, InputGroup, FormControl, Table } from 'react-bootstrap';

export class EmailList extends Component {
    displayName = EmailList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { data: { Messages: [], TotalPages: 0, Page: 0 }, pagesize: 20, etype: '', group: '', sent: '', read: '', loading: true, loggedin: loggedin, emailgroups:[] };
        this.handleChange = this.handleChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
        if (loggedin) {
            this.fetchEmailGroup();
            this.fetchData(token, 0, this.state.pagesize, this.state.etype, this.state.group, this.state.sent, this.state.read);
        }
    }

    fetchData(t, page, size, etype, group, sent, read) {
        fetch('http://localhost:59709/api/EmailMessages?page=' + page + '&psize=' + size + '&etype=' + etype + '&group=' + group + '&sent=' + sent + '&read=' + read, {
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
                console.log(data);
                this.setState({ data: data, loading: false });
            });
    }

    fetchEmailGroup() {
        fetch('http://localhost:59709/api/EmailMessages/EmailGroups',
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem("token")
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    response.json().then(data => { this.setState({ emailgroups: data }); });
                }
                else if (response.status === 401) {
                    console.log("Authorization has been denied for this request for email groups.");
                } 
            });
    }

    renderEmailType(param) {

        switch (param) {
            case 1:
                return 'Activation';
            case 2:
                return 'Unsubscribe';
            case 6:
                return 'Communication';
            case 3:
                return 'Newsletter';
            case 4:
                return 'ChangePassword';
            case 5:
                return 'Reminder';
            default:
                return '';
        }
    }

    handlePageChange(e) {
        if (e.target.value !== '') {
            this.fetchData(localStorage.getItem("token"), parseInt(e.target.value, 10), this.state.pagesize, this.state.etype, this.state.group, this.state.sent, this.state.read);
        }
    }

    handlePageSizeChange(e) {
        if (e.target.value !== '') {
            this.setState({ pagesize: e.target.value });
            this.fetchData(localStorage.getItem("token"), 1, e.target.value, this.state.etype, this.state.group, this.state.sent, this.state.read);
        }
    }
    handleChange(e) {
        switch (e.target.name) {
            case 'EmailMessageType':
                this.setState({ etype: e.target.value });
                this.fetchData(localStorage.getItem("token"), 1, this.state.pagesize, e.target.value, this.state.group, this.state.sent, this.state.read);
                break;
            case 'EmailGroup':
                this.setState({ group: e.target.value });
                this.fetchData(localStorage.getItem("token"), 1, this.state.pagesize, this.state.etype, e.target.value, this.state.sent, this.state.read);
                break;
            case 'Sent':
                this.setState({ sent: e.target.value });
                this.fetchData(localStorage.getItem("token"), 1, this.state.pagesize, this.state.etype, this.state.group, e.target.value, this.state.read);
                break;
            case 'Read':
                this.setState({ read: e.target.value });
                this.fetchData(localStorage.getItem("token"), 1, this.state.pagesize, this.state.etype, this.state.group, this.state.sent, e.target.value);
                break;
            default:
                break;
        }
        
    }
    renderTable(ds) {
        let paging = <span />;
        if (this.state.data.TotalPages > 0) {
            paging = <Row>
                <Col smOffset={8} sm={2}>
                    <FormGroup controlId="formControlsSelect">
                        <FormControl componentClass="select" value={this.state.pagesize} onChange={this.handlePageSizeChange} placeholder="select" title="Page Size">
                            <option value="10">10 Per Page</option>
                            <option value="20">20 Per Page</option>
                            <option value="30">30 Per Page</option>
                            <option value="50">50 Per Page</option>
                            <option value="100">100 Per Page</option>
                        </FormControl>
                    </FormGroup>

                </Col>
                <Col sm={2}>
                    <FormGroup>
                        <InputGroup>
                            <InputGroup.Addon>Go To</InputGroup.Addon>
                            <FormControl min="1" max={this.state.data.TotalPages} type="number" value={this.state.data.Page} onChange={this.handlePageChange} />
                            <InputGroup.Addon> / {this.state.data.TotalPages}</InputGroup.Addon>
                        </InputGroup>
                    </FormGroup>
                </Col>
            </Row>;
        }
        return (
            <Grid fluid="true">
                <Row>
                    <Col sm={3}>
                        <FormGroup controlId="EmailMessageType">
                            <FormControl componentClass="select" name="EmailMessageType" value={this.state.etype} onChange={this.handleChange} placeholder="select" title="Email Message Type">
                                <option value="">Email Type</option>
                                <option value="1">Activation</option>
                                <option value="2">Unsubscribe</option>
                                <option value="6">Communication</option>
                                <option value="3">Newsletter</option>
                                <option value="4">ChangePassword</option>
                                <option value="5">Reminder</option>
                            </FormControl>
                        </FormGroup>
                    </Col>
                    <Col sm={3}>
                        <FormGroup controlId="EmailGroup">
                            <FormControl componentClass="select" name="EmailGroup" value={this.state.group} onChange={this.handleChange} placeholder="select" title="Email Message Group">
                                <option value="">Email Group</option>
                                {this.state.emailgroups.map(cp =>
                                    <option key={cp.EmailGroup} value={cp.EmailGroup}>{cp.EmailGroup}</option>
                                )}
                            </FormControl>
                        </FormGroup>
                    </Col>
                    <Col sm={3}>
                        <FormGroup controlId="Sent">
                            <FormControl componentClass="select" name="Sent" value={this.state.sent} onChange={this.handleChange} placeholder="select" title="Email Sent">
                                <option value="">Is Sent</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </FormControl>
                        </FormGroup>
                    </Col>
                    <Col sm={3}>
                        <FormGroup controlId="Read">
                            <FormControl componentClass="select" name="Read" value={this.state.read} onChange={this.handleChange} placeholder="select" title="Email Read">
                                <option value="">Is Read</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </FormControl>
                        </FormGroup>
                    </Col>
                </Row>
                {paging}
                <Row>
                    <Col sm={12}>
                        <Table responsive striped bordered condensed hover>
                            <thead>
                                <tr>
                                    <th>To</th>
                                    <th>Last Attempt</th>
                                    <th>Read</th>
                                    <th>Sent</th>
                                    <th>Email Group</th>
                                    <th>Create Date</th>
                                    <th>Sent Date</th>
                                    <th>Subject</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ds.map(cp =>
                                    <tr key={cp.ID}>
                                        <td>{cp.ToAddress} {cp.ToName}</td>
                                        <td>{cp.LastAttempt}</td>
                                        <td><input type="checkbox" defaultChecked={cp.IsRead} disabled /></td>
                                        <td><input type="checkbox" defaultChecked={cp.IsSent} disabled /></td>
                                        <td>{cp.EmailGroup}</td>
                                        <td>{cp.CreateDate}</td>
                                        <td>{cp.SentDate}</td>
                                        <td>{cp.Subject}</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Grid>

        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.data.Messages);
            return (
                <div>
                    <h1>Emails</h1>
                    {contents}
                </div>
            );
        }
    }
}