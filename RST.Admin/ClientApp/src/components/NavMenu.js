import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './NavMenu.css';
import { API } from './api';

export class NavMenu extends Component {
    displayName = NavMenu.name
    constructor(props) {
        super(props);
        const token = localStorage.getItem("token");

        if (token !== null) {
            this.fetchData(token);
        }

    }

    fetchData(t) {
        fetch(API.GetURL() + 'api/custompages', {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + t
            }
        })
            .then(response => {
                this.setState({ loading: false });
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    this.setState({ bsstyle: 'danger', message: "Authorization has been denied for this request.", loggedin: false });
                }
            });
    }

    render() {
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        let loginlink = loggedin ? <li className='nav-item'>
            <Link className="nav-link" to={'/logout'}>Logout</Link>
        </li> :
            <li className='nav-item'>
                <Link className="nav-link" to={'/loginform'}>Login</Link>
            </li>;
        return <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
            <div class="sidebar-sticky pt-3">

                <div className='text-start p-2 mb-3 mt-2'>
                    <Link to={'/'}><img src='https://www.rudrasofttech.com/l/img/rst-logo-small.png' style={{ maxHeight: "90px" }} className="img-fluid" /></Link>
                </div>
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <Link className="nav-link" to={'/custompagelist'}>Pages</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/articlelist'}>Articles</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/CustomDataSourceList'}>Data Sources</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/CustomDataSourceList'}>Categories</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/MemberList'}>Members</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/WebsiteSettings'}>Settings</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/EmailList'}>Emails</Link>
                    </li>
                    <li class="nav-item">
                        <Link className="nav-link" to={'/NewsletterDesign'}>Newsletter</Link>
                    </li>
                    <li class="nav-item">
                        <a className="nav-link" href="https://www.rudrasofttech.com/generatesitemap" target="_blank">Build Sitemap</a>
                    </li>
                    <li class="nav-item">
                        <a className="nav-link" target="_blank" href="https://rudrasofttech.com/vtracker/report?id=3&range=Last30Days">Visits</a>
                    </li>
                    {loginlink}
                </ul>
            </div>
        </nav>;
    }
}
