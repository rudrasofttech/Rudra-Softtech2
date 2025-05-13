import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Col, Grid, Row, FormGroup, InputGroup, FormControl, Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import email from '../letter.png';
import dayjs from 'dayjs';

export class EmailList extends Component {
    displayName = EmailList.name

    constructor(props) {
        super(props);
        
        this.state = {
            data: { items: [], pageCount: 0, pageIndex: 0 }, pagesize: 20, etype: '', group: '', sent: '', read: '', token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true, emailgroups: [], bsstyle: '', message: '' };
        this.handleChange = this.handleChange.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
    }

    componentDidMount() {
        this.fetchEmailGroup();
        this.fetchData(1, this.state.pagesize, this.state.etype, this.state.group, this.state.sent, this.state.read);
    }

    fetchData(page, size, etype, group, sent, read) {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(API.GetURL() + '/EmailMessages?page=' + page + '&psize=' + size + '&etype=' + etype + '&group=' + group + '&sent=' + sent + '&read=' + read, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({ data: data, loading: false, bsstyle: '', message: '' });
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

    fetchEmailGroup() {
        fetch(API.GetURL() + '/EmailMessages/EmailGroups',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                }
            })
            .then(response => {
                if (response.status === 200 || response.status === 204) {
                    response.json().then(data => { this.setState({ emailgroups: data }); });
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
            this.fetchData(parseInt(e.target.value, 10), this.state.pagesize, this.state.etype, this.state.group, this.state.sent, this.state.read);
        }
    }

    handlePageSizeChange(e) {
        if (e.target.value !== '') {
            this.setState({ pagesize: e.target.value });
            this.fetchData( 1, e.target.value, this.state.etype, this.state.group, this.state.sent, this.state.read);
        }
    }
    handleChange(e) {
        switch (e.target.name) {
            case 'EmailMessageType':
                this.setState({ etype: e.target.value });
                this.fetchData( 1, this.state.pagesize, e.target.value, this.state.group, this.state.sent, this.state.read);
                break;
            case 'EmailGroup':
                this.setState({ group: e.target.value });
                this.fetchData(1, this.state.pagesize, this.state.etype, e.target.value, this.state.sent, this.state.read);
                break;
            case 'Sent':
                this.setState({ sent: e.target.value });
                this.fetchData(1, this.state.pagesize, this.state.etype, this.state.group, e.target.value, this.state.read);
                break;
            case 'Read':
                this.setState({ read: e.target.value });
                this.fetchData(1, this.state.pagesize, this.state.etype, this.state.group, this.state.sent, e.target.value);
                break;
            default:
                break;
        }

    }
    renderTable(ds) {
        let paging = <span />;
        if (this.state.data.pageCount > 0) {
            paging = <Row>
                <Col md={3}>
                    <div className="mb-2">
                        <select className="form-select" defaultValue={this.state.pagesize} onChange={this.handlePageSizeChange} aria-label="Default select example">
                            <option value="10">10 Per Page</option>
                            <option value="20">20 Per Page</option>
                            <option value="30">30 Per Page</option>
                            <option value="50">50 Per Page</option>
                            <option value="100">100 Per Page</option>
                        </select>
                    </div>
                </Col>
                <Col md={3}>
                    <div className="mb-3">
                        <div className="input-group">
                            <span className="input-group-text" id="basic-addon3">Go To</span>
                            <input min="1" max={this.state.data.pageCount} type="number" value={this.state.data.pageIndex} onChange={this.handlePageChange} className="form-control" style={{width:"40px"}} id="basic-url" aria-describedby="basic-addon3 basic-addon4" />
                            <span className="input-group-text"> / {this.state.data.pageCount}</span>
                        </div>
                    </div>
                </Col>
            </Row>;
        }
        return (
            <div>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Grid fluid="true">
                    <Row className="mb-3">
                        <Col sm={3}>
                            <div className="mb-2">
                                <select className="form-select" name="EmailMessageType" value={this.state.etype} onChange={this.handleChange} placeholder="select" title="Email Message Type">
                                    <option value="">Email Type</option>
                                    <option value="1">Activation</option>
                                    <option value="2">Unsubscribe</option>
                                    <option value="6">Communication</option>
                                    <option value="3">Newsletter</option>
                                    <option value="4">ChangePassword</option>
                                    <option value="5">Reminder</option>
                                </select>
                            </div>
                        </Col>
                        <Col sm={3}>
                            <select className="form-select" name="EmailGroup" value={this.state.group} onChange={this.handleChange} placeholder="select" title="Email Message Group">
                                <option value="">Email Group</option>
                                {this.state.emailgroups.map(cp =>
                                    <option key={cp.emailGroup} value={cp.emailGroup}>{cp.emailGroup}</option>
                                )}
                            </select>
                        </Col>
                        <Col sm={3}>
                            <select className="form-select" name="Sent" value={this.state.sent} onChange={this.handleChange} placeholder="select" title="Email Sent">
                                <option value="">Is Sent</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </Col>
                        <Col sm={3}>
                            <select className="form-select" name="Read" value={this.state.read} onChange={this.handleChange} placeholder="select" title="Email Read">
                                <option value="">Is Read</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
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
                                        <tr key={cp.id}>
                                            <td>{cp.toName}<br />{cp.toAddress}</td>
                                            <td>{cp.lastAttempt !== null ? dayjs(cp.lastAttempt).format("DD.MMM.YYYY") : null}</td>
                                            <td><input type="checkbox" defaultChecked={cp.isRead} disabled /></td>
                                            <td><input type="checkbox" defaultChecked={cp.isSent} disabled /></td>
                                            <td>{cp.emailGroup}</td>
                                            <td>{dayjs(cp.createDate).format("DD.MMM.YYYY")}</td>
                                            <td>{cp.sentDate !== null ? dayjs(cp.sentDate).format("DD.MMM.YYYY") : null}</td>
                                            <td>{cp.subject}</td>
                                        </tr>
                                    )}
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
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <Spinner />
                : this.renderTable(this.state.data.items);
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={email} className="img-fluid icon-large me-2" /> Emails</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            
                        </div>
                    </div>
                    
                    {contents}
                </div>
            );
        }
    }
}