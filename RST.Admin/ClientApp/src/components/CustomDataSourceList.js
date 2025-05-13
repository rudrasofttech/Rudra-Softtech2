import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import dayjs from 'dayjs';
import gears from '../gears.png';
import deleteicon from '../delete.png';
import editicon from '../edit.png';

export class CustomDataSourceList extends Component {
    //displayName = CustomDataSourceList.name

    constructor(props) {
        super(props);
        this.state = {
            datasources: [], token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true, bsstyle: '', message: '' };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData() {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(API.GetURL() + '/CustomDataSources', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({ datasources: data });
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

    handleDeleteDS(e) {
        if (window.confirm("Are you sure you want to delete this data source?")) {
            fetch(API.GetURL() + '/CustomDataSources/' + e.target.name,
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
                            let list = this.state.datasources;
                            for (var k in list) {
                                if (list[k].ID === data.ID) {
                                    list.splice(k, 1);
                                    this.setState({ datasources: list });
                                    break;
                                }
                            }
                        });
                    }
                    else if (response.status === 401) {
                        this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ bsstyle: '', message: '', loading: false });
                        });
                    }
                });
        }
    }

    renderDataSourcesTable(ds) {
        return (
            <div>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <Table responsive striped bordered condensed hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date Created</th>
                            <th>Created By</th>
                            <th>Date Modified</th>
                            <th>Modified By</th>
                            <th colSpan={2}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ds.map(cp =>
                            <tr key={cp.id}>
                                <td>{cp.name}</td>
                                <td>
                                    {dayjs(cp.dateCreated).format("DD.MMM.YYYY")}
                                </td>
                                <td>{cp.createdByName}</td>
                                <td>
                                    {cp.dateModified !== null ? dayjs(cp.dateModified).format("DD.MMM.YYYY") : null}
                                </td>
                                <td>{cp.modifiedByName}</td>
                                <td>
                                    <Link className='btn btn-link' to={'/datasourcemanage/' + cp.id}>
                                        <img src={editicon} className="img-fluid icon-extra-small" />
                                    </Link>
                                </td>
                                <td>
                                    <button type='button' name={cp.id} className='btn btn-link' onClick={this.handleDeleteDS}>
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

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <Spinner />
                : this.renderDataSourcesTable(this.state.datasources);
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={gears} className="img-fluid icon-large me-2" /> Data Sources</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                            <Link to={'/datasourcemanage/0'} className="btn btn-primary">Create New</Link>
                        </div>
                    </div>
                    {contents}
                </div>
            );
        }
    }
}
