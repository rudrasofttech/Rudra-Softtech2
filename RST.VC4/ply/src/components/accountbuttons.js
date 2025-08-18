import { useRef } from "react";
import { useAuth } from "../context/authprovider";
import useAppStore from "../store/useAppStore";
import { useEffect } from "react";
import Nav from 'react-bootstrap/Nav';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';

export default function AccountButtons(props) {
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
            // Replace with your Id origin
            if (event.origin !== 'https://www.rudrasofttech.com') return;
            //console.log('Message received from IdP:', event.data);
            if (event.data !== null && event.data !== undefined) {
                //console.log('Token received:', event.data.token);

                const response = {
                    token: event.data.token,
                    name: event.data.name,
                    email: event.data.email
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

    return <Form className="d-flex">
        {isLoggedIn ? <Nav className=" flex-grow-1 pe-3">
            <Nav.Link>{name}</Nav.Link>
            <Nav.Link onClick={resetStore}><i className="bi bi-box-arrow-right"></i></Nav.Link>
        </Nav> : null}
        {isLoggedIn ? null : <div className="flex-grow-1 pe-3">
            <Button type="button" className="me-2" variant="outline-primary" onClick={openLoginPopup}>Login</Button>
            <Button type="button" variant="outline-primary" onClick={openRegisterPopup}>Sign Up</Button>
        </div>}
    </Form>;
}