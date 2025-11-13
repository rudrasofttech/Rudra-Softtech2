'use client'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import AccountButtons from './accountbuttons';
import logo from '../assets/logo.jpg';

export default function PlyNavbar(props) {
    const expand = 'md';
    return <Navbar key={expand} expand={expand} className="bg-white sticky-lg-top p-md-1">
        <Container fluid>
            <Navbar.Brand href="/" className="fw-bold dancing-script fw-bold merienda"><img src={logo} alt="Ply Logo" title='Ply' className='img-fluid logo' /></Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
            <Navbar.Offcanvas
                id={`offcanvasNavbar-expand-${expand}`}
                aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} className="fw-bold merienda">
                        <img src={logo} alt="Ply Logo" title='Ply' className='img-fluid logo' />
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {props.children}
                    <AccountButtons showLoginPopup={props.showLoginPopup} />
                </Offcanvas.Body>
            </Navbar.Offcanvas>
        </Container>
    </Navbar>;
}