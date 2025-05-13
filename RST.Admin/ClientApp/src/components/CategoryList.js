import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import categories from '../product-categories.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

export class CategoryList extends Component {
    displayName = CategoryList.name;

    constructor(props) {
        super(props);
        this.state = { categories: [], token: localStorage.getItem("token"), loading: true, loggedin: localStorage.getItem("token") === null ? false : true, bsstyle: '', message: '' };
        this.handleDeleteCategory = this.handleDeleteCategory.bind(this);

    }

    componentDidMount() {
        this.fetchData();
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

    renderTable(ds) {
        return (
            <div>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Table responsive striped bordered condensed hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Url Name</th>
                            <th>Status</th>
                            <th colSpan={2}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ds.map(cp =>
                            <tr key={cp.id}>
                                <td>{cp.name}</td>
                                <td>{cp.urlName}</td>
                                <td>
                                    {this.renderMemberStatus(cp.status)}
                                </td>
                                <td>
                                    <Link className='btn btn-link btn-md' to={'/categorymanage/' + cp.id}>
                                        <img src={editicon} className="img-fluid icon-extra-small" />
                                    </Link>
                                </td>
                                <td>
                                    <button type='button' name={cp.id} className='btn btn-link btn-md' onClick={this.handleDeleteCategory}>
                                        <img src={deleteicon} className="img-fluid icon-extra-small" />
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        );
    }

    fetchData() {
        this.setState({ loading: true });
        fetch(API.GetURL() + '/Categories', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                }
                else if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({ categories: data, loading: false, bsstyle: '', message: '' });
                    });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.Message });
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

    handleDeleteCategory(e) {
        if (window.confirm("Are you sure you want to delete this category?")) {
            fetch(API.GetURL() + 'Categories/' + e.target.name,
                {
                    method: 'delete',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.state.token}`
                    }
                })
                .then(response => {
                    console.log(response.status);
                    if (response.status === 200) {
                        response.json().then(data => {
                            console.log(data);
                            let list = this.state.categories;
                            for (var k in list) {
                                if (list[k].ID === data.ID) {
                                    list.splice(k, 1);
                                    this.setState({ categories: list });
                                    break;
                                }
                            }
                        });
                    }
                    else if (response.status === 401) {
                        this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loggedin: false });
                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ bsstyle: '', message: '', loggedin: false });
                        });
                    }
                });
        }
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <Spinner />
                : this.renderTable(this.state.categories);
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={categories} className="img-fluid icon-large me-2" />  Categories</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <Link to={'/categorymanage/0'} className="btn btn-primary">Create New</Link>
                        </div>
                    </div>
                    {contents}
                </div>
            );
        }
    }
}