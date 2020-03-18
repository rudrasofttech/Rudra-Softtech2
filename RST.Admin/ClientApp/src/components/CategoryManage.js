import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, Button, ControlLabel, ProgressBar } from 'react-bootstrap';

export class CategoryManage extends Component {
    displayName = CategoryManage.name;

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.handleChange = this.handleChange.bind(this);
        this.saveData = this.saveData.bind(this);
        this.state = {
            datasource: null, loading: true, loggedin: loggedin, reload: false
        };
        if (loggedin) {
            this.fetchData(token, this.props.match.params.ID === null ? '0' : this.props.match.params.ID);
        }
    }

    fetchData(t, id) {
        fetch('http://localhost:59709/api/Categories/' + id, {
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
                this.setState({ category: data, loading: false });
            });
    }

    saveData(e) {
        let saveurl = 'http://localhost:59709/api/Categories';
        let method = 'post';
        if ((this.props.match.params.ID !== null && this.props.match.params.ID !== "0") || this.state.category.ID !== 0) {
            saveurl = saveurl + '/' + (this.state.category.ID !== 0 ? this.state.category.ID : this.props.match.params.ID);
            method = 'put';
        }
        this.setState({ loading: true });
        fetch(saveurl, {
            method: method,
            body: JSON.stringify(this.state.category),
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token"),
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ error: true, message: "Authorization has been denied for this request.", loggedin: false });
                } else if (response.status === 200) {
                    this.setState({ loading: false, message: "Saved", error: false });
                    console.log("Category Saved");
                } else if (response.status === 201) {
                    this.setState({ loading: false, message: "Saved", error: false });
                    console.log("Category Created");
                    response.json().then(data => {
                        this.fetchData(localStorage.getItem("token"), data.ID);
                    });
                } else {
                    this.setState({ loading: false, message: "Category cannot be saved.", error: false });
                    alert("Unable to save page.");
                }
            });
    }
    handleChange(e) {
        var temp = this.state.category;
        switch (e.target.name) {
            case 'Name':
                temp.Name = e.target.value;
                break;
            case 'UrlName':
                temp.UrlName = e.target.value;
                break;
            case 'Status':
                temp.Status = e.target.value;
                break;

        }
        this.setState({ category: temp });

    }
    renderTable(page) {
        return (
            <table className='table'>
                <tbody>

                    <tr>
                        <td>
                            <FormGroup controlId="Name" >
                                <ControlLabel>Name (Required)</ControlLabel>
                                <FormControl name="Name" maxLength="50" type="text" value={page.Name} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <FormGroup controlId="UrlName" >
                                <ControlLabel>Url Name (Required)</ControlLabel>
                                <FormControl name="UrlName" maxLength="50" type="text" value={page.UrlName} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <FormGroup controlId="Status">
                                <ControlLabel>Status (Required)</ControlLabel>
                                <FormControl name="Status" componentClass="select" placeholder="select" value={page.Status} onChange={this.handleChange}>
                                    <option value="0">Active</option>
                                    <option value="1">Inactive</option>
                                    <option value="2">Deleted</option>
                                </FormControl>
                            </FormGroup>
                        </td>
                    </tr>
                    <tr>
                        <td>
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
            return <Redirect to={'/customdatasourcelist'} />;
        }
        else {
            let contents = this.state.loading
                ? <ProgressBar active now={100} />
                : this.renderTable(this.state.category);
            return (
                <div>
                    <h1>Category</h1>
                    {contents}
                </div>
            );
        }
    }
}