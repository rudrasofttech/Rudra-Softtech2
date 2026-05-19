import { useAuth } from '../context/authprovider'
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Container } from "react-bootstrap";
import PlyNavbar from "../components/plynavbar";
import "../styles/globals.css";
import "../styles/dashboard.css";
import Loader from '../components/loader';
import { getWithAuth, postWithAuth } from '../utils/api';
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

  // Filter state for tabs
  const [filter, setFilter] = useState('all');

  // Filtered designs
  const filteredDesigns = designs.filter(site => {
    if (filter === 'all') return true;
    if (filter === 'active') return site.status === 0;
    if (filter === 'inactive') return site.status !== 0;
    return true;
  });

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
    return `Hey, just wanted to share my digital card "${site.name}" with you. It’s got all my latest contact info and links, in case you ever need them. Here’s the link: https://${site.name}.vc4.in`;
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
  const generateShortId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      return Array.from(bytes).map(b => chars[b % chars.length]).join('');
    }
  const handleCreateDesign = async () => {
    setLoading(true);
    setError('');
    const payload = {
      Name: `Untitled Design`,
      Tag: '',
      Description: '',
      JsonData: JSON.stringify({ pages: [{ id: 'page-1', elements: [] }] }),
      Thumbnail: null,
    };
    const res = await postWithAuth(`${APIURLS.userWebsite}/createcanvas`, navigate, payload);
    if (res.result && res.data && res.data.id) {
      navigate(`/designeditor/${res.data.id}`);
    } else {
      setError(res.errors ? res.errors.join(', ') : 'Failed to create design.');
    }
    setLoading(false);
  };

  const handleHtmlDesign = async () => {
    setLoading(true);
    setError('');
    const payload = {
      Name: `Untitled-Project-${generateShortId()}`,
      wsType : 1,
      TemplateHtml:'',
      Tag: '',
      Description: '',
      JsonData: JSON.stringify({}),
      Thumbnail: null,
      HTML : '<html><head><title>Untitled Project</title></head><body><div style="display:flex;align-items:center;justify-content:center;height:100vh;"><h1>Welcome to the HTML Editor</h1></div></body></html>',
      PublishStatus: 1
    };
    const res = await postWithAuth(`${APIURLS.userWebsite}/create`, navigate, payload);
    if (res.result && res.data && res.data.id) {
      navigate(`/htmleditor/${res.data.id}`);
    } else {
      setError(res.errors ? res.errors.join(', ') : 'Failed to create design.');
    }
    setLoading(false);
  };

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
      ) : <>
        {/* Sidebar */}
        <aside className="ply-sidebar">
          <div className="ply-sidebar-logo">
            <div className="ply-logo-bars">
              <span></span><span></span><span></span>
            </div>
            <span className="ply-logo-text">ply</span>
          </div>
          <div className="ply-nav-section-label">Workspace</div>
          <nav className="ply-sidebar-nav mb-3">
            <a href="#" className="nav-link active">
              <i className="bi bi-grid-fill" style={{ fontSize: 13 }}></i>
              Projects
            </a>
          </nav>
          <div className="ply-nav-section-label">Quick create</div>
          <nav className="ply-sidebar-nav">
            <a href="#" className="nav-link" onClick={() => setRedirectUrl('/htmleditor')}><span className="ply-nav-dot" style={{ background: '#f87171' }}></span> Visiting card</a>
            <a href="#" className="nav-link" onClick={() => setRedirectUrl('/htmleditor')}><span className="ply-nav-dot" style={{ background: '#60a5fa' }}></span> Link list</a>
            <a href="#" className="nav-link" onClick={handleCreateDesign}><span className="ply-nav-dot" style={{ background: '#a78bfa' }}></span> Design</a>
            <a href="#" className="nav-link" onClick={handleHtmlDesign}><span className="ply-nav-dot" style={{ background: '#34d399' }}></span> HTML page</a>
          </nav>
          <div className="ply-sidebar-footer">
            <div className="ply-user-avatar">RJ</div>
            <span className="ply-user-name">Raj</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ply-main-content">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h1 className="fs-5 fw-500 mb-0" style={{ fontWeight: 500, color: '#111827' }}>My Projects</h1>
            <button className="ply-btn-new">+ New project</button>
          </div>

          {/* Create cards row */}
          <div className="row g-3 mb-4">
            <div className="col-3">
              <a href="javascript:void(0)" className="ply-create-card" onClick={() => setRedirectUrl('/createvcard')}>
                <div className="ply-create-card-icon" style={{ background: '#fff0f0' }}>💼</div>
                <div className="ply-create-card-label">Visiting card</div>
                <div className="ply-create-card-sub">Personal or business card</div>
              </a>
            </div>
            <div className="col-3">
              <a href="javascript:void(0)" className="ply-create-card" onClick={() => setRedirectUrl('/createlinklist')}>
                <div className="ply-create-card-icon" style={{ background: '#eff6ff' }}>🔗</div>
                <div className="ply-create-card-label">Link list</div>
                <div className="ply-create-card-sub">Curated link page</div>
              </a>
            </div>
            <div className="col-3">
              <a href="javascript:void(0)" className="ply-create-card" onClick={handleCreateDesign}>
                <div className="ply-create-card-icon" style={{ background: '#f5f3ff' }}>🎨</div>
                <div className="ply-create-card-label">Design</div>
                <div className="ply-create-card-sub">Visual design project</div>
              </a>
            </div>
            <div className="col-3">
              <a href="javascript:void(0)" className="ply-create-card" onClick={handleHtmlDesign}>
                <div className="ply-create-card-icon" style={{ background: '#f0fdf4' }}>⚡</div>
                <div className="ply-create-card-label">HTML page</div>
                <div className="ply-create-card-sub">Custom web page</div>
              </a>
            </div>
          </div>

          {/* Projects section header */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>My projects</span>
            <div className="d-flex gap-1">
              <button className={`ply-filter-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`ply-filter-tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>Active</button>
              <button className={`ply-filter-tab${filter === 'inactive' ? ' active' : ''}`} onClick={() => setFilter('inactive')}>Inactive</button>
            </div>
          </div>

          {/* Project cards */}
          <div className="row g-3">
            {filteredDesigns.length === 0 && <div className="text-center text-muted">No projects found.</div>}
            {filteredDesigns.map((site, index) => (
              <div className="col-6" key={index}>
                <div className="ply-project-card">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="ply-project-icon" style={{ background: site.wsType === 9 ? '#ede9fe' : '#fef3c7' }}>{site.wsType === 9 ? '🎨' : '💼'}</div>
                      <div>
                        <div className="ply-project-title">{site.name || 'Untitled Project'}</div>
                        <div className="ply-project-type">{site.wsType === 9 ? 'Design project' : (site.wsType === 1 ? 'HTML Page' : 'No type set')}</div>
                      </div>
                    </div>
                    <span className={site.status === 0 ? 'ply-badge-active' : 'ply-badge-inactive'}>{site.status === 0 ? 'Active' : 'Inactive'}</span>
                  </div>
                  <hr className="ply-card-divider" />
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="ply-card-date">Modified {site.modified ? new Date(site.modified).toLocaleDateString() : '-'}</span>
                    <div className="d-flex gap-1">
                      {site.wsType === 1 || site.wsType === 2 ? (
                        <a
                          rel="noreferrer"
                          href={`https://www.webstats.co.in/report?id=${site.webstatsId}`}
                          target="_blank"
                          className="ply-btn-action"
                        >
                          Report
                        </a>
                      ) : null}
                      <button className="ply-btn-action" onClick={() => handleShare(site)}>Share</button>
                      <button className="ply-btn-action" onClick={() => {
                        if (site.wsType === 1) {
                          setRedirectUrl(`/editcard/${site.id}`);
                        } else if (site.wsType === 2) {
                          setRedirectUrl(`/editlinklist/${site.id}`);
                        } else if (site.wsType === 9) {
                          setRedirectUrl(`/designeditor/${site.id}`);
                        }
                      }}>Edit</button>
                      <button className="ply-btn-action danger" onClick={() => handleDelete(site.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && <Loader />}
          {error && <div className="text-danger text-center my-2">{error}</div>}
        </main>
        {/* Share Modal remains unchanged */}
        <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Share Your Site</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-column gap-2">
              <Button className='mb-2' variant="success" onClick={() => shareVia('whatsapp')}>WhatsApp</Button>
              <Button className='mb-2' variant="primary" onClick={() => shareVia('facebook')}>Facebook</Button>
              <Button className='mb-2' variant="info" onClick={() => shareVia('linkedin')}>LinkedIn</Button>
              <Button className='mb-2' variant="secondary" onClick={() => shareVia('twitter')}>Twitter</Button>
              <Button className='mb-2' variant="warning" onClick={() => shareVia('sms')}>SMS</Button>
              <Button className='mb-2' variant="dark" onClick={() => shareVia('email')}>Email</Button>
            </div>
            <div className="mt-3">
              <small>Link to share: <b>{shareSite ? `https://${shareSite.name}.vc4.in` : ''}</b></small>
              <br />
              <small>Message: <b>{shareSite ? getShareText(shareSite) : ''}</b></small>
            </div>
          </Modal.Body>
        </Modal>
      </>}
    </>
  );
}

export default Home;
