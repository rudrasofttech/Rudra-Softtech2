import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { DataTable } from 'react-data-components';

export class MemberList extends Component {
    displayName = MemberList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { datasource: [], loading: true, loggedin: loggedin };
        if (loggedin) {
            fetch('http://localhost:59709/api/members', {
                method: 'get',
                headers: {
                    'Authorization': 'Bearer ' + token
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
                    console.log(data);
                    this.setState({ datasource: data, loading: false });
                });
        }
    }

    columns = [
        { title: 'ID', prop: 'ID' },
        { title: 'Email', prop: 'Email' },
        { title: 'Name', prop: 'MemberName' },
        { title: 'Date Created', prop: 'CreateDate' },
        { title: 'Date Modified', prop: 'ModifyDate' },
        { title: 'Status', prop: 'Status' },
        { title: 'Newsletter', prop: 'Newsletter' }
    ];

    renderTable(ds, columns) {
        return (
            <DataTable
                keys="ID"
                columns={columns}
                initialData={ds}
                initialPageLength={5}
                initialSortBy={{ prop: 'ID', order: 'descending' }}
            />
        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.datasource, this.columns);
            return (
                <div>
                    <h1>Articles</h1>
                    {contents}
                </div>
            );
        }
    }
}