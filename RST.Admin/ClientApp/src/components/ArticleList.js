import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import dayjs from 'dayjs';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';

export class ArticleList extends Component {
    displayName = ArticleList.name

    constructor(props) {
        super(props);

        this.state = { articles: [], token: localStorage.getItem("token"), loading: false, loggedin: localStorage.getItem("token") !== null, bsstyle: '', message: '' };
        this.handleDeleteArticle = this.handleDeleteArticle.bind(this);
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData() {
        this.setState({ loading: true });
        fetch(API.GetURL() + '/posts', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });
                } else if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({ articles: data });
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

    handleDeleteArticle(e) {
        if (window.confirm("Are you sure you want to delete this article?")) {
            fetch(API.GetURL() + '/posts/' + e.target.name,
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
                            this.setState({ message: 'Article deleted', bsstyle: 'success', loggedin: false });
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
                        <tr key={cp.id}>
                            <td>{cp.title}</td>
                            <td>{dayjs(cp.dateCreated).format("DD.MMM.YYYY")}</td>
                            <td>{cp.createdByName}</td>
                            <td>{cp.dateModified !== null ? dayjs(cp.dateModified).format("DD.MMM.YYYY") : null}</td>
                            <td>{cp.modifiedByName}</td>
                            <td>{cp.status}</td>
                            <td><Link className='btn btn-link' to={'/articlemanage/' + cp.id}>Edit</Link>
                                <button type='button' name={cp.id} className='btn btn-link' onClick={this.handleDeleteArticle}>Delete</button></td>
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
                ? <Spinner />
                : this.renderTable(this.state.articles);
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                        <h1 className="h2">Articles</h1>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    {contents}
                </div>
            );
        }
    }
}
