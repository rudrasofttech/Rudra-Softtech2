import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, ProgressBar, Alert, Grid, Row, Col, Button } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';

export class CustomPageList extends Component {
    displayName = CustomPageList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { custompages: [], loading: true, loggedin: loggedin, bsstyle: '', message: '' };
        this.handleDeletePage = this.handleDeletePage.bind(this);

        if (loggedin) {
            this.fetchData(token);
        }
    }

    fetchData(t) {
        fetch('http://localhost:59709/api/custompages', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                this.setState({ loading: false });
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });
                } else if (response.status === 200) {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({ custompages: data, loading: false, bsstyle: '', message: '' });
                    });
                } else {
                    response.json().then(data => {
                        this.setState({bsstyle: 'danger', message: data.Message });
                    });
                }
            });
    }

    handleDeletePage(e) {
        if (window.confirm("Are you sure you want to delete this page?")) {
            fetch('http://localhost:59709/api/custompages/' + e.target.name,
                {
                    method: 'delete',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem("token"),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                .then(response => {
                    console.log(response.status);
                    if (response.status === 200) {
                        response.json().then(data => {
                            console.log(data);
                            let list = this.state.custompages;
                            for (var k in list) {
                                if (list[k].ID === data.ID) {
                                    list.splice(k, 1);
                                    this.setState({ custompages: list });
                                    break;
                                }
                            }
                        });
                    }
                    else if (response.status === 401) {
                        this.setState({ bsstyle: "danger", message: "Authorization has been denied for this request." });
                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ bsstyle: 'danger', message: data.Message });
                        });
                    }
                });
        }
    }

    renderPostStatus(param) {
        switch (param) {
            
            case 1:
                return 'Draft';
            case 2:
                return 'Publish';
            case 3:
                return 'Inactive';
            default:
                return '';
        }
    }

    renderCustomPagesTable(custompages) {
        
        return (
            <div>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Grid fluid>
                    <Row>
                        <Col sm={12}>
                            <Table responsive striped bordered condensed hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Date Created</th>
                                        <th>Created By</th>
                                        <th>Date Modified</th>
                                        <th>Modified By</th>
                                        <th>Status</th>
                                        <th>Sitemap</th>
                                        <th><Link to={'/custompagemanage/0'} className="btn btn-link">Create New</Link></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {custompages.map(cp =>
                                        <tr key={cp.ID}>
                                            <td>{cp.ID}</td>
                                            <td>{cp.Name}</td>
                                            <td>
                                                    {cp.DateCreated}
                                            </td>
                                            <td>{cp.CreatedByName}</td>
                                            <td>
                                                {cp.DateModified}</td>
                                            <td>{cp.ModifiedByName}</td>
                                            <td>{this.renderPostStatus(cp.Status)}</td>
                                            <td>
                                                <input type="checkbox" defaultChecked={cp.Sitemap} disabled />
                                            </td>
                                            <td><Link className='btn btn-link' to={'/custompagemanage/' + cp.ID}>Edit</Link>
                                                <button type='button' name={cp.ID} className='btn btn-link' onClick={this.handleDeletePage}>Delete</button></td>
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
                : this.renderCustomPagesTable(this.state.custompages, this.columns);
            return (
                <div>
                    <h1>Web Pages</h1>
                    {contents}
                </div>
            );
        }
    }
}
