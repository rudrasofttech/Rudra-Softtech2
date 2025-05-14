import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { DrivePop } from './DrivePop';
import { API } from './api';
import Spinner from './shared/Spinner';
import pages from '../browser.png';

export class CustomPageManage extends Component {
    displayName = CustomPageManage.name;

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.saveData = this.saveData.bind(this);
        this.handleDriveModal = this.handleDriveModal.bind(this);
        this.state = {
            redirect: '',
            status: 0, noTemplate: false,
            sitemap: true, name: '', title: '', pageMeta: '', head: '',
            body: '', id: this.props.match.params.id !== undefined && this.props.match.params.id !== null ? this.props.match.params.id : 0,
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
        fetch(`${API.GetURL()}/custompages/${id}`, {
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
                            status: data.status, noTemplate: data.noTemplate,
                            sitemap: data.sitemap, name: data.name, title: data.title, pageMeta: data.pageMeta, head: data.head,
                            body: data.body, id: data.id
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

    handleDriveModal() {
        this.setState({ showdrivemodal: !this.state.showdrivemodal });
    }

    saveData(e) {
        let saveurl = `${API.GetURL()}/custompages/add`;

        if (this.props.match.params.id !== undefined && this.props.match.params.id !== null) {
            saveurl = `${API.GetURL()}/custompages/update`;
        }
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(saveurl, {
            method: 'post',
            body: JSON.stringify({
                id: this.state.id,
                name: this.state.name, status: this.state.status, sitemap: this.state.sitemap,
                body: this.state.body, head: this.state.head, noTemplate: this.state.noTemplate,
                pageMeta: this.state.pageMeta, title: this.state.title
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {

                    response.json().then(data => {
                        this.setState({ message: "Page saved.", bsstyle: 'success' });
                        setTimeout(() => { this.fetchData(data.id) }, 2000);
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


    handleBlur(e) {
        const fd = new FormData();
        switch (e.target.name) {
            case 'Name':
                fd.append("url", this.state.name);
                fetch(`${API.GetURL()}/custompages/slugify`, {
                    method: 'post',
                    body: fd,
                    headers: {
                        'Authorization': `Bearer ${this.state.token}`
                    }
                })
                    .then(response => {
                        if (response.status === 200) {
                            response.text().then(data => {
                                this.setState({ name: data });
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                        this.setState({ bsstyle: 'danger', message: "Unable to contact server." });
                    });
                break;

        }
    }

    handleChange(e) {

        switch (e.target.name) {
            case 'Status':
                this.setState({ status: parseInt(e.target.value, 10) });
                break;

            case 'Name':
                this.setState({ name: e.target.value });
                break;
            case 'Title':
                this.setState({ title: e.target.value });
                break;
            case 'Sitemap':
                this.setState({ sitemap: e.target.checked });
                break;
            case 'Body':
                this.setState({ body: e.target.value });
                break;
            case 'Head':
                this.setState({ head: e.target.value });
                break;
            case 'NoTemplate':
                this.setState({ noTemplate: e.target.checked });
                break;
            case 'PageMeta':
                this.setState({ pageMeta: e.target.value });
                break;
        }
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else if (this.state.redirect !== "")
            return <Redirect to={this.state.redirect} />;
        else {

            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={pages} className="img-fluid icon-large me-2" /> Web page</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">

                        </div>
                    </div>
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>
                    {this.state.loading ? <Spinner /> : null}
                    <form className="mb-5" onSubmit={(e) => {
                        e.preventDefault(); this.saveData();
                    }}>
                        <div className="row">
                            <div className="col">
                                <div className="mb-3">
                                    <label className="form-label">Status (Required)</label>
                                    <select className="form-select" name="Status" required value={this.state.status} onChange={this.handleChange}>
                                        <option value={1}>Draft</option>
                                        <option value={2}>Publish</option>
                                        <option value={3}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col">
                                <div className="form-check">
                                    {this.state.noTemplate ? <input className="form-check-input" name="NoTemplate" type="checkbox" checked id="noTemplateCheckDefault" onChange={this.handleChange} /> :
                                        <input className="form-check-input" type="checkbox" name="NoTemplate" id="noTemplateCheckDefault" onChange={this.handleChange} />}
                                    <label className="form-check-label" htmlFor="noTemplateCheckDefault">
                                        No Template
                                    </label>
                                </div>
                            </div>
                            <div className="col">
                                <div className="form-check">
                                    {this.state.sitemap ? <input className="form-check-input" name="Sitemap" type="checkbox" checked id="SitemapCheckDefault" onChange={this.handleChange} /> :
                                        <input className="form-check-input" type="checkbox" name="Sitemap" id="SitemapCheckDefault" onChange={this.handleChange} />}
                                    <label className="form-check-label" htmlFor="SitemapCheckDefault">
                                        Sitemap
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Page Name (Required)</label>
                            <input type='text' maxLength="200" required className="form-control" name='Name' value={this.state.name} onChange={this.handleChange} onBlur={this.handleBlur} required />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Page Title (Required)</label>
                            <input type='text' maxLength="150" className="form-control" name='Title' value={this.state.title} onChange={this.handleChange} required />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Page Meta(optional)</label>
                            <textarea name="PageMeta" className="form-control" rows="6" value={this.state.pageMeta}
                                onChange={this.handleChange}></textarea>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Page Head(optional)</label>
                            <textarea name="Head" className="form-control" rows="6" value={this.state.head}
                                onChange={this.handleChange}></textarea>
                        </div>


                        <div className="mb-3">
                            <label className="form-label">Body (Required)</label>
                            <button type="button" className="btn btn-link" onClick={this.handleDriveModal}>Open Drive</button>
                            <textarea name="Body" className="form-control" required rows="20" value={this.state.body} onChange={this.handleChange}></textarea>
                        </div>
                        <button disabled={this.state.loading} type="submit" className="btn btn-secondary">Save</button>


                        <Modal show={this.state.showdrivemodal} onHide={this.handleDriveModal}>
                            <Modal.Header closeButton>
                                <Modal.Title>Drive</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <DrivePop />
                            </Modal.Body>
                        </Modal>
                    </form>
                </div>
            );
        }
    }
}