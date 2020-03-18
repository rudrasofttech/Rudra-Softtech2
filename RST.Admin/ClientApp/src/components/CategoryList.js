import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';

export class CategoryList extends Component {
    displayName = CategoryList.name;
    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { categories: [], loading: true, loggedin: loggedin };
        this.handleDeleteCategory = this.handleDeleteCategory.bind(this);
        if (loggedin) {
            this.fetchData(token);
        }
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
            <Table responsive striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Url Name</th>
                        <th>Status</th>
                        <th><Link to={'/categorymanage/0'} className="btn btn-link">Create New</Link></th>
                    </tr>
                </thead>
                <tbody>
                    {ds.map(cp =>
                        <tr key={cp.ID}>
                            <td>{cp.ID}</td>
                            <td>{cp.Name}</td>
                            <td>{cp.UrlName}</td>
                            <td>{this.renderMemberStatus(cp.Status)}</td>
                            <td><Link className='btn btn-link btn-md' to={'/categorymanage/' + cp.ID}>Edit</Link>
                                <button type='button' name={cp.ID} className='btn btn-link btn-md' onClick={this.handleDeleteCategory}>Delete</button></td>
                        </tr>
                    )}
                </tbody>
            </Table>
        );
    }
    fetchData(t) {
        fetch('http://localhost:59709/api/Categories', {
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

                this.setState({ categories: data, loading: false });
            });
    }
    handleDeleteCategory(e) {
        if (window.confirm("Are you sure you want to delete this category?")) {
            fetch('http://localhost:59709/api/Categories/' + e.target.name,
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

                        localStorage.removeItem("token");
                        this.setState({ error: true, message: "Authorization has been denied for this request." });

                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ error: false, loggedin: false });
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
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.categories);
            return (
                <div>
                    <h1>Categories</h1>
                    {contents}
                </div>
            );
        }
    }
}