import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Col, Grid, Row, FormGroup, InputGroup, FormControl, Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import members from '../group.png';
import Spinner from './shared/Spinner';
import dayjs from 'dayjs';
export class MemberList extends Component {
    displayName = MemberList.name

    constructor(props) {
        super(props);

        this.state = {
            data: { items: [], pageCount: 0, pageIndex: 0 }, pagesize: 20, token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true, showchangepasswordmodal: false, bsstyle: '', message: ''
        };
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);

    }
    componentDidMount() {
        this.fetchData(1, this.state.pagesize);
    }

    fetchData(page, size) {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(API.GetURL() + '/members?page=' + page + '&psize=' + size, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                 if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({ data: data});
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

    renderMemberStatus(param) {
        switch (param) {
            case 0:
                return 'Active';
            case 1:
                return 'InActive';
            case 2:
                return 'Deleted';
            default:
                return '';
        }
    }

    renderMemberType(param) {
        switch (param) {
            case 1:
                return 'Admin';
            case 2:
                return 'Editor';
            case 6:
                return 'Demo';
            case 3:
                return 'Author';
            case 4:
                return 'Member';
            case 5:
                return 'Reader';
            default:
                return '';
        }
    }

    handlePageChange(e) {
        if (e.target.value !== '') {
            this.fetchData(parseInt(e.target.value, 10), this.state.pagesize);
        }
    }

    handlePageSizeChange(e) {
        this.setState({ pagesize: e.target.value });
        this.fetchData(localStorage.getItem("token"), 1, e.target.value);
    }

    renderTable(ds) {
        let paging = <span />;
        if (this.state.data.pageCount > 0) {
            paging = <Row>
                <Col smOffset={8} sm={2}>
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
                <Col sm={2}>
                    <div className="mb-3">
                        <div className="input-group">
                            <span className="input-group-text" id="basic-addon3">Go To</span>
                            <input min="1" max={this.state.data.pageCount} type="number" value={this.state.data.pageIndex} onChange={this.handlePageChange} className="form-control" id="basic-url" aria-describedby="basic-addon3 basic-addon4" />
                            <span className="input-group-text"> / {this.state.data.pageCount}</span>
                        </div>
                    </div>
                </Col>
            </Row>;
        }
        return (
            <div>
                <div className="fixedBottom">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Grid fluid="true">
                    {paging}
                    <Row>
                        <Col sm={12}>
                            <Table responsive striped bordered condensed hover>
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Last Logon</th>
                                        <th>Status</th>
                                        <th>Type</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {ds.map(cp =>
                                        <tr key={cp.id}>
                                            <td>{cp.email}</td>
                                            <td>{cp.firstName}</td>
                                            <td>{dayjs(cp.lastLogon).format("DD.MMM.YYYY")}</td>
                                            <td>{this.renderMemberStatus(cp.status)}</td>
                                            <td>{this.renderMemberType(cp.userType)}</td>
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
                : this.renderTable(this.state.data.items, this.columns);
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                        <h1 className="h2"><img src={members} className="img-fluid icon-large me-2" /> Members</h1>
                    </div>
                    {contents}
                </div>
            );
        }
    }
}