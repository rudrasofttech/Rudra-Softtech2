import React, { Component } from 'react';
import { Table, Glyphicon, Button } from 'react-bootstrap';
import { MessageStrip } from './MessageStrip';

export class DrivePop extends Component {
    displayName = DrivePop.name

    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        this.state = {
            crumbs: [], directories: [], files: [], path: "", loading: true, loggedin: loggedin, bsstyle: '', message: ''
        };

        this.selectFolder = this.selectFolder.bind(this);

        if (loggedin) {
            this.fetchData(token, "");
        }
    }

    fetchData(t, path) {
        this.setState({ loading: true });
        fetch('http://localhost:59709/api/Drive/?name=' + path, {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                if (response.status === 401) {
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loading: false });
                } else {
                    response.json()
                        .then(data => {
                            console.log(data);
                            this.setState({ loading: false, crumbs: data.Crumbs, files: data.Files, directories: data.Directories, bsstyle: '', message: '' });
                        });
                }
            });
    }

    selectFolder(e) {
        this.fetchData(localStorage.getItem("token"), e.target.value);
    }

    renderImageType(f) {
        switch (f.ItemType) {
            case 2:
                return <Glyphicon glyph="file" bsSize="large" />;
            case 3:

                return <div style={{ width: 100 + 'px', height: 100 + 'px', backgroundImage: 'url(' + f.ThumbNail + ')', backgroundSize: 'cover' }} />;
            case 4:
                return <Glyphicon glyph="video" bsSize="large" />;
            case 5:
                return <Glyphicon glyph="compressed" bsSize="large" />;
            default:
                return <Glyphicon glyph="file" bsSize="large" />;
        }
    }

    renderTable(list1, list2, crumbs) {
        return (
            <div>
                <div className="fixedBottom">
                    <MessageStrip message={this.state.message} bsstyle={this.state.bsstyle} />
                </div>
                <div>
                    <button type='button' value='' className='btn btn-link' onClick={this.selectFolder}>Home</button>
                    {crumbs.map(cp =>
                         <span>/ <button type='button' className='btn btn-link' value={cp.Location} onClick={this.selectFolder}>{cp.Name}</button> </span>)}
                </div>
                <Table striped bordered>
                    <thead>
                        <tr>
                            <th />
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list1.map(cp =>
                            <tr key={cp.ID}>
                                <td />
                                <td><button value={cp.Location} className="btn btn-link" onClick={this.selectFolder}>{cp.Name}</button></td>
                            </tr>
                        )}
                        {list2.map(cp =>
                            <tr key={cp.ID}>
                                <td>{this.renderImageType(cp)}</td>
                                <td><input type="text" style={{ width : 100 + '%'}} value={cp.WebPath} /></td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        );
    }

    render() {

        if (!this.state.loggedin) {
            return (<span>No Logged In.</span>);
        } else {
            let contents = this.state.loading
                ? <p><em>Loading...</em></p>
                : this.renderTable(this.state.directories, this.state.files, this.state.crumbs);
            return (
                <div>
                    {contents}
                </div>
            );
        }
    }
}