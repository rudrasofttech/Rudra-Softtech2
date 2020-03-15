import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { Table } from 'react-bootstrap';
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
            this.fetchData(token);
        }
    }
   
    fetchData(t) {
        fetch('http://localhost:59709/api/CustomDataSources', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
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

    handleDeleteDS(e) {
        if (window.confirm("Are you sure you want to delete this data source?")) {
            fetch('http://localhost:59709/api/CustomDataSources/' + e.target.name,
                {
                    method: 'delete',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem("token"),
                        'Content-Type': 'application/x-www-form-urlencoded'
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

                        localStorage.removeItem("token");
                        this.setState({ error: true, message: "Authorization has been denied for this request." });

                    }
                    else {
                        response.json().then(data => {
                            console.log(data);
                            this.setState({ error: false, loggedin: false });
                        });
                    }
                });
        }
    }

    renderDataSourcesTable(ds) {
        return (
            <Table responsive striped bordered condensed hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date Created</th>
                        <th>Created By</th>
                        <th>Date Modified</th>
                        <th>Modified By</th>
                        <th><Link to={'/datasourcemanage/0'} className="btn btn-link">Create New</Link></th>
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
                            <td><Link className='btn btn-link' to={'/datasourcemanage/' + cp.ID}>Edit</Link>
                                <button type='button' name={cp.ID} className='btn btn-link' onClick={this.handleDeleteDS}>Delete</button></td>
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
