import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex items-center relative">
        <Link to="/" className="text-xl font-bold absolute left-0">
          Hobby Portal
        </Link>

        {/* Pages */}
        <ul className="flex space-x-4 mx-auto">
          <li>
            <Link to="/vn" className="hover:text-blue-200">
              Visual Novels
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-blue-200">
              Contact
            </Link>
          </li>
        </ul>
        
        
      </div>
    </nav>
  );
};

export default Navbar;