import React, { useEffect } from 'react';
import Navbar from "./components/Navbar";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";


import './App.css';

import Table from './pages/displayTable';
import Home from './pages/home';

function App() {
    useEffect(() => {
      document.title = "Joel's portal"; // Set the title
    }, []); // Run only once after initial render

//function App() {
  return (
    <Router>
        <Navbar />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/displayTable/:table_name" element={<Table />} />
        </Routes>
    </Router>
);
}

export default App;
