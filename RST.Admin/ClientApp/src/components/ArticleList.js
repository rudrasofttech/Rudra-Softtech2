import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { DataTable } from 'react-data-components';

export class ArticleList extends Component {
    displayName = ArticleList.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = { articles: [], loading: true, loggedin: loggedin };
        if (loggedin) {
            fetch('http://localhost:59709/api/posts', {
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
                    this.setState({ articles: data, loading: false });
                });
        }
    }
    columns = [
        { title: 'ID', prop: 'ID' },
        { title: 'Title', prop: 'Title' },
        { title: 'Date Created', prop: 'DateCreated' },
        { title: 'Created By', prop: 'CreatedByName' },
        { title: 'Date Modified', prop: 'DateModified' },
        { title: 'Modified By', prop: 'ModifiedByName' },
        { title: 'Status', prop: 'Status' },
        { title: 'Sitemap', prop: 'Sitemap' }
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
                : this.renderTable(this.state.articles, this.columns);
            return (
                <div>
                    <h1>Articles</h1>
                    {contents}
                </div>
            );
        }
    }
}
