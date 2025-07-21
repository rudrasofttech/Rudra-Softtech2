import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import gears from '../gears.png';

export class DataSourceManage extends Component {
    //displayName = DataSourceManage.name;

    constructor(props) {
        super(props);
        this.saveData = this.saveData.bind(this);
        this.state = {
            name: '', query: '', htmlTemplate: '', token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true, bsstyle: '', message: '',
            id: this.props.match.params.id !== undefined && this.props.match.params.id !== null ? parseInt(this.props.match.params.id, 10) : 0
        };

    }

    componentDidMount() {
        if (this.state.id !== 0) {
            this.fetchData(this.state.id);
        }
    }

    fetchData(id) {
        this.setState({ loading: true, message: "", bsstyle: '' });
        fetch(`${API.GetURL()}/CustomDataSources/${id}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json()
                        .then(data => {
                            this.setState({ name: data.name, query: data.query, htmlTemplate: data.htmlTemplate, loading: false, bsstyle: '', message: '' });
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

    saveData(e) {
        let saveurl = `${API.GetURL()}/CustomDataSources`;
        if (this.state.id !== 0) {
            saveurl = `${API.GetURL()}/CustomDataSources/update/${this.state.id}`;
        }

        this.setState({ loading: true, message: "", bsstyle: '' });
        fetch(saveurl, {
            method: "POST",
            body: JSON.stringify({ name: this.state.name, query: this.state.query, htmlTemplate: this.state.htmlTemplate }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {

                    response.json().then(data => {
                        this.setState({ id: data.id, message: "Data Source Saved", bsstyle: 'success' }, () => {
                            this.fetchData(this.state.id);
                        });
                    });
                } else {
                    response.json().then(data => {
                        this.setState({ bsstyle: 'danger', message: data.error });
                    }).catch(err => {
                        console.log(err);
                        this.setState({ bsstyle: 'danger', message: "Unable to process request." });
                    });
                }
            }).catch(err => {
                console.log(err);
                this.setState({ bsstyle: 'danger', message: "Unable to contact server." });
            }).finally(() => {
                this.setState({ loading: false });
            });
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else if (this.state.reload) {
            return <Redirect to={'/customdatasourcelist'} />;
        }
        else {
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={gears} className="img-fluid icon-large me-2" /> Data Source</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">

                        </div>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    <form className="mb-5" onSubmit={(e) => { e.preventDefault(); this.saveData(); }}>
                        <div className="mb-3">
                            <label htmlFor="nametxt" className="form-label">Name (Required)</label>
                            <input name="Name" className="form-control" id="nametxt"
                                disabled={this.state.loading}
                                type="text" required maxLength="100"
                                value={this.state.name} onChange={(e) => { this.setState({ name: e.target.value }); }} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="querytxt" className="form-label">Query</label>
                            <textarea id="querytxt" className="form-control"
                                disabled={this.state.loading}
                                name="Query" rows="10" value={this.state.query}
                                onChange={(e) => { this.setState({ query: e.target.value }); }}>
                            </textarea>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="htmlTemplateTxt" className="form-label">HTML / XSL Template (Required)</label>
                            <textarea name="HtmlTemplate" className="form-control"
                                disabled={this.state.loading}
                                rows="10" value={this.state.htmlTemplate}
                                onChange={(e) => { this.setState({ htmlTemplate: e.target.value }); }}>
                            </textarea>
                        </div>
                        <button type="submit" disabled={this.state.loading} className="btn btn-primary">Save</button>
                    </form>
                    {this.state.loading ? <Spinner /> : null}

                </div>
            );
        }
    }
}