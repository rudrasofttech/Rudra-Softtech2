import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import categories from '../product-categories.png';

export class CategoryManage extends Component {
    displayName = CategoryManage.name;

    constructor(props) {
        super(props);

        this.saveData = this.saveData.bind(this);
        this.slugify = this.slugify.bind(this);
        this.state = {
            name: '', urlName: '', status: -1,
            id: this.props.match.params.id !== undefined && this.props.match.params.id !== null ? this.props.match.params.id : 0,
            token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true, bsstyle: '', message: ''
        };
    }
    componentDidMount() {
        if (this.state.id !== 0) {
            this.fetchData(this.state.id);
        }
    }

    fetchData(id) {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(`${API.GetURL()}/Categories/${id}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        this.setState({
                            status: data.status, urlName: data.urlName,
                            name: data.name, id: data.id
                        });
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

    saveData() {
        let saveurl = `${API.GetURL()}/Categories`;
        if (this.state.id !== 0) {
            saveurl = `${API.GetURL()}/Categories/update/${this.state.id}`;

        }
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(saveurl, {
            method: "POST",
            body: JSON.stringify({ name: this.state.name, urlName: this.state.urlName, status: this.state.status }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ loading: false, bsstyle: 'danger', message: "Authorization has been denied for this request." });
                } else if (response.status === 200) {

                    response.json().then(data => {
                        this.setState({ message: "Category Saved", bsstyle: 'success' }, () => {
                            this.fetchData(data.id)
                        });
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

    slugify() {
        const fd = new FormData();
        fd.append("url", this.state.urlName);
        fetch(`${API.GetURL()}/CustomPages/slugify`, {
            method: 'post',
            body: fd,
            headers: {
                'Authorization': `Bearer ${this.state.token}`
            }
        }).then(response => {
            if (response.status === 200) {
                response.text().then(data => {
                    this.setState({ urlName: data });
                })
            }
        });
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else {
           
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={categories} className="img-fluid icon-large me-2" /> Category</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">

                        </div>
                    </div>
                    <h1></h1>
                    <div>
                        <div className="fixedBottom">
                            <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                        </div>
                        <form className="mb-5" onSubmit={(e) => { e.preventDefault(); this.saveData(); }}>
                            <div className="mb-3" >
                                <label className="form-label" htmlFor="nametxt">Name (Required)</label>
                                <input className="form-control" disabled={this.state.loading} type="text" id="nametxt" name="Name" required maxLength="50" value={this.state.name}
                                    onChange={(e) => {
                                        this.setState({ name: e.target.value });
                                    }} onBlur={() => {
                                        if (this.state.urlName === "") {
                                            this.setState({ urlName: this.state.name }, () => {
                                                this.slugify();
                                            });
                                        }
                                    } } />
                            </div>
                            <div className="mb-3" >
                                <label className="form-label" htmlFor="urltxt">Url Name (Required)</label>
                                <input className="form-control" disabled={this.state.loading} id="urltxt" name="UrlName" maxLength="50" type="text" value={this.state.urlName}
                                    onChange={(e) => { this.setState({ urlName: e.target.value }); }} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="statusSelect">Status (Required)</label>
                                <select className="form-select" required disabled={this.state.loading} id="statusSelect" name="Status" value={this.state.status}
                                    onChange={(e) => { this.setState({ status: parseInt(e.target.value, 10) }); }}>
                                    <option value=""></option>
                                    <option value="0">Active</option>
                                    <option value="1">Inactive</option>
                                    <option value="2">Deleted</option>
                                </select>
                            </div>
                            {this.state.loading ? <Spinner /> : null }
                            <button disabled={this.state.loading} type="submit" className="btn btn-secondary" >Save</button>
                        </form>
                    </div>
                </div>
            );
        }
    }
}