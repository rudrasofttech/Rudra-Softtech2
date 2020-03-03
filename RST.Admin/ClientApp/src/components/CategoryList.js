import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

export class CategoryList extends Component {
    displayName = CategoryList.name;
    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { datasources: [], loading: true, loggedin: loggedin };
        if (loggedin) {
            fetch('http://localhost:59709/api/Categories', {
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
                        <th>Url Name</th>
                        <th>Status</th>
                        
                    </tr>
                </thead>
                <tbody>
                    {ds.map(cp =>
                        <tr key={cp.ID}>
                            <td>{cp.ID}</td>
                            <td>{cp.Name}</td>
                            <td>{cp.UrlName}</td>
                            <td>{cp.Status}</td>
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