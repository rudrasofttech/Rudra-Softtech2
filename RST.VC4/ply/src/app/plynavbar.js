'use client'

import { useAuth } from './context/authprovider'
//import Link from 'next/link'
//import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
//import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
//import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';


export default function PlyNavbar() {
  const { isLoggedIn, logout } = useAuth()
  const expand = 'md';

    return <Navbar key={expand} expand={expand} className="bg-body-tertiary mb-3 custom-navbar">
          <Container fluid>
            <Navbar.Brand href="#" className="fw-bold dancing-script fs-1">Ply</Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
            <Navbar.Offcanvas
              id={`offcanvasNavbar-expand-${expand}`}
              aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
              placement="end"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} className="fw-bold">
                  Ply
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                  <Nav className="justify-content-end flex-grow-1 pe-3">
                      {isLoggedIn ? <>
                          <Nav.Link href="#action1">My Site</Nav.Link>
                          <Nav.Link onClick={logout}>Logout</Nav.Link>
                      </> : <>
                          <Nav.Link href="/login">Login</Nav.Link>
                          <Nav.Link href="/signup">Sign Up</Nav.Link>
                      </>}
                  
                {/*  <NavDropdown*/}
                {/*    title="Dropdown"*/}
                {/*    id={`offcanvasNavbarDropdown-expand-${expand}`}*/}
                {/*  >*/}
                {/*    <NavDropdown.Item href="#action3">Action</NavDropdown.Item>*/}
                {/*    <NavDropdown.Item href="#action4">*/}
                {/*      Another action*/}
                {/*    </NavDropdown.Item>*/}
                {/*    <NavDropdown.Divider />*/}
                {/*    <NavDropdown.Item href="#action5">*/}
                {/*      Something else here*/}
                {/*    </NavDropdown.Item>*/}
                {/*  </NavDropdown>*/}
                </Nav>
                {/*<Form className="d-flex">*/}
                {/*  <Form.Control*/}
                {/*    type="search"*/}
                {/*    placeholder="Search"*/}
                {/*    className="me-2"*/}
                {/*    aria-label="Search"*/}
                {/*  />*/}
                {/*  <Button variant="outline-success">Search</Button>*/}
                {/*</Form>*/}
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          </Container>
        </Navbar>;
}