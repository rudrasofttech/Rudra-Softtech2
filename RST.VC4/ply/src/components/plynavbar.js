'use client'
import { Merienda } from 'next/font/google';
import { useAuth } from '@/context/authprovider'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import useAppStore from '@/store/useAppStore';
import { useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import Link from 'next/link';


const ds = Merienda({
    subsets: ['latin'],
});
export default function PlyNavbar(props) {
    const { isLoggedIn } = useAuth()
    const resetStore = useAppStore((state) => state.resetStore);
    const popupRef = useRef(null);
    const setToken = useAppStore((state) => state.setToken);
    const setUserInfo = useAppStore((state) => state.setUserInfo);
    const name = useAppStore((state) => state.name);

    const openLoginPopup = () => {
        popupRef.current = window.open(
            'https://www.rudrasofttech.com/account/login?redirectUrl=',
            'LoginWindow',
            'width=500,height=700'
        );
    };

    const openRegisterPopup = () => {
        popupRef.current = window.open(
            'https://www.rudrasofttech.com/account/register?redirectUrl=',
            'LoginWindow',
            'width=500,height=700'
        );
    };

    useEffect(() => {
        if (props.showLoginPopup !== null) {
            openLoginPopup();
        }
    }, [props.showLoginPopup]);

    useEffect(() => {
        const handleMessage = (event) => {
            // Replace with your IdP origin
            if (event.origin !== 'https://www.rudrasofttech.com') return;
            //console.log('Message received from IdP:', event.data);
            if (event.data !== null && event.data !== undefined) {
                //console.log('Token received:', event.data.token);

                const response = {
                    token: event.data.token,
                    name: event.data.name,
                    email: event.data.email,
                };

                setToken(response.token, event.data.expiry);
                setUserInfo({ name: response.name, email: response.email });

                if (popupRef.current) {
                    popupRef.current.close();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const expand = 'md';

    return <Navbar key={expand} expand={expand} className="bg-body-tertiary custom-navbar">
        <Container fluid>
            <Navbar.Brand href="/" className={"fw-bold dancing-script fs-1 " + ds.className}>Ply</Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
            <Navbar.Offcanvas
                id={`offcanvasNavbar-expand-${expand}`}
                aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`} className="fw-bold">
                        Ply
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Nav className="justify-content-end flex-grow-1 pe-3">
                        {isLoggedIn ? <>
                            <Nav.Link className="dancing-script">Hello, {name}</Nav.Link>
                            <Nav.Link className="dancing-script text-danger" onClick={resetStore}>Logout</Nav.Link>
                        </> : null}
                    </Nav>
                    {isLoggedIn ? null: <>
                        <Button type="button" className="me-2" variant="outline-primary" onClick={openLoginPopup}>Login</Button>
                        <Button type="button" variant="outline-primary" onClick={openRegisterPopup}>Sign Up</Button>
                    </>}
                </Offcanvas.Body>
            </Navbar.Offcanvas>
        </Container>
    </Navbar>;
}