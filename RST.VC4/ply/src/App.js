import "./styles/globals.css";
import "./styles/dashboard.css";
import Home from './pages/home';
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import EditCard from "./pages/editcard";
import CreateLinkList from "./pages/createlinklist";
import CreateVCard from "./pages/createvcard";
import EditLinkList from "./pages/editlinklist";
import DesignEditorPage from "./pages/designeditor";

import HtmlEditorPage from "./pages/htmleditorpage";

import WebsiteForm from "./components/WebsiteForm";


function App() {

  return (
    <>
      <Routes>
        <Route exact path='/' element={<Home />} />
        <Route path='/createvcard' element={<CreateVCard />} />
        <Route path='/createlinklist' element={<CreateLinkList />} />
        <Route path='/editcard/:id' element={<EditCard />} />
        <Route path='/editlinklist/:id' element={<EditLinkList />} />
        <Route path='/designeditor' element={<DesignEditorPage />} />
        <Route path='/designeditor/:id' element={<DesignEditorPage />} />
        <Route path='/websiteform' element={<WebsiteForm/>} />
        <Route path="/htmleditor" element={<HtmlEditorPage />} />
        <Route path="/htmleditor/:id" element={<HtmlEditorPage />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
