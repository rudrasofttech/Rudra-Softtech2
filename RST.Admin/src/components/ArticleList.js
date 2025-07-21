import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import dayjs from 'dayjs';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import articles from '../article.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

export class ArticleList extends Component {
    displayName = ArticleList.name

    constructor(props) {
        super(props);

        this.state = {
            articles: [],
            token: localStorage.getItem("token"),
            loading: false,
            loggedin: localStorage.getItem("token") !== null,
            bsstyle: '',
            message: ''
        };
        this.handleDeleteArticle = this.handleDeleteArticle.bind(this);
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData() {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(API.GetURL() + '/posts', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({ articles: data });
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

    handleDeleteArticle(e) {
        if (window.confirm("Are you sure you want to delete this article?")) {
            this.setState({ loading: true, bsstyle: '', message: '' });
            fetch(`${API.GetURL()}/posts/remove/${e}`,
                {
                    method: 'get',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.state.token}`
                    }
                })
                .then(response => {
                    console.log(response.status);
                    if (response.status === 200) {
                        response.json().then(data => {
                            let list = this.state.articles.filter(t => t.id !== data.id);
                            this.setState({ articles: list });
                        });
                    }
                    else {
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
                        <th colSpan="2"></th>
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
                            <td>
                                <Link className='btn btn-link' to={`/articlemanage/${cp.id}`}>
                                    <img src={editicon} className="img-fluid icon-extra-small" />
                                </Link>
                            </td>
                            <td>
                                <button type='button' className='btn btn-link' onClick={() => { this.handleDeleteArticle(cp.id) }}>
                                    <img src={deleteicon} className="img-fluid icon-extra-small" />
                                </button>
                            </td>
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
            return <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={articles} className="img-fluid icon-large me-2" /> Articles</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <Link to={'/articlemanage'} className="btn btn-primary">Create New</Link>

                            {/*<div className="btn-group me-2">*/}
                            {/*    <button type="button" class="btn btn-sm btn-outline-secondary">Share</button>*/}
                            {/*    <button type="button" className="btn btn-sm btn-outline-secondary">Export</button>*/}
                            {/*</div>*/}
                            {/*<button type="button" className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1">*/}
                            {/*    <svg className="bi" aria-hidden="true"><use xlink: href="#calendar3"></use></svg>*/}
                            {/*This week*/}
                            {/*</button>*/}
                        </div>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    {this.state.loading ? <Spinner /> : null}
                    {this.renderTable(this.state.articles) }
                </div>;
        }
    }
}
