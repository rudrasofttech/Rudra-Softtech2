import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, FieldGroup, Button, ControlLabel, ProgressBar, Modal, Checkbox } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { DrivePop } from './DrivePop';
import { API } from './api';
import articles from '../article.png';
import Spinner from './shared/Spinner';

export class ArticleManage extends Component {
    displayName = ArticleManage.name;

    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleDriveModal = this.handleDriveModal.bind(this);
        this.slugify = this.slugify.bind(this);

        this.state = {
            title: '', status: 0, category: { id: 0, name: '' },
            tag: '', description: '', article: '',
            writerName: '', writerEmail: '',
            ogImage: '',
            ogDescription: '', metaTitle: '', url: '',
            templateName: '', sitemap: '', categories: [], blogtemplates: [], token: localStorage.getItem("token"),
            loading: false, loggedin: localStorage.getItem("token") === null ? false : true,
            bsstyle: '', message: '', showdrivemodal: false,
            id: this.props.match.params.id !== undefined && this.props.match.params.id !== null ? this.props.match.params.id : 0
        };
    }

    componentDidMount() {
        this.fetchCategory();
        this.fetchBlogTemplates();
        if (this.state.id !== 0) {
            this.fetchData(this.state.id);
        }
    }

    fetchCategory() {
        this.setState({ loading: true, bsstyle: '', message: '' });

        fetch(`${API.GetURL()}/Categories`, {
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
                        this.setState({ categories: data });
                    })
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

    fetchBlogTemplates() {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(`${API.GetURL()}/CustomDataSources`, {
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
                        let cds = [];
                        for (var d in data) {
                            if (data[d].name.toLowerCase().endsWith("blogtemplate")) {
                                cds.push(data[d]);
                            }
                        }
                        this.setState({ blogtemplates: cds });
                    })
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

    slugify() {
        const fd = new FormData();
        fd.append("url", this.state.url);
        fetch(`${API.GetURL()}/posts/slugify`, {
            method: 'get',
            body: fd,
            headers: {
                'Authorization': `Bearer ${this.state.token}`
            }
        }).then(response => {
            if (response.status === 200) {
                response.text().then(data => {
                    this.setState({ url: data });
                })
            }
        });
    }

    handleDriveModal() {
        this.setState({ showdrivemodal: !this.state.showdrivemodal });
    }

    fetchData(id) {
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(`${API.GetURL()}/posts/${id}`, {
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
                            title: data.title, status: data.status, category: data.category,
                            tag: data.tag, description: data.description, article: data.article,
                            writerName: data.writerName, writerEmail: data.writerEmail,
                            ogImage: data.ogImage,
                            ogDescription: data.ogDescription, metaTitle: data.metaTitle, url: data.url,
                            templateName: data.templateName, sitemap: data.sitemap
                        });
                    });
                }
                else {
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

    saveData() {
        let saveurl = `${API.GetURL()}/posts/add`;
        if (this.state.id !== 0) {
            saveurl = `${API.GetURL()}/posts/update`;
        }
        this.setState({ loading: true, bsstyle: '', message: '' });
        fetch(saveurl, {
            method: 'post',
            body: JSON.stringify({
                title: this.state.title, status: this.state.status, category: this.state.category,
                tag: this.state.tag, description: this.state.description, article: this.state.article,
                writerName: this.state.writerName, writerEmail: this.state.writerEmail,
                ogImage: this.state.ogImage,
                ogDescription: this.state.ogDescription, metaTitle: this.state.metaTitle, url: this.state.url,
                templateName: this.state.templateName, sitemap: this.state.sitemap
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.token}`
            }
        })
            .then(response => {
                if (response.status === 200) {
                    this.setState({ loading: false, message: "Article saved.", bsstyle: 'success' });
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
        switch (e.target.name) {
            case 'URL':
                this.slugify();
                break;
        }
    }

    handleChange(e) {

        switch (e.target.name) {
            case 'Status':
                this.setState({ status: parseInt(e.target.value, 10) });
                break;
            case 'Tag':
                this.setState({ tag: e.target.value });
                break;
            case 'Title':
                this.setState({ title: e.target.value });
                break;
            case 'Sitemap':
                this.setState({ sitemap: e.target.checked });
                break;
            case 'Description':
                this.setState({ description: e.target.value });
                break;
            case 'Article':
                this.setState({ article: e.target.value });
                break;
            case 'Category':
                this.setState({ category: { id: parseInt(e.target.value, 10), name: '', urlName: '' } });
                break;
            case 'WriterName':
                this.setState({ writerName: e.target.value });
                break;
            case 'WriterEmail':
                this.setState({ writerEmail: e.target.value });
                break;
            case 'MetaTitle':
                this.setState({ metaTitle: e.target.value }); 
                break;
            case 'OGImage':
                this.setState({ ogImage: e.target.value });
                break;
            case 'OGDescription':
                this.setState({ ogDescription: e.target.value });
                break;
            case 'URL':
                this.setState({ url: e.target.value });
                break;
            case 'TemplateName':
                this.setState({ templateName: e.target.value });
                break;
        }
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else {
            return (
                <div>
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom sticky-top bg-white">
                        <h1 className="h2"><img src={articles} className="img-fluid icon-large me-2" /> Article</h1>
                        <div className="btn-toolbar mb-2 mb-md-0">
                        </div>
                    </div>
                    {this.state.loading ? <Spinner /> : null}
                    <div className="fixedBottom ">
                        <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                    </div>

                    
                    <div className="mb-3">
                        <label htmlFor="titleTxt" class="form-label">Title (Required)</label>
                        <input type="text" className="form-control" name="Title" id="titleTxt" value={this.state.title} onChange={this.handleChange} required maxLength="250" />
                    </div>
                    <div className="mb-3" >
                        <label htmlFor="MetaTitleTxt" class="form-label">Meta Title</label>
                        <input id="MetaTitleTxt" className="form-control" name="MetaTitle" type="text" maxLength="100" value={this.state.metaTitle} onChange={this.handleChange} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="URLTxt">URL (Required)</label>
                        <input className="form-control" id="URLTxt" name="URL" type="text" maxLength="200" value={this.state.url} onBlur={this.handleBlur}
                            onChange={this.handleChange} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="TagTxt">Tag (Required)</label>
                        <input id="TagTxt" className="form-control" name="Tag" type="text" maxLength="200" value={this.state.tag} onChange={this.handleChange} />
                    </div>
                   
                    <div className="row mb-3">
                        <div className="col">
                            <div className="mb-3">
                                <label htmlFor="StatusSelect" class="form-label">Status (Required)</label>
                                <select id="StatusSelect" className="form-select" required name="Status" value={this.state.status} onChange={this.handleChange}>
                                    <option value=""></option>
                                    <option value="1">Draft</option>
                                    <option value="2">Publish</option>
                                    <option value="3">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="col">
                            <div className="form-check ">
                                {this.state.sitemap ? <input className="form-check-input" name="Sitemap" type="checkbox" checked id="SitemapCheckDefault" onChange={this.handleChange} /> :
                                    <input className="form-check-input" type="checkbox" name="Sitemap" id="SitemapCheckDefault" onChange={this.handleChange} />}
                                <label className="form-check-label" htmlFor="SitemapCheckDefault">
                                    Sitemap
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col">
                            <label className="form-label">Writer Name (Required)</label>
                            <input className="form-control" name="WriterName" type="text" maxLength="100" value={this.state.writerName} onChange={this.handleChange} maxLength="50" />
                        </div>
                        <div className="col">
                            <label htmlFor="WriterEmail" className="form-label">Writer Email</label>
                            <input className="form-control" name="WriterEmail" id="WriterEmail" type="email" value={this.state.writerEmail} onChange={this.handleChange} maxLength="50" />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col">
                            <label htmlFor="Category" className="form-label">Category (Required)</label>
                            <select id="Category" className="form-select" name="Category" value={this.state.category.id} onChange={this.handleChange}>
                                <option value="">select</option>
                                {this.state.categories.map(cp =>
                                    <option key={cp.id} value={cp.id}>{cp.name}</option>
                                )}
                            </select>
                        </div>
                        <div className="col">
                            <label htmlFor="Template" className="form-label">Template (Required)</label>
                            <select className="form-select" id="Template" name="TemplateName" value={this.state.category.templateName} onChange={this.handleChange}>
                                <option value="">select</option>
                                {this.state.blogtemplates.map(cp =>
                                    <option key={cp.name} value={cp.name}>{cp.name}</option>
                                )}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="OGImage" className="form-label">Facebook Image (Required)</label>
                        <input className="form-control" id="OGImage" name="OGImage" type="text" value={this.state.ogImage} onChange={this.handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="OGDescription" className="form-label">Facebook Description (Required)</label>
                        <input className="form-control" id="OGDescription" name="OGDescription" type="text" maxLength="500" value={this.state.ogDescription} onChange={this.handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="Description" className="form-label">Description (Required)</label>
                        <textarea className="form-control" id="Description" name="Description" rows="5" maxLength="1000"
                            value={this.state.description} onChange={this.handleChange}>
                        </textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="Body" className="form-label">Body (Required)</label>
                        <textarea className="form-control" id="Body" name="Article" rows="20" placeholder="textarea" value={this.state.article}
                            onChange={this.handleChange}>
                        </textarea>
                    </div>
                    <button type="button" disabled={this.state.loading} className="btn btn-primary" onClick={this.saveData}>Save</button>
                    <Modal show={this.state.showdrivemodal} onHide={this.handleDriveModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Drive</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <DrivePop />
                        </Modal.Body>
                    </Modal>
                </div>
            );
        }
    }
}