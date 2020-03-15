import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
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
                    for (var k in data) {
                        if (data[k].Status === 0) {
                            data[k].StatusName = "Active";
                        } else if (data[k].Status === 1) {
                            data[k].StatusName = "InActive";
                        } else if (data[k].Status === 2) {
                            data[k].StatusName = "Deleted";
                        }
                    }
                    this.setState({ datasources: data, loading: false });
                });
        }
    }

    renderTable(ds) {
        return (
            <Table responsive striped bordered condensed hover>
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
                            <td>{cp.StatusName}</td>
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
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.datasources);
            return (
                <div>
                    <h1>Categories</h1>
                    {contents}
                </div>
            );
        }
    }
}