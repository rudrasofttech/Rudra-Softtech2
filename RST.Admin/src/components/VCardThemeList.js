import React, { Component } from 'react';
import { API } from './api';
import { MessageStrip } from './MessageStrip';
import Spinner from './shared/Spinner';
import { Link, Redirect } from 'react-router-dom';

import template from '../template.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

class VCardThemeList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            themes: [],
            token: localStorage.getItem("token"),
            loading: true,
            loggedin: localStorage.getItem("token") !== null,
            error: null,
            page: 1,
            pageSize: 20,
            totalRecords: 0,
            pageCount: 0
        };
    }

    componentDidMount() {
        this.fetchThemes();
    }

    fetchThemes = (page = this.state.page) => {
        this.setState({ loading: true, error: null });
        fetch(`${API.GetURL()}/UserWebsiteTheme?page=${page}&psize=${this.state.pageSize}&wstype=1`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({
                            themes: data.items || [],
                            totalRecords: data.totalRecords || 0,
                            page: data.pageIndex || 1,
                            pageCount: data.pageCount || 0,
                            loading: false
                        });
                    });
                } else if (response.status === 401) {
                    this.setState({ loggedin: false, loading: false });
                }
            })
            .catch(error => {
                console.error("Error fetching themes:", error);
                this.setState({ error: 'Failed to load themes.', loading: false });
            });
    }

    handleDeleteTheme(e) {
        if (window.confirm("Are you sure you want to delete this theme?")) {
            this.setState({ loading: true, error: '' });
            fetch(`${API.GetURL()}/UserWebsiteTheme/delete/${e}`,
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
                        let list = this.state.themes.filter(t => t.id !== e);
                        this.setState({ themes: list });
                    }
                    else {
                        response.json().then(data => {
                            this.setState({ error: data.error });
                        }).catch(err2 => {
                            console.log(err2);
                            this.setState({ error: "Unable to process request." });
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    this.setState({ error: "Unable to contact server." });
                }).finally(() => {
                    this.setState({ loading: false });
                });
        }
    }

    handlePageChange = (newPage) => {
        this.fetchThemes(newPage);
    }

    render() {
        const { themes, loading, error, page, pageSize, totalRecords, loggedin, pageCount } = this.state;
        if (!loggedin) {
            return (<Redirect to="/loginform" />);
        } else
            return (
                <div>

                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={template} className="img-fluid icon-large me-2" /> Visiting Card Themes</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <button type="button" className="btn btn-secondary me-2" onClick={() => {
                                this.setState({ page: 1 }, () => { this.fetchThemes() });
                            }}>
                                Refresh
                            </button>
                            <Link to={'/userwebsitethememanage'} className="btn btn-primary">Create Theme</Link>
                        </div>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={error} bsstyle={"danger"} />
                    </div>
                    {loading ? <Spinner /> : null}
                    {!loading && !error && (
                        <div className="row row-cols-1 row-cols-md-3 g-4">
                            {themes.map(theme => (
                                <div className="col">
                                    <div className="card">
                                        <div className="row g-0">
                                            <div className="col-md-4">
                                                <img src={theme.thumbnail} className="img-fluid rounded-start" alt="" />
                                            </div>
                                            <div className="col-md-8">
                                                <div className="card-body">
                                                    <h5 className="card-title">{theme.name}</h5>
                                                    <p className="card-text">{theme.tags}</p>
                                                    <p className="card-text"><small className="text-body-secondary">{new Date(theme.createDate).toLocaleString()}</small></p>
                                                    <p className="card-text">
                                                        <Link className='btn btn-link' to={`/userwebsitethememanage/${theme.id}`}>
                                                            <img src={editicon} className="img-fluid icon-extra-small me-2" />
                                                        </Link>
                                                        <button type='button' className='btn btn-link' onClick={() => { this.handleDeleteTheme(theme.id) }}>
                                                            <img src={deleteicon} className="img-fluid icon-extra-small" />
                                                        </button>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {themes.length === 0 ? <div>No themes found.</div> : null}
                            {pageCount > 1 ? <div>
                                <button className="btn btn-sm btn-light" type="button"
                                    disabled={page <= 1}
                                    onClick={() => this.handlePageChange(page - 1)}
                                >
                                    Previous
                                </button>
                                <span style={{ margin: '0 10px' }}>
                                    Page {page} of {Math.ceil(totalRecords / pageSize)}
                                </span>
                                <button className="btn btn-sm btn-light" type="button"
                                    disabled={page >= Math.ceil(totalRecords / pageSize)}
                                    onClick={() => this.handlePageChange(page + 1)}
                                >
                                    Next
                                </button>
                            </div> : null}

                        </div>
                    )}
                </div>
            );
    }
}

export default VCardThemeList;