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
                    
                    for (var k in data) {
                        if (data[k].Status === 0) {
                            data[k].StatusName = "Active";
                        } else if (data[k].Status === 1) {
                            data[k].StatusName = "InActive";
                        } else if (data[k].Status === 2) {
                            data[k].StatusName = "Deleted";
                        }
                    }
                    this.setState({ datasource: data, loading: false });
                });
        }
    }

    columns = [
        { title: 'ID', prop: 'ID' },
        { title: 'Email', prop: 'Email' },
        { title: 'Name', prop: 'FirstName' },
        { title: 'Date Created', prop: 'CreateDate', format: 'd/MMM/yy'},
        { title: 'Date Modified', prop: 'ModifyDate' },
        { title: 'Status', prop: 'StatusName' }
    ];

    renderTable(ds, columns) {
        return (
            <DataTable
                keys="ID"
                columns={columns}
                initialData={ds}
                initialPageLength={50}
                initialSortBy={{ prop: 'ID', order: 'ascending' }}
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
                    <h1>Members</h1>
                    {contents}
                </div>
            );
        }
    }
}