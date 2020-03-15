import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Moment from 'react-moment';
import { Table } from 'react-bootstrap';

export class ArticleList extends Component {
    displayName = ArticleList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { articles: [], loading: true, loggedin: loggedin };
        this.handleDeleteArticle = this.handleDeleteArticle.bind(this);
        if (loggedin) {
            this.fetchData(token);
        }
    }
    fetchData(t) {
        fetch('http://localhost:59709/api/posts', {
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
                this.setState({ articles: data, loading: false });
            });
    }
    handleDeleteArticle(e) {
        if (window.confirm("Are you sure you want to delete this particle?")) {
            fetch('http://localhost:59709/api/posts/' + e.target.name,
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
                            let list = this.state.articles;
                            for (var k in list) {
                                if (list[k].ID === data.ID) {
                                    list.splice(k, 1);
                                    this.setState({ articles: list });
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

    columns = [
        { title: 'ID', prop: 'ID' },
        { title: 'Title', prop: 'Title' },
        { title: 'Date Created', prop: 'DateCreated' },
        { title: 'Created By', prop: 'CreatedByName' },
        { title: 'Date Modified', prop: 'DateModified' },
        { title: 'Modified By', prop: 'ModifiedByName' },
        { title: 'Status', prop: 'Status' }
    ];
    renderTable(ds, columns) {
        return (
            <Table responsive striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Date Created</th>
                        <th>Created By</th>
                        <th>Date Modified</th>
                        <th>Modified By</th>
                        <th>Status</th>
                        <th><Link to={'/articlemanage/0'} className="btn btn-link">Create New</Link></th>
                    </tr>
                </thead>
                <tbody>
                    {ds.map(cp =>
                        <tr key={cp.ID}>
                            <td>{cp.ID}</td>
                            <td>{cp.Title}</td>
                            <td><Moment format="MM/DD/YYYY">
                                {cp.DateCreated}</Moment></td>
                            <td>{cp.CreatedByName}</td>
                            <td><Moment format="MM/DD/YYYY">{cp.DateModified}</Moment></td>
                            <td>{cp.ModifiedByName}</td>
                            <td>{cp.Status}</td>
                            <td><Link className='btn btn-link' to={'/articlemanage/' + cp.ID}>Edit</Link>
                                <button type='button' name={cp.ID} className='btn btn-link' onClick={this.handleDeleteArticle}>Delete</button></td>
                        </tr>
                    )}
                </tbody>
            </Table>
        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.articles, this.columns);
            return (
                <div>
                    <h1>Articles</h1>
                    {contents}
                </div>
            );
        }
    }
}
