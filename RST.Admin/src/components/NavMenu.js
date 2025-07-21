import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './NavMenu.css';
import { API } from './api';
import pages from '../browser.png';
import articles from '../article.png';
import gears from '../gears.png';
import categories from '../product-categories.png';
import members from '../group.png';
import settings from '../setting-lines.png';
import email from '../letter.png';
import template from '../template.png';
//import newsletter from '../newsletter.png';
import sitemap from '../sitemap.png';
import logout from '../logout.png';

export class NavMenu extends Component {
    displayName = NavMenu.name
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData() {
        fetch(`${API.GetURL()}/custompages/list`, {
            method: 'get',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("token") }`
            }
        })
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                }
            }).catch(err => {
                console.log(err);
            });
    }

    render() {
        const token = localStorage.getItem("token");
        let loggedin = true;

        if (token === null) {
            loggedin = false;
        }
        let loginlink = loggedin ? <li className='nav-item mb-2'>
            <Link className="nav-link text-dark" to={'/logout'}>
                <img src={logout} className="img-fluid icon-small me-2" />
                Logout</Link>
        </li> :
            <li className='nav-item mb-2'>
                <Link className="nav-link text-dark" to={'/loginform'}>Login</Link>
            </li>;
        return <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block d-none bg-light">
            <div className="sticky-top pt-3" style={{ height: "100vh" } }>

                <div className='text-start p-2 mb-3 mt-2'>
                    <Link to={'/'}><img src='https://www.rudrasofttech.com/l/img/rst-logo-small.png' style={{ maxHeight: "90px" }} className="img-fluid" /></Link>
                </div>
                <ul className="nav flex-column">
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/custompagelist'}>
                            <img src={pages} className="img-fluid icon-small me-2"  />Web Pages</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/articlelist'}>
                            <img src={articles} className="img-fluid icon-small me-2" />
                            Articles</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/CustomDataSourceList'}>
                            <img src={gears} className="img-fluid icon-small me-2" />
                            Data Sources</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/CategoryList'}>
                            <img src={categories} className="img-fluid icon-small me-2" />
                            Categories</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/MemberList'}>
                            <img src={members} className="img-fluid icon-small me-2" />
                            Members</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/WebsiteSettings'}>
                            <img src={settings} className="img-fluid icon-small me-2" />
                            Settings</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/EmailList'}>
                            <img src={email} className="img-fluid icon-small me-2" />
                            Emails</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/UserWebsiteThemes'}>
                            <img src={template} className="img-fluid icon-small me-2" />
                            Website Themes</Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link className="nav-link text-dark" to={'/UserWebsites'}>
                            <img src={template} className="img-fluid icon-small me-2" />
                            User Websites</Link>
                    </li>
                    {/*<li className="nav-item mb-2">*/}
                    {/*    <Link className="nav-link text-dark" to={'/NewsletterDesign'}>*/}
                    {/*        <img src={newsletter} className="img-fluid icon-small me-2" />*/}
                    {/*        Newsletter Design</Link>*/}
                    {/*</li>*/}
                    <li className="nav-item mb-2">
                        <a className="nav-link text-dark" href="https://www.rudrasofttech.com/generatesitemap" target="_blank">
                            <img src={sitemap} className="img-fluid icon-small me-2" />
                            Build Sitemap</a>
                    </li>
                    {/*<li className="nav-item">*/}
                    {/*    <a className="nav-link" target="_blank" href="https://rudrasofttech.com/vtracker/report?id=3&range=Last30Days">Visits</a>*/}
                    {/*</li>*/}
                    {loginlink}
                </ul>
            </div>
        </nav>;
    }
}
