import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Instructor-Dashboard.css'; 
import Logout from '../Logout/Logout';

const InstructorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Instructor Dashboard</h2>
        <ul className="sidebar-menu">

          <li onClick={() => navigate('/hr-performance-dashboard', { state: { userType: 'instructor' } })}>
            User Performance
          </li>

          <li onClick={() => navigate('/course-list', { state: { userType: 'instructor' } })}>
            View Courses List
          </li>
          
          <li>
            <Link to="/Courses" state={{ userType: "instructor" }}>
              Create Course
            </Link>
          </li>
          
          <li onClick={() => navigate('/course-edit',{ state: { userType: 'instructor' } })}>
            Edit Course
          </li>
        </ul>
        <Logout />
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1>Welcome, Instructor!</h1>
        </header>

      </div>
    </div>
  );
};

export default InstructorDashboard;