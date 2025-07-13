import React, { Component } from 'react';
import { API } from './api';
import { MessageStrip } from './MessageStrip';
import Spinner from './shared/Spinner';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import template from '../template.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

class UserWebsiteThemeList extends Component {
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
        fetch(`${API.GetURL()}/UserWebsiteTheme?page=${page}&psize=${this.state.pageSize}`, {
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
                        response.json().then(data => {
                            let list = this.state.item.filter(t => t.id !== data.id);
                            this.setState({ items: list });
                        });
                    }
                    else {
                        response.json().then(data => {
                            this.setState({ error: data.error });
                        }).catch(err => {
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
                        <h1 className="h2"><img src={template} className="img-fluid icon-large me-2" /> User Website Themes</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <Link to={'/userwebsitethememanage'} className="btn btn-primary">Create Theme</Link>
                        </div>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={error} bsstyle={"danger"} />
                    </div>
                    {loading ? <Spinner /> : null}
                    {!loading && !error && (
                        <div>
                            <Table responsive striped bordered condensed hover>
                                <thead>
                                    <tr>
                                        <th style={{ width: "150px" }}></th>
                                        <th>Name</th>
                                        <th>Tags</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {themes.map(theme => (
                                        <tr key={theme.id}>
                                            <td><img src={theme.thumbnail} className="img-fluid" /></td>
                                            <td>{theme.name}</td>
                                            <td>{theme.tags}</td>
                                            <td>{new Date(theme.createDate).toLocaleString()}</td>
                                            <td>
                                                <Link className='btn btn-link' to={`/userwebsitethememanage/${theme.id}`}>
                                                    <img src={editicon} className="img-fluid icon-extra-small" />
                                                </Link>
                                            </td>
                                            <td>
                                                <button type='button' className='btn btn-link' onClick={() => { this.handleDeleteTheme(theme.id) }}>
                                                    <img src={deleteicon} className="img-fluid icon-extra-small" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {themes.length === 0 ? <tr><td colspan={6}>No themes found.</td></tr> : null}
                                </tbody>
                            </Table>
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

export default UserWebsiteThemeList;