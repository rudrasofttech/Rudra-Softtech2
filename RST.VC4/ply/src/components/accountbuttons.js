import { useRef } from "react";
import { useAuth } from "../context/authprovider";
import useAppStore from "../store/useAppStore";
import { useEffect } from "react";
import Nav from 'react-bootstrap/Nav';
import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';


export default function AccountButtons(props) {
    const { isLoggedIn } = useAuth()
    const resetStore = useAppStore((state) => state.resetStore);
    const popupRef = useRef(null);
    const setToken = useAppStore((state) => state.setToken);
    const setUserInfo = useAppStore((state) => state.setUserInfo);
    const name = useAppStore((state) => state.name);
const navigate = useNavigate();
    const isMobile = () => window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Extract token info from query string if present and remove from URL after setting
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const email = params.get("email");
        const nameParam = params.get("name");
        const expiry = params.get("expiry");
        if (token && email && nameParam && expiry) {
            setToken(token, expiry);
            setUserInfo({ name: nameParam, email });
            // Remove the query params from the URL after processing
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [setToken, setUserInfo]);

    const openLoginPopup = () => {
        const url = 'https://www.rudrasofttech.com/account/login?returnUrl=';
        if (isMobile()) {
            window.location.href = url + encodeURIComponent(window.location.href);
        } else {
            popupRef.current = window.open(
                url,
                'LoginWindow',
                'width=500,height=700'
            );
        }
    };

    const openRegisterPopup = () => {
        const url = 'https://www.rudrasofttech.com/account/register?returnUrl=';
        if (isMobile()) {
            window.location.href = url + encodeURIComponent(window.location.href);
        } else {
            popupRef.current = window.open(
                url,
                'LoginWindow',
                'width=500,height=700'
            );
        }
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
            <Nav.Link onClick={() => { 
                resetStore(); 
                navigate('/');
                }}><i className="bi bi-box-arrow-right"></i></Nav.Link>
        </Nav> : null}
        {isLoggedIn ? null : <div className="flex-grow-1 pe-3">
            <Button type="button" className="me-2 btn-sm" variant="outline-primary" onClick={openLoginPopup}>Login</Button>
            <Button type="button" className=" btn-sm" variant="outline-primary" onClick={openRegisterPopup}>Sign Up</Button>
        </div>}
    </Form>;
}