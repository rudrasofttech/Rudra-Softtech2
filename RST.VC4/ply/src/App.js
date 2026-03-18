import "./styles/globals.css";
import Home from './pages/home';
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import EditCard from "./pages/editcard";
import CreateLinkList from "./pages/createlinklist";
import CreateVCard from "./pages/createvcard";
import EditLinkList from "./pages/editlinklist";
import Editor from "./components/editor";
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
        <Route path='/editor' element={<Editor />} />
        <Route path='/websiteform' element={<WebsiteForm/>} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
