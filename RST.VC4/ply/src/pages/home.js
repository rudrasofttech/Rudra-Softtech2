import { useAuth } from '../context/authprovider'
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Container } from "react-bootstrap";
import PlyNavbar from "../components/plynavbar";
import "../styles/globals.css";
import Loader from '../components/loader';
import { getWithAuth } from '../utils/api';
import { APIURLS } from '../utils/config';
import { StatusDisplay, WebsiteTypeDisplay } from '../components/statusdisplay';
import Swal from 'sweetalert2';
import useAppStore from '../store/useAppStore';
import Nav from 'react-bootstrap/Nav';
import HomeAnonymous from '../components/homeanonymous';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';



function Home() {
  const [redirectUrl, setRedirectUrl] = useState("");
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [dummy, setDummy] = useState(null);
  const [loading, setLoading] = useState(false);

  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState('');
  const { setDesigns, designs, deleteDesign } = useAppStore();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSite, setShareSite] = useState(null);


  useEffect(() => {
    const loadDesigns = async () => {
      if (isLoggedIn) {
        const res = await getWithAuth(`${APIURLS.userWebsite}/mywebsites`, navigate);
        if (res.result && res.data) {
          setDesigns(res.data);
        } else {
          setError(res.errors.join(', '));
        }
      }
    };
    setLoading(true);
    setError('');
    loadDesigns(); // initial load
    setLoading(false);
    const interval = setInterval(loadDesigns, 20000); // background refresh every 20s
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (redirectUrl) {
      navigate(redirectUrl);
    }
  }, [redirectUrl]);

  const getShareText = (site) => {
    return `Hey, just wanted to share my digital card "${site.name}" with you. It’s got all my latest contact info and links, in case you ever need them. Here’s the link: https://${site.name.toLowerCase()}.vc4.in`;
  }

  const deleteItem = async (id) => {
    setLoadingDelete(true);
    setError('');
    var r = await getWithAuth(`${APIURLS.userWebsite}/delete/${id}`, navigate, { checkResponseBody: false });
    if (r.result) {
      deleteDesign(id);
    } else {
      setError(r.errors.join(', '));
    }
    setLoadingDelete(false);
  }

  const handleShare = (site) => {
    setShareSite(site);
    setShowShareModal(true);
  }

  const shareVia = (platform) => {
    if (!shareSite) return;
    const url = `https://${shareSite.name}.vc4.in`;
    const text = getShareText(shareSite);

    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Check%20out%20my%20digital%20card&body=${encodeURIComponent(text)}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodeURIComponent(text)}`;
        break;
      default:
        shareUrl = '';
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    setShowShareModal(false);
  }

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to undo this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // ✅ Proceed with delete
        deleteItem(id);
      } else {
        // ❌ Cancelled
        console.log('User cancelled deletion');
      }
    });
  };


  return (
    <>
      <PlyNavbar showLoginPopup={dummy}>
        <Nav className="justify-content-end flex-grow-1 pe-3"></Nav>
      </PlyNavbar>
      {!isLoggedIn ? (
        <HomeAnonymous onStart={() => setDummy(Date.now())} />
      ) : <div>
        <Container fluid className="my-5">
          {loading ? <Loader /> : null}
          {error !== "" ? <div className="text-danger text-center my-2">{error}</div> : null}
          {!loading ? <>{designs.length > 0 ? (
            <>
              <div className="mb-4">
                <div className='row align-items-center'>
                  <div className='col-xl-6 col-md-3'>
                    <h1 className="me-auto text-center text-md-start mb-2 mb-md-0">My Sites</h1>
                  </div>
                  <div className='col-xl-3 col-md-5'>

                    <button type="button" onClick={() => {
                      setRedirectUrl('/createvcard');
                    }} className="fancy-btn w-100 mb-2 mb-md-0">
                      <span className="icon">💼</span>
                      Create Visiting Card
                    </button>
                  </div>
                  <div className='col-xl-3 col-md-4'>
                    <button type="button" onClick={() => {
                      setRedirectUrl('/createlinklist');
                    }} className="fancy-btn w-100 mb-2 mb-md-0 linklist">
                      <span className="icon">🔗</span>
                      Create Link List
                    </button>
                  </div>
                </div>
              </div>


              <div className="row g-4">
                {designs.map((site, index) => {
                  // Set title color based on status
                  let titleColor = "text-primary";
                  if (site.status === 0) titleColor = "text-success";
                  else if (site.status === 1) titleColor = "text-secondary";
                  else if (site.status === 2) titleColor = "text-danger";
                  else if (site.status === 3) titleColor = "text-warning";

                  return (
                    <div className="col-12 col-md-6 col-lg-4" key={index}>
                      <div className="card h-100 shadow-lg border-0 rounded-4">
                        <div className="card-body d-flex flex-column justify-content-between">
                          <div>
                            <h5 className={`card-title mb-2 d-flex align-items-center gap-2 ${titleColor}`}>
                              <WebsiteTypeDisplay wt={site.wsType} />
                              <a rel="noreferrer" href={`https://${site.name}.vc4.in`}
                                target="_blank" className={`text-decoration-none fw-bold ${titleColor}`}
                                style={{ fontSize: "1.25rem" }}>
                                {site.name}
                              </a>
                              <StatusDisplay status={site.status} />
                            </h5>
                            <div className="mb-2">
                              <span className="badge bg-light text-dark me-2">
                                Created: {new Date(site.created).toLocaleDateString()}
                              </span>
                              {site.modified ? (
                                <span className="badge bg-light text-dark">
                                  Last modified: {new Date(site.modified).toLocaleDateString()}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="d-flex flex-wrap gap-2 mt-3">
                            <a rel="noreferrer"
                              href={`https://www.webstats.co.in/report?id=${site.webstatsId}`}
                              target="_blank"
                              className="btn btn-outline-secondary rounded-pill  me-2">
                              <i className="bi bi-bar-chart-line"></i>
                            </a>
                            <button
                              type="button"
                              className="btn btn-outline-primary rounded-pill  me-2"
                              onClick={() => handleShare(site)}>
                              <i className="bi bi-share"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-dark rounded-pill  me-2"
                              disabled={loading || loadingDelete}
                              onClick={() => {
                                if (site.wsType === 1) {
                                  setRedirectUrl(`/editcard/${site.id}`);
                                } else if (site.wsType === 2) {
                                  setRedirectUrl(`/editlinklist/${site.id}`);
                                }
                              }}>
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger rounded-pill  me-2"
                              disabled={loading || loadingDelete}
                              onClick={() => { handleDelete(site.id); }}>
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : <>
            <div className="text-center fs-4 py-3">You do not have any websites yet, this is the right time to start.</div>
            <div className="text-center mt-3">
              <button type="button" onClick={() => {
                setRedirectUrl('/createvcard');
              }} className="btn btn-success btn-lg fs-3 me-4">Create Visiting Card</button>
              <button type="button" onClick={() => {
                setRedirectUrl('/createlinklist');
              }} className="btn btn-primary btn-lg fs-3">Create Link List</button>
            </div>
          </>}</> : <>Loading websites...</>}
        </Container>
      </div>}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Share Your Site</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="">
            {shareSite ? <>
              <div className='text-center mb-3 fs-4'>Download QR Code</div>
              <div className='px-5'>
                <img src={`${APIURLS.userWebsite}/qrcode/${shareSite.id}`} alt="Share" className="img-fluid" />
              </div>
            </> : null}
            <div className='text-center my-3 fs-4'>Or share this text</div>
            <textarea className='form-control' rows={4} readOnly value={shareSite ? getShareText(shareSite) : ''}></textarea>
            {/* <div className='text-center'>
              <button className='mb-2 me-2 btn btn-success btn-lg rounded-circle' onClick={() => shareVia('whatsapp')}>
                <i className="bi bi-whatsapp"></i></button>
              <button className='mb-2 me-2 btn btn-primary btn-lg rounded-circle' onClick={() => shareVia('facebook')}>
                <i className="bi bi-facebook"></i>
              </button>
              <button className='mb-2 me-2 btn btn-info btn-lg rounded-circle text-white' onClick={() => shareVia('linkedin')}>
                <i className="bi bi-linkedin"></i>
              </button>
              <button className='mb-2 me-2 btn btn-secondary btn-lg rounded-circle' onClick={() => shareVia('twitter')}>
                <i className="bi bi-twitter"></i>
              </button>
              <button className='mb-2 me-2 btn btn-warning btn-lg rounded-circle text-white' onClick={() => shareVia('sms')}>
                <i className="bi bi-chat-dots"></i>
              </button>
              <button className='mb-2 btn btn-dark btn-lg rounded-circle' onClick={() => shareVia('email')}>
                <i className="bi bi-envelope"></i>
              </button>
            </div> */}
          </div>

        </Modal.Body>
      </Modal>
    </>
  );
}

export default Home;
