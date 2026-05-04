import PlyNavbar from "../components/plynavbar";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import HtmlTreeEditor from "../components/htmltreeeditor";
import { useEffect, useState, useRef } from "react";
import useScreenSize from "../hooks/useScreenSize";
import { useNavigate, useParams } from "react-router-dom";
import { getWithAuth, postWithAuth } from "../utils/api";
import { APIURLS } from "../utils/config";
import { toast } from "react-toastify";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { Button } from "react-bootstrap";
import WysiwygEditor from "../components/wysiwyg/wysiwygeditor";
import PopulateJson from "../components/populatejson";

// Populates HTML with new JSON data using slot conventions
function bindHtmlWithJson(htmlString, jsonData) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Collect all elements that have data-slot or any data-slot-attr-* attribute
  const allElements = doc.querySelectorAll("*");
  const slotElements = [];

  allElements.forEach(el => {
    if (el.hasAttribute("data-slot")) {
      slotElements.push(el);
    }
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("data-slot-attr-")) {
        slotElements.push(el);
      }
    });
  });

  // Process each slot element
  slotElements.forEach(el => {
    // Case 1: data-slot (text content)
    if (el.hasAttribute("data-slot")) {
      const key = el.getAttribute("data-slot");
      if (jsonData.hasOwnProperty(key)) {
        const value = jsonData[key];
        if (value !== undefined && value !== null && value !== "") {
          el.textContent = value;
        } else {
          el.style.display = "none"; // hide empty
        }
      }
      // If key not in JSON → untouched
    }

    // Case 2: data-slot-attr-* (attribute binding)
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("data-slot-attr-")) {
        const targetAttr = attr.name.replace("data-slot-attr-", "");
        const key = attr.value; // JSON key
        if (jsonData.hasOwnProperty(key)) {
          const value = jsonData[key];
          if (value !== undefined && value !== null && value !== "") {
            el.setAttribute(targetAttr, value);
          } else {
            el.style.display = "none"; // hide empty
          }
        }
        // If key not in JSON → untouched
      }
    });
  });

  // Handle lists (example: Photos)
  if (jsonData.Photos && Array.isArray(jsonData.Photos)) {
    const photoContainer = doc.querySelector("[data-list='Photos']");
    if (photoContainer) {
      photoContainer.innerHTML = ""; // clear existing
      jsonData.Photos.forEach(photo => {
        if (photo.url || photo.title) {
          const div = doc.createElement("div");
          div.innerHTML = `
            <img src="${photo.url || ''}" alt="${photo.title || ''}" />
            <p>${photo.title || ''}</p>
          `;
          photoContainer.appendChild(div);
        }
      });
    }
  }

  return doc.documentElement.outerHTML;
}


export default function HtmlEditorPage() {
    const isMobile = useScreenSize();
    const navigate = useNavigate();
    const params = useParams();
    const id = params.id;
    const [loading, setLoading] = useState(false);
    const [website, setWebsite] = useState(null);
    const [showProjectEditPopup, setShowProjectEditPopup] = useState(false);
    const [showDataEditPopup, setShowDataEditPopup] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const htmlChangeTimer = useRef(null);
    const prevHtmlRef = useRef("");

    useEffect(() => {
        async function fetchSite() {
            setLoading(true);
            var r = await getWithAuth(`${APIURLS.userWebsite}/${id}`, navigate);
            if (r.result) {
                if (r.data) {
                    setWebsite(r.data);
                    prevHtmlRef.current = r.data.output || "";
                }
            } else {
                toast.error(r.errors.join(', '));
            }
            setLoading(false);
        }
        fetchSite();
    }, [id, navigate]);

    const handleSave = async () => {
        try {
            console.log('Saving website data:', website);
            const data = {
                id: website.id,
                name: website.name,
                wsType: website.wsType,
                templateHtml: website.templateHtml,
                jsonData: website.jsonData,
                html: website.output,
                tag: website.tag,
                description: website.description,
                publishStatus: website.publishStatus
            }
                ;
            const response = await postWithAuth(`${APIURLS.userWebsite}/update`, navigate, data);
            if (response.result) {
                toast.success("Changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Failed to save changes:', err.message);
        }
    }

    useEffect(() => {
        if (isDirty) {
            handleSave();
            setIsDirty(false);
            prevHtmlRef.current = website?.output || "";
        }
    }, [isDirty]);

    // Debounced isDirty for HTML changes
    useEffect(() => {
        if (!website) return;
        const currentHtml = website.output || "";
        if (prevHtmlRef.current === currentHtml) return;
        // Clear previous timer
        if (htmlChangeTimer.current) clearTimeout(htmlChangeTimer.current);
        // Start new timer
        htmlChangeTimer.current = setTimeout(() => {
            setIsDirty(true);
        }, 2000); // 2 seconds debounce
        // Cleanup on unmount
        return () => {
            if (htmlChangeTimer.current) clearTimeout(htmlChangeTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [website && website.output]);

    const editProjectButton = <button className="btn btn-sm btn-light ms-2" type="button" onClick={() => setShowProjectEditPopup(true)} >
        <i className="bi bi-pencil"></i>
    </button>;
    return (
        <div>
            <PlyNavbar showLoginPopup={null}>
                <div className="d-flex justify-content-start flex-grow-1 pe-3">
                    {website ? <>
                        {website.name} {editProjectButton}
                    </> : loading ? "Loading..." : <>Untitled Project {editProjectButton}</>}
                    <button className="btn btn-sm btn-light mx-2" type="button" onClick={() => setShowDataEditPopup(true)}>
                        Edit Data
                    </button>
                </div>
            </PlyNavbar>
            <div className="p-2">
                <Tabs
                    defaultActiveKey="html"
                    id="htmleditor-tabs"
                    className="mb-3">
                        <Tab eventKey="html" title="HTML">
                        {website && (<HtmlTreeEditor html={website?.output || ""} onChange={(newHtml) => setWebsite({ ...website, output: newHtml })} />)}
                    </Tab>
                    <Tab eventKey="preview" title="Preview">
                        {website && (<WysiwygEditor html={website?.output || ""} onChange={(newHtml) => setWebsite({ ...website, output: newHtml })} />)}
                    </Tab>
                    
                </Tabs>
            </div>
            {showProjectEditPopup && <Modal show={showProjectEditPopup} onHide={() => setShowProjectEditPopup(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <Form.Label htmlFor="inputProjectName">Name</Form.Label>
                        <Form.Control
                            type="text"
                            id="inputProjectName" minLength={3} maxLength={50} required
                            value={website?.name || ""}
                            onChange={(e) => setWebsite({ ...website, name: e.target.value })}
                            aria-describedby="projectNameHelpBlock"
                        />
                        <Form.Text id="projectNameHelpBlock" muted>
                            Your project name must be 3-50 characters long, contain letters and numbers,
                            and must not contain spaces, special characters, or emoji.
                        </Form.Text>
                    </div>
                    <div className="mb-3">
                        <Form.Label htmlFor="inputProjectDescription">Description</Form.Label>
                        <Form.Control value={website?.description || ""}
                            onChange={(e) => setWebsite({ ...website, description: e.target.value })}
                            id="inputProjectDescription"
                            as="textarea" maxLength={1000} id="inputProjectDescription"></Form.Control>
                    </div>
                    <div className="mb-3">
                        <Form.Label htmlFor="inputProjectKeywords">Keywords</Form.Label>
                        <Form.Control value={website?.keywords || ""}
                            onChange={(e) => setWebsite({ ...website, keywords: e.target.value })}
                            id="inputProjectKeywords"
                            as="textarea" maxLength={500} id="inputProjectKeywords"></Form.Control>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="primary" onClick={() => { setShowProjectEditPopup(false); setIsDirty(true); }}>Save changes</Button>
                </Modal.Footer>
            </Modal>}
            {showDataEditPopup && <Modal scrollable={true} show={showDataEditPopup} onHide={() => setShowDataEditPopup(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Data</Modal.Title>
                </Modal.Header>
                <Modal.Body >
                    <PopulateJson data={JSON.parse(website?.jsonData || '{}')} onChange={(newData) => setWebsite({ ...website, jsonData: JSON.stringify(newData) })} />
                </Modal.Body>
                <Modal.Footer>
                    <Button type="button" variant="primary" onClick={() => { 
                        let newHtml =  bindHtmlWithJson(website.output, JSON.parse(website.jsonData || '{}'));
                        console.log('Json:', website.jsonData);
                        console.log('Generated HTML after filling slots:', newHtml);
                        setWebsite({ ...website, output: newHtml });    
                         setShowDataEditPopup(false); }}>Save changes</Button>
                </Modal.Footer>
            </Modal>}
        </div>
    );
}