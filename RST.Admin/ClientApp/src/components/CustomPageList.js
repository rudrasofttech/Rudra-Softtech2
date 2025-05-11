import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table, ProgressBar, Alert, Grid, Row, Col, Button } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import dayjs from 'dayjs';

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


    }
    componentDidMount() {
        this.fetchData(localStorage.getItem("token"));
    }

    fetchData(t) {
        this.setState({ loading: true });
        fetch(API.GetURL() + '/custompages/list', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {

                if (response.status === 401) {
                    //localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loggedin: false });
                } else if (response.status === 200) {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({ custompages: data, loading: false, bsstyle: '', message: '' });
                    });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.Message });
                    });
                }
            });
    }

    handleDeletePage(e) {
        if (window.confirm("Are you sure you want to delete this page?")) {
            fetch(API.GetURL() + '/custompages/' + e.target.name,
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

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                        <h1 className="h2">Web Pages</h1>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    {this.state.loading ? <Spinner /> : null }
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
                            {this.state.custompages.map(cp =>
                                <tr key={cp.id}>
                                    <td>{cp.id}</td>
                                    <td>{cp.name}</td>
                                    <td>
                                        {cp.dateCreated}
                                    </td>
                                    <td>{cp.createdByName}</td>
                                    <td>
                                        {cp.dateModified}</td>
                                    <td>{cp.modifiedByName}</td>
                                    <td>{this.renderPostStatus(cp.status)}</td>
                                    <td>
                                        <input type="checkbox" defaultChecked={cp.sitemap} disabled />
                                    </td>
                                    <td><Link className='btn btn-link' to={'/custompagemanage/' + cp.id}>Edit</Link>
                                        <button type='button' name={cp.id} className='btn btn-link' onClick={this.handleDeletePage}>Delete</button></td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            );
        }
    }
}
