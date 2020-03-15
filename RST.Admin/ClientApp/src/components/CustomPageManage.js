import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, FieldGroup, Button, ControlLabel, ProgressBar, Modal, Checkbox } from 'react-bootstrap';

export class CustomPageManage extends Component {
    displayName = CustomPageManage.name;

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.handleChange = this.handleChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.state = { custompage: null, loading: true, loggedin: loggedin, reload: false };
        if (loggedin) {
            this.fetchData(token, this.props.match.params.ID === null ? '0' : this.props.match.params.ID);
        }
    }

    fetchData(t, id) {
        fetch('http://localhost:59709/api/custompages/' + id, {
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
                data.CreatedBy = { ID: 0, Email: '' };
                this.setState({ custompage: data, loading: false });
            });
    }

    saveData(e) {
        let saveurl = 'http://localhost:59709/api/custompages';
        let method = 'post';
        if ((this.props.match.params.ID !== null && this.props.match.params.ID !== "0") || this.state.custompage.ID !== 0) {
            saveurl = saveurl + '/' + ((this.state.custompage.ID !== 0) ? this.state.custompage.ID : this.props.match.params.ID);
            method = 'put';
        }
        this.setState({ loading: true });
        fetch(saveurl, {
            method: method,
            body: JSON.stringify({
                Name: this.state.custompage.Name, Status: this.state.custompage.Status, Sitemap: this.state.custompage.Sitemap,
                Body: this.state.custompage.Body, Head: this.state.custompage.Head, NoTemplate: this.state.custompage.NoTemplate,
                PageMeta: this.state.custompage.PageMeta, Title: this.state.custompage.Title
            }),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token"),
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ error: true, message: "Authorization has been denied for this request.", loggedin: false });
                } else if (response.status === 200) {
                    this.setState({ loading: false, message: "Page saved.", error: false });
                    console.log("Page Saved");
                } else if (response.status === 201) {
                    this.setState({ loading: false, message: "Page saved.", error: false });
                    console.log("Page Created");
                    response.json().then(data => {
                        this.fetchData(localStorage.getItem("token"), data.ID);
                    });
                } else {
                    this.setState({ loading: false, message: "Page cannot be saved.", error: false });
                    alert("Unable to save page.");
                }
            });
    }
    handleChange(e) {
        var temp = this.state.custompage;
        switch (e.target.name) {
            case 'Status':
                temp.Status = e.target.value;
                break;
            case 'Name':
                temp.Name = e.target.value;
                break;
            case 'Title':
                temp.Title = e.target.value;
                break;
            case 'Sitemap':
                temp.Sitemap = e.target.checked;
                break;
            case 'Body':
                temp.Body = e.target.value;
                break;
            case 'Head':
                temp.Head = e.target.value;
                break;
            case 'NoTemplate':
                temp.NoTemplate = e.target.checked;
                break;
            case 'PageMeta':
                temp.PageMeta = e.target.value;
                break;
        }
        this.setState({ custompage: temp });
    }
    renderTable(page) {
        return (
            <table className='table'>
                <tbody>
                    <tr>
                        <td><FormGroup controlId="Status">
                            <ControlLabel>Status (Required)</ControlLabel>
                            <FormControl name="Status" componentClass="select" placeholder="select" value={page.Status} onChange={this.handleChange}>
                                <option value="1">Draft</option>
                                <option value="2">Publish</option>
                                <option value="3">Inactive</option>
                            </FormControl>
                        </FormGroup></td>
                        <td>
                            <Checkbox name="NoTemplate" checked={page.NoTemplate} onChange={this.handleChange}>Empty Page</Checkbox> <Checkbox name="Sitemap" checked={page.Sitemap} onChange={this.handleChange}>Sitemap</Checkbox>
                        </td>

                    </tr>
                    <tr>
                        <td colSpan="3">
                            <FormGroup controlId="Name" >
                                <ControlLabel>Page Name (Required)</ControlLabel>
                                <FormControl name="Name" type="text" value={page.Name} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="3">
                            <FormGroup controlId="Title" >
                                <ControlLabel>Page Title (Required)</ControlLabel>
                                <FormControl name="Title" type="text" value={page.Title} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan="3">
                            <FormGroup controlId="PageMeta">
                                <ControlLabel>Page Meta(optional)</ControlLabel>
                                <FormControl name="PageMeta" componentClass="textarea" rows="4" value={page.PageMeta} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="3">
                            <FormGroup controlId="Head">
                                <ControlLabel>Page Head(optional)</ControlLabel>
                                <FormControl name="Head" componentClass="textarea" rows="6" value={page.Head} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan="3">
                            <FormGroup controlId="Body">
                                <ControlLabel>Body (Required)</ControlLabel>
                                <FormControl name="Body" componentClass="textarea" rows="20" value={page.Body} onChange={this.handleChange} />
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
        );
    }

    render() {
        if (!this.state.loggedin) {
            return <Redirect to="/loginform" />;
        }
        else if (this.state.reload) {
            return <Redirect to={'/custompagelist'} />;
        }
        else {
            let contents = this.state.loading
                ? <ProgressBar active now={100} />
                : this.renderTable(this.state.custompage);
            return (
                <div>
                    <h1>Web Page</h1>
                    {contents}
                </div>
            );
        }
    }
}