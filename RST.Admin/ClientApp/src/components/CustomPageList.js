import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
//import DataTable from 'react-data-components';

export class CustomPageList extends Component {
    displayName = CustomPageList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;
        
        if (token === null) {
            loggedin = false;
        } 
        this.state = { custompages: [], loading: true, loggedin: loggedin };
        if (loggedin) {
            fetch('http://localhost:59709/api/custompages', {
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
                    this.setState({ custompages: data, loading: false });
                });
        }
    }
    columns = [
        { title: 'ID', prop: 'ID' },
        { title: 'Name', prop: 'Name' },
        { title: 'Date Created', prop: 'DateCreated' },
        { title: 'Created By', prop: 'CreatedByName' },
        { title: 'Date Modified', prop: 'DateModified' },
        { title: 'Modified By', prop: 'ModifiedByName' },
        { title: 'Status', prop: 'Status' },
        { title: 'Sitemap', prop: 'Sitemap' }
    ];
    renderCustomPagesTable(custompages, columns) {
        return (
            <table className='table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date Created</th>
                        <th>Created By</th>
                        <th>Date Modified</th>
                        <th>Modified By</th>
                        <th>Status</th>
                        <th>Sitemap</th>
                    </tr>
                </thead>
                <tbody>
                    {custompages.map(cp =>
                        <tr key={cp.ID}>
                            <td>{cp.ID}</td>
                            <td>{cp.Name}</td>
                            <td>{cp.DateCreated}</td>
                            <td>{cp.CreatedByName}</td>
                            <td>{cp.DateModified}</td>
                            <td>{cp.ModifiedByName}</td>
                            <td>{cp.Status}</td>
                            <td>
                                <input type="checkbox" defaultChecked={cp.Sitemap} disabled />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }

    render() {
        
        if (!this.state.loggedin) {
            return (<Redirect to="/loginform" />);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderCustomPagesTable(this.state.custompages, this.columns);
            return (
                <div>
                    <h1>Custom Pages</h1>
                    <p>This component demonstrates fetching data from the server.</p>
                    {contents}
                </div>
            );
        }
    }
}
