import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Glyphicon, Nav, Navbar, NavItem } from 'react-bootstrap';
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
        let loginlink = loggedin ? <LinkContainer to={'/logout'}><NavItem>Logout</NavItem></LinkContainer> :
            <LinkContainer to={'/loginform'}><NavItem>Login</NavItem></LinkContainer>;
        return (
            <Navbar inverse fixedTop fluid collapseOnSelect>
                <Navbar.Header>
                    <Navbar.Brand>
                        <Link to={'/'}>RST Admin</Link>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <LinkContainer to={'/custompagelist'}>
                            <NavItem>Pages</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/articlelist'}>
                            <NavItem>Articles</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/CustomDataSourceList'}>
                            <NavItem>Data Sources</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/CategoryList'}>
                            <NavItem>Categories</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/MemberList'}>
                            <NavItem>Members</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/WebsiteSettings'}>
                            <NavItem>Settings</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/EmailList'}>
                            <NavItem>Emails</NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/NewsletterDesign'}>
                            <NavItem>Newsletter</NavItem>
                        </LinkContainer>
                        <li role="presentation">
                            <a href="https://www.rudrasofttech.com/generatesitemap" target="_blank">Build Sitemap</a>
                        </li>
                        <li role="presentation">
                            <a target="_blank" href="https://rudrasofttech.com/vtracker/report?id=3&range=Last30Days">Visits</a>
                        </li>
                        {loginlink}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}
