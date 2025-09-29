import { useRef, useState, useEffect } from "react";
import { useAuth } from "../context/authprovider";
import useAppStore from "../store/useAppStore";
import Nav from 'react-bootstrap/Nav';
import { Button, Modal } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';

export default function AccountButtons(props) {
    const { isLoggedIn } = useAuth();
    const resetStore = useAppStore((state) => state.resetStore);
    const setToken = useAppStore((state) => state.setToken);
    const setUserInfo = useAppStore((state) => state.setUserInfo);
    const name = useAppStore((state) => state.name);
    const [showModal, setShowModal] = useState(false);
    const [iframeUrl, setIframeUrl] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const openModalWithUrl = (url) => {
        setIframeUrl(url);
        setShowModal(true);
    };

    useEffect(() => {
        if (props.showLoginPopup !== null) {
            openModalWithUrl('https://www.rudrasofttech.com/account/login?redirectUrl=');
        }
    }, [props.showLoginPopup]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== 'https://www.rudrasofttech.com') return;
            if (event.data !== null && event.data !== undefined) {
                const response = {
                    token: event.data.token,
                    name: event.data.name,
                    email: event.data.email
                };
                setToken(response.token, event.data.expiry);
                setUserInfo({ name: response.name, email: response.email });
                setShowModal(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return <>
        <Form className="d-flex">
            {isLoggedIn ? <Nav className=" flex-grow-1 pe-3">
                <Nav.Link>{name}</Nav.Link>
                <Nav.Link onClick={resetStore}><i className="bi bi-box-arrow-right"></i></Nav.Link>
            </Nav> : null}
            {isLoggedIn ? null : <div className="flex-grow-1 pe-3">
                <Button type="button" className="me-2 btn-sm" variant="outline-primary" onClick={() => openModalWithUrl('https://localhost:7266/account/login?redirectUrl=')}>Login</Button>
                <Button type="button" className=" btn-sm" variant="outline-primary" onClick={() => openModalWithUrl('https://localhost:7266/account/register?redirectUrl=')}>Sign Up</Button>
            </div>}
        </Form>
        <Modal show={showModal} onHide={() => setShowModal(false)} size={isMobile ? undefined : "md"} fullscreen={isMobile} centered>
            <Modal.Header closeButton>
                <Modal.Title>{iframeUrl.includes('register') ? 'Sign Up' : 'Login'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: 0, minHeight: isMobile ? '100vh' : 500 }}>
                {iframeUrl && <iframe
                    src={iframeUrl}
                    title="Account"
                    style={{ border: 0, width: '100%', height: isMobile ? '100vh' : 500 }}
                    allow="clipboard-write"
                />}
            </Modal.Body>
        </Modal>
    </>;
}