import Navbar from "./components/Navbar";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";


import './App.css';

import Table from './pages/displayTable';

function App() {
  return (
    <Router>
        <Navbar />
        <Routes>
            <Route path="/displayTable/:table_name" element={<Table />} />
        </Routes>
    </Router>
);
}

export default App;
