'use client'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import AccountButtons from './accountbuttons';

export default function PlyNavbar(props) {
    const expand = 'md';
    return <Navbar key={expand} expand={expand} className="bg-body-tertiary sticky-md-top p-md-1">
        <Container fluid>
            <Navbar.Brand href="/" className="fw-bold dancing-script fw-bold merienda">Ply</Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
            <Navbar.Offcanvas
                id={`offcanvasNavbar-expand-${expand}`}
                aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} className="fw-bold merienda">
                        Ply
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