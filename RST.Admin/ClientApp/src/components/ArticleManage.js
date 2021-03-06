﻿import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, FieldGroup, Button, ControlLabel, ProgressBar, Modal, Checkbox } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';
import { DrivePop } from './DrivePop';
import { API } from './api';

export class ArticleManage extends Component {
    displayName = ArticleManage.name;

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.handleChange = this.handleChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleDriveModal = this.handleDriveModal.bind(this);
        this.state = {
            article: null, categories: [], blogtemplates: [], loading: true, loggedin: loggedin, bsstyle: '', message: '', showdrivemodal : false
        };
        if (loggedin) {

            this.fetchCategory(token);
            this.fetchBlogTemplates(token);
            this.fetchData(token, this.props.match.params.ID === null ? '0' : this.props.match.params.ID);
        }
    }
    fetchCategory(t) {
        fetch(API.GetURL() + 'api/Categories', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request." });
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                this.setState({ categories: data, message: '', bsstyle: '' });
            });
    }
    fetchBlogTemplates(t) {
        fetch(API.GetURL() + 'api/CustomDataSources', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Unable to fetch blog templates. Authorization has been denied for this request." });
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                let cds = [];
                for (var d in data) {
                    if (data[d].Name.toLowerCase().endsWith("blogtemplate")) {
                        cds.push(data[d]);
                    }
                }
                this.setState({ blogtemplates: cds });
            });
    }

    slugify() {
        fetch(API.GetURL() + 'api/Utility/Slugify?t=' + this.state.article.URL)
            .then(response => {
                return response.json();
            })
            .then(data => {
                let a = this.state.article;
                a.URL = data;
                this.setState({ article: a });
            });
    }

    handleDriveModal() {
        this.setState({ showdrivemodal: !this.state.showdrivemodal });
    }

    fetchData(t, id) {
        fetch(API.GetURL() + 'api/posts/' + id, {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Unable to fetch article information. Authorization has been denied for this request.", loggedin: false });
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                data.CreatedBy = { ID: 0, Email: '' };
                this.setState({ article: data, loading: false });
            });
    }

    saveData(e) {
        let saveurl = API.GetURL() + 'api/posts';
        let method = 'post';
        if ((this.props.match.params.ID !== null && this.props.match.params.ID !== "0") || this.state.article.ID !== 0) {
            saveurl = saveurl + '/' + (this.state.article.ID !== 0 ? this.state.article.ID : this.props.match.params.ID);
            method = 'put';
        }
        this.setState({ loading: true });
        fetch(saveurl, {
            method: method,
            body: JSON.stringify({
                Title: this.state.article.Title, Status: this.state.article.Status, Category: this.state.article.Category,
                Tag: this.state.article.Tag, Description: this.state.article.Description, Article: this.state.article.Article,
                WriterName: this.state.article.WriterName, WriterEmail: this.state.article.WriterEmail, OGImage: this.state.article.OGImage,
                OGDescription: this.state.article.OGDescription, MetaTitle: this.state.article.MetaTitle, URL: this.state.article.URL,
                TemplateName: this.state.article.TemplateName, Sitemap: this.state.article.Sitemap
            }),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token"),
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ loading: false, bsstyle: 'danger', message: "Authorization has been denied for this request." });
                } else if (response.status === 200) {
                    this.setState({ loading: false, message: "Article saved.", bsstyle: 'success' });
                } else if (response.status === 201) {
                    this.setState({ loading: false, message: "Article created and your can keep editing.", bsstyle: 'success' });
                    response.json().then(data => {
                        this.fetchData(localStorage.getItem("token"), data.ID);
                    });
                } else {
                    response.json().then(data => {
                        this.setState({ loading: false, message: "Page cannot be saved. " + data.Message, bsstyle: 'danger' });
                    });
                }
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
        var temp = this.state.article;
        switch (e.target.name) {
            case 'Status':
                temp.Status = e.target.value;
                break;
            case 'Tag':
                temp.Tag = e.target.value;
                break;
            case 'Title':
                temp.Title = e.target.value;
                break;
            case 'Sitemap':
                temp.Sitemap = e.target.checked;
                break;
            case 'Description':
                temp.Description = e.target.value;
                break;
            case 'Article':
                temp.Article = e.target.value;
                break;
            case 'Category':
                temp.Category.ID = e.target.value;
                temp.Category.Name = "Temp";
                temp.Category.UrlName = "Temp";
                break;
            case 'WriterName':
                temp.WriterName = e.target.value;
                break;
            case 'WriterEmail':
                temp.WriterEmail = e.target.value;
                break;
            case 'MetaTitle':
                temp.MetaTitle = e.target.value;
                break;
            case 'OGImage':
                temp.OGImage = e.target.value;
                break;
            case 'OGDescription':
                temp.OGDescription = e.target.value;
                break;
            case 'URL':
                temp.URL = e.target.value;
                break;
            case 'TemplateName':
                temp.TemplateName = e.target.value;
                break;
        }
        this.setState({ article: temp });
       
    }
    renderTable(page) {
        return (
            <div>
                <div className="fixedBottom ">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <table className='table'>
                    <tbody>
                        <tr>
                            <td>
                                <FormGroup controlId="Status">
                                    <ControlLabel>Status (Required)</ControlLabel>
                                    <FormControl name="Status" componentClass="select" placeholder="select" value={page.Status} onChange={this.handleChange}>
                                        <option value="1">Draft</option>
                                        <option value="2">Publish</option>
                                        <option value="3">Inactive</option>
                                    </FormControl>
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Title" >
                                    <ControlLabel>Title (Required)</ControlLabel>
                                    <FormControl name="Title" type="text" value={page.Title} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <FormGroup controlId="MetaTitle">
                                    <ControlLabel>Meta Title</ControlLabel>
                                    <FormControl name="MetaTitle" type="text" maxLength="100" value={page.MetaTitle} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="URL">
                                    <ControlLabel>URL (Required)</ControlLabel>
                                    <FormControl name="URL" type="text" maxLength="200" value={page.URL} onBlur={this.handleBlur} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Tag">
                                    <ControlLabel>Tag (Required)</ControlLabel>
                                    <FormControl name="Tag" type="text" maxLength="200" value={page.Tag} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Checkbox name="Sitemap" checked={page.Sitemap} onChange={this.handleChange}>Add to Sitemap</Checkbox>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="WriterName">
                                    <ControlLabel>Writer Name (Required)</ControlLabel>
                                    <FormControl name="WriterName" type="text" maxLength="100" value={page.WriterName} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="WriterEmail">
                                    <ControlLabel>Writer Email</ControlLabel>
                                    <FormControl name="WriterEmail" type="email" value={page.WriterEmail} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Category">
                                    <ControlLabel>Category (Required)</ControlLabel>
                                    <FormControl name="Category" componentClass="select" placeholder="select" value={page.Category.ID} onChange={this.handleChange}>
                                        <option value="select">select</option>
                                        {this.state.categories.map(cp =>
                                            <option key={cp.ID} value={cp.ID}>{cp.Name}</option>
                                        )}

                                    </FormControl>
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Template">
                                    <ControlLabel>Template (Required)</ControlLabel>
                                    <FormControl name="TemplateName" componentClass="select" placeholder="select" value={page.Category.TemplateName} onChange={this.handleChange}>
                                        <option value="">select</option>
                                        {this.state.blogtemplates.map(cp =>
                                            <option key={cp.Name} value={cp.Name}>{cp.Name}</option>
                                        )}

                                    </FormControl>
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="OGImage">
                                    <ControlLabel>Facebook Image (Required)</ControlLabel>
                                    <FormControl name="OGImage" type="text" value={page.OGImage} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="OGDescription">
                                    <ControlLabel>Facebook Description (Required)</ControlLabel>
                                    <FormControl name="OGDescription" type="text" maxLength="500" value={page.OGDescription} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Description">
                                    <ControlLabel>Description (Required)</ControlLabel>
                                    <FormControl name="Description" componentClass="textarea" rows="5" maxLength="1000" placeholder="textarea" value={page.Description} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <FormGroup controlId="Body">
                                    <ControlLabel>Text (Required)</ControlLabel>
                                    <FormControl name="Article" componentClass="textarea" rows="20" placeholder="textarea" value={page.Article} onChange={this.handleChange} />
                                </FormGroup>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                <Button type="button" onClick={this.saveData}>Save</Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
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

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else {
            let contents = this.state.loading
                ? <ProgressBar active now={100} />
                : this.renderTable(this.state.article);
            return (
                <div>
                    <h1>Article</h1>

                    {contents}
                </div>
            );
        }
    }
}