import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Col, Grid, Row, FormGroup, InputGroup, FormControl, Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';

export class MemberList extends Component {
    displayName = MemberList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = {
            data: { Members: [], TotalPages: 0, Page: 0 }, pagesize: 20, loading: true, loggedin: loggedin, showchangepasswordmodal: false, bsstyle: '', message: ''
        };
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handlePageSizeChange = this.handlePageSizeChange.bind(this);
        if (loggedin) {
            this.fetchData(token, 1, this.state.pagesize);
        }
    }

    fetchData(t, page, size) {
        fetch('http://localhost:59709/api/members?page=' + page + '&psize=' + size, {
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
                            console.log(data);
                            this.setState({ bsstyle: '', message: '', data: data, loading: false });
                        });
                }
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
            this.fetchData(localStorage.getItem("token"), parseInt(e.target.value, 10), this.state.pagesize);
        }
    }

    handlePageSizeChange(e) {
        this.setState({ pagesize: e.target.value });
        this.fetchData(localStorage.getItem("token"), 1, e.target.value);
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
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Date Created</th>
                                        <th>Date Modified</th>
                                        <th>Status</th>
                                        <th>Type</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {ds.map(cp =>
                                        <tr key={cp.ID}>
                                            <td>{cp.ID}</td>
                                            <td>{cp.Email}</td>
                                            <td>{cp.FirstName}</td>
                                            <td>{cp.CreateDate}</td>
                                            <td>{cp.ModifyDate}</td>
                                            <td>{this.renderMemberStatus(cp.Status)}</td>
                                            <td>{this.renderMemberType(cp.UserType)}</td>
                                            <td><Link className='btn btn-link' to={'/changepassword/' + cp.ID}>Change Password</Link></td>
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
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.data.Members, this.columns);
            return (
                <div>
                    <h1>Members</h1>
                    {contents}
                </div>
            );
        }
    }
}