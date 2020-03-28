import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import Moment from 'react-moment';
import { Table, Alert, Grid, Row, Col } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';

export class ArticleList extends Component {
    displayName = ArticleList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { articles: [], loading: true, loggedin: loggedin, bsstyle: '', message: '' };
        this.handleDeleteArticle = this.handleDeleteArticle.bind(this);
        if (loggedin) {
            this.fetchData(token);
        }
    }

    fetchData(t) {
        fetch(API.GetURL() + 'api/posts', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });
                }
                return response.json();
            })
            .then(data => {
                this.setState({ articles: data, loading: false });
            });
    }

    handleDeleteArticle(e) {
        if (window.confirm("Are you sure you want to delete this article?")) {
            fetch(API.GetURL() + 'api/posts/' + e.target.name,
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
                        this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });

                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ message: 'Article deleted', bsstyle :'success', loggedin: false });
                        });
                    }
                });
        }
    }

    
    renderTable(ds) {
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
                : this.renderTable(this.state.articles);
            return (
                <div>
                    <h1>Articles</h1>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    {contents}
                </div>
            );
        }
    }
}
