import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { FormGroup, FormControl, Button, ControlLabel, ProgressBar } from 'react-bootstrap';

export class DataSourceManage extends Component {
    displayName = DataSourceManage.name;

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
        fetch('http://localhost:59709/api/CustomDataSources/' + id, {
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
                data.CreatedBy = { ID: 0, Email: 'demo@demo.com', Password : 'xxxxxxx' };
                this.setState({ datasource: data, loading: false });
            });
    }

    saveData(e) {
        let saveurl = 'http://localhost:59709/api/CustomDataSources';
        let method = 'post';
        if ((this.props.match.params.ID !== null && this.props.match.params.ID !== "0") || this.state.datasource.ID !== 0) {
            saveurl = saveurl + '/' + (this.state.datasource.ID !== 0 ? this.state.datasource.ID : this.props.match.params.ID);
            method = 'put';
        }
        this.setState({ loading: true });
        fetch(saveurl, {
            method: method,
            body: JSON.stringify(this.state.datasource),
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
                    console.log("Page Saved");
                } else if (response.status === 201) {
                    this.setState({ loading: false, message: "Saved", error: false });
                    console.log("Data Source Created");
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
        var temp = this.state.datasource;
        switch (e.target.name) {
            case 'Name':
                temp.Name = e.target.value;
                break;
            case 'Query':
                temp.Query = e.target.value;
                break;
            case 'HtmlTemplate':
                temp.HtmlTemplate = e.target.value;
                break;

        }
        this.setState({ datasource: temp });

    }
    renderTable(page) {
        return (
            <table className='table'>
                <tbody>

                    <tr>
                        <td>
                            <FormGroup controlId="Name" >
                                <ControlLabel>Name (Required)</ControlLabel>
                                <FormControl name="Name" type="text" value={page.Name} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <FormGroup controlId="Query">
                                <ControlLabel>Query</ControlLabel>
                                <FormControl name="Query" componentClass="textarea" rows="10" placeholder="textarea" value={page.Query} onChange={this.handleChange} />
                            </FormGroup>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <FormGroup controlId="HtmlTemplate">
                                <ControlLabel>HTML / XSL Template (Required)</ControlLabel>
                                <FormControl name="HtmlTemplate" componentClass="textarea" rows="10" placeholder="textarea" value={page.HtmlTemplate} onChange={this.handleChange} />
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
            return <Redirect to={'/customdatasourcelist'} />;
        }
        else {
            let contents = this.state.loading
                ? <ProgressBar active now={100} />
                : this.renderTable(this.state.datasource);
            return (
                <div>
                    <h1>Data Source</h1>
                    {contents}
                </div>
            );
        }
    }
}