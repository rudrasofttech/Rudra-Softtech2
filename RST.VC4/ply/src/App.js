import "./styles/globals.css";
import Home from './pages/home';
import Create from './pages/create';
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import EditCard from "./pages/editcard";

function App() {

  return (
    <>
      <Routes>
        <Route exact path='/' element={<Home />} />
        <Route path='/create' element={<Create />} />
        <Route path='/editcard/:id' element={<EditCard />} />
      </Routes>
      <ToastContainer />

    </>
  );
}

export default App;
