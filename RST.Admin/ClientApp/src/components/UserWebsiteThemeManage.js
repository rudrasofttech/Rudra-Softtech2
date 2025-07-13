import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { MessageStrip } from './MessageStrip';
import { API } from './api';
import Spinner from './shared/Spinner';
import template from '../template.png';

export class UserWebsiteThemeManage extends Component {
    displayName = UserWebsiteThemeManage.name;

    constructor(props) {
        super(props);

        this.saveData = this.saveData.bind(this);

        this.state = {
            name: '',
            tags: '', html: '', wstype: 0, thumbnail: '',
            token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true,
            error : '', success : '',
            id: this.props.match.params.id !== undefined && this.props.match.params.id !== null ? this.props.match.params.id : ''
        };
    }

    componentDidMount() {
        if (this.state.id !== '') {
            this.fetchData(this.state.id);
        }
    }

    fetchData(id) {
        this.setState({ loading: true, error: '', success: '' });
        fetch(`${API.GetURL()}/UserWebsiteTheme/${id}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    response.json().then(data => {
                        console.log(data);
                        this.setState({
                            name: data.name, tags: data.tags, html: data.html, wstype: data.wsType, thumbnail: data.thumbnail, loading: false
                        });
                    });
                } else if (response.status === 401) {
                    this.setState({ loggedin: false, loading: false });
                }
                else {
                    response.json().then(data => {
                        this.setState({ error: data.error });
                    }).catch(err => {
                        console.log(err);
                        this.setState({ error: "Unable to process request." });
                    });
                }
            }).catch(err => {
                console.log(err);
                this.setState({ error: "Unable to contact server." });
            }).finally(() => {
                this.setState({ loading: false });
            });
    }

    saveData() {
        let saveurl = `${API.GetURL()}/UserWebsiteTheme/create`;
        if (this.state.id !== '') {
            saveurl = `${API.GetURL()}/UserWebsiteTheme/update/${this.state.id}`;
        }
        this.setState({ loading: true, success: '', error: '' });
        fetch(saveurl, {
            method: 'post',
            body: JSON.stringify({
                name: this.state.name, html: this.state.html, tags: this.state.tags, thumbnail: this.state.thumbnail,
                wsType: this.state.wstype
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    this.setState({ loading: false, success: "Theme saved." });
                } else if (response.status === 401) {
                    this.setState({ loggedin: false, loading: false });
                } else {
                    response.json().then(data => {
                        this.setState({ error: data.error });
                    }).catch(err => {
                        this.setState({ error: "Unable to process request." });
                    });
                }
            }).catch(err => {
                this.setState({ error: "Unable to contact server." });
            }).finally(() => {
                this.setState({ loading: false });
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
                        <h1 className="h2"><img src={template} className="img-fluid icon-large me-2" /> User Website Theme</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                        </div>
                    </div>
                    {this.state.loading ? <Spinner /> : null}
                    <div className="fixedBottom ">
                        {this.state.error !== "" ? <MessageStrip message={this.state.error} bsstyle={"danger"} /> : null}
                        {this.state.success !== "" ? <MessageStrip message={this.state.success} bsstyle={"success"} /> : null}
                    </div>

                    <form className="mb-4" onSubmit={(e) => { e.preventDefault(); this.saveData(); }}>
                        <div className="mb-3">
                            <label htmlFor="nameTxt" class="form-label">Name (Required)</label>
                            <input type="text" disabled={this.state.loading} className="form-control" name="Name" id="nameTxt" value={this.state.name}
                                onChange={(e) => { this.setState({ name: e.target.value }); }} required maxLength="100" />
                        </div>
                        <div className="mb-3" >
                            <label htmlFor="tagsTxt" class="form-label">Tags</label>
                            <input id="tagsTxt" className="form-control" disabled={this.state.loading} name="Tags" type="text" maxLength="500" value={this.state.tags} onChange={(e) => { this.setState({ tags: e.target.value }); }} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="wsTypeSelect" class="form-label">Website Type (Required)</label>
                            <select id="wsTypeSelect" disabled={this.state.loading} className="form-select" required name="Status"
                                value={this.state.wstype} onChange={(e) => { this.setState({ wstype: parseInt(e.target.value, 10) }); }}>
                                <option value="0"></option>
                                <option value="1">VCard</option>
                                <option value="2">Personal</option>
                                <option value="3">Blog</option>
                                <option value="4">Portfolio</option>
                                <option value="5">ECommerce</option>
                                <option value="6">Educational</option>
                                <option value="7">NonProfit</option>
                                <option value="8">Resume</option>
                            </select>
                        </div>
                        <div className="mb-3" >
                            <label htmlFor="thumbnailTxt" class="form-label">Thumbnail</label>
                            <input id="thumbnailTxt" className="form-control" disabled={this.state.loading} name="Thumbnail" type="url" maxLength="250" value={this.state.thumbnail} onChange={(e) => { this.setState({ thumbnail: e.target.value }); }} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="htmlTxt" className="form-label">HTML (Required)</label>
                            <textarea className="form-control" disabled={this.state.loading} id="htmlTxt" required name="htmlTxt" rows="5"
                                value={this.state.html} onChange={(e) => { this.setState({ html: e.target.value }); }}>
                            </textarea>
                        </div>
                        <button type="submit" disabled={this.state.loading} className="btn btn-primary" >Save</button>
                    </form>
                </div>
            );
        }
    }
}