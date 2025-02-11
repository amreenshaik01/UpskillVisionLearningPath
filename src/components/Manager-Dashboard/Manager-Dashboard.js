import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Manager-Dashboard.css'; // Updated file name
import Logout from '../Logout/Logout';

const ManagerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Manager Dashboard</h2>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/course-list', { state: { userType: 'manager' } })}>
            View Courses List
          </li>   
          <li onClick={() => navigate('/department-management', { state: { userType: 'manager' } })}>
            View Department
          </li>
        </ul>
        <Logout />
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1>Welcome, Manager!</h1>
        </header>

        {/* Manager Performance Sections */}
        <section className="manager-performance-section">
          <div className="manager-buttons-container">
            <div className="manager-button-box">
              <h3>Performance Dashboard</h3>
              <button className="view-button" onClick={() => navigate('/manager-performance-dashboard', { state: { userType: 'manager' } })}>View</button>
            </div>
            <div className="manager-button-box">
              <h3>Filter Performance</h3>
              <button className="view-button" onClick={() => navigate('/manager-filter-performance', { state: { userType: 'manager' } })}>View</button>
            </div>
          </div>
          <div className="manager-buttons-container">
            <div className="manager-button-box">
              <h3>Leaderboard</h3>
              <button className="view-button" onClick={() => navigate('/manager-leaderboard-page', { state: { userType: 'manager' } })}>View</button>
            </div>
            <div className="manager-button-box">
              <h3>Participant PieChart</h3>
              <button className="view-button" onClick={() => navigate('/manager-participant-pie-chart', { state: { userType: 'manager' } })}>View</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerDashboard;
