import logo from './logo.svg';
import Navbar from "./components/Navbar";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";


import './App.css';

//import Home from './pages';

import Table from './pages/table';

function App() {
  return (
    <Router>
        <Navbar />
        <Routes>
            <Route path="/Table" element={<Table />} />
        </Routes>
    </Router>
);
}

export default App;
