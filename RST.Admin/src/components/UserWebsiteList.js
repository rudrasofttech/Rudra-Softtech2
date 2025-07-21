import React, { Component } from 'react';
import { API } from './api';
import { MessageStrip } from './MessageStrip';
import Spinner from './shared/Spinner';
import { Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import dayjs from 'dayjs';

class UserWebsiteList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            websites: [],
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
        this.fetchWebsites();
    }

    fetchWebsites = (page = this.state.page) => {
        this.setState({ loading: true, error: null });
        fetch(`${API.GetURL()}/UserWebsite?page=${page}&psize=${this.state.pageSize}`, {
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
                            websites: data.items || [],
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
                this.setState({ error: 'Failed to load user websites.', loading: false });
            });
    }

    handlePageChange = (newPage) => {
        this.fetchWebsites(newPage);
    }

    render() {
        const { websites, loading, error, page, pageSize, totalRecords, loggedin, pageCount } = this.state;
        if (!loggedin) {
            return (<Redirect to="/loginform" />);
        }
        return (
            <div>
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                    <h1 className="h2">User Websites</h1>
                </div>
                <div className="fixedBottom ">
                    <MessageStrip message={error} bsstyle={"danger"} />
                </div>
                {loading && <Spinner />}
                {!loading && !error && (
                    <div>
                        <Table responsive striped bordered condensed hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Domain</th>
                                    <th>Created</th>
                                    <th>Modified</th>
                                    <th>Status</th>
                                    <th>Type</th>
                                    <th>Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {websites.map(site => (
                                    <tr key={site.id}>
                                        <td>{site.name}</td>
                                        <td>{site.domain}</td>
                                        <td>{site.created ? dayjs(site.created).format('YYYY-MM-DD HH:mm') : ''}</td>
                                        <td>{site.modified ? dayjs(site.modified).format('YYYY-MM-DD HH:mm') : ''}</td>
                                        <td>{site.status}</td>
                                        <td>{site.wstype}</td>
                                        <td>{site.ownerName}</td>
                                    </tr>
                                ))}
                                {websites.length === 0 ? <tr><td colSpan={7}>No websites found.</td></tr> : null}
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

export default UserWebsiteList;