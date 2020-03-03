import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

export class CustomDataSourceList extends Component {
    displayName = CustomDataSourceList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { datasources: [], loading: true, loggedin: loggedin };
        if (loggedin) {
            fetch('http://localhost:59709/api/CustomDataSources', {
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
                    this.setState({ datasources: data, loading: false });
                });
        }
    }
   

    renderDataSourcesTable(ds) {
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
                    </tr>
                </thead>
                <tbody>
                    {ds.map(cp =>
                        <tr key={cp.ID}>
                            <td>{cp.ID}</td>
                            <td>{cp.Name}</td>
                            <td>{cp.DateCreated}</td>
                            <td>{cp.CreatedByName}</td>
                            <td>{cp.DateModified}</td>
                            <td>{cp.ModifiedByName}</td>
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
                : this.renderDataSourcesTable(this.state.datasources);
            return (
                <div>
                    <h1>Data Sources</h1>
                    {contents}
                </div>
            );
        }
    }
}
