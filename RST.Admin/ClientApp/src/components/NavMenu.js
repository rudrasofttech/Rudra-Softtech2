import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Glyphicon, Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './NavMenu.css';

export class NavMenu extends Component {
    displayName = NavMenu.name

    render() {
        return (
            <Navbar inverse fixedTop fluid collapseOnSelect>
                <Navbar.Header>
                    <Navbar.Brand>
                        <Link to={'/'}>Rudra Sofftech Admin</Link>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <LinkContainer to={'/'} exact>
                            <NavItem>
                                <Glyphicon glyph='home' /> Home
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/counter'}>
                            <NavItem>
                                <Glyphicon glyph='education' /> Counter
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/fetchdata'}>
                            <NavItem>
                                <Glyphicon glyph='th-list' /> Fetch data
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/custompagelist'}>
                            <NavItem>
                                Custom Pages
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/articlelist'}>
                            <NavItem>
                                Articles
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/CustomDataSourceList'}>
                            <NavItem>
                                Data Sources
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/CategoryList'}>
                            <NavItem>
                                Categories
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/MemberList'}>
                            <NavItem>
                                Members
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/WebsiteSettings'}>
                            <NavItem>
                                Website Settings
              </NavItem>
                        </LinkContainer>
                        <LinkContainer to={'/loginform'}>
                            <NavItem>
                                <Glyphicon glyph='th-list' /> Login
              </NavItem>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}
