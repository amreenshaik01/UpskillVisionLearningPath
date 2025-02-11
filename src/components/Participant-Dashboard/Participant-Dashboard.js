import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Participant-Dashboard.css'; // Separate CSS file for Participant Dashboard
import Logout from '../Logout/Logout';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null); // State for dynamic user ID

  // Fetch userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(Number(storedUserId)); // Convert to number if needed
    } else {
      console.error('User ID not found in localStorage.');
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 style={{ color: "white" }}>Participant Dashboard</h2>
        <ul className="sidebar-menu">
          <li onClick={() => navigate('/user-course-list')}>Courses List</li>
          <li onClick={() => navigate('/enrolled')}>Enrolled</li>
          <li onClick={() => navigate('/unenrolled')}>Not Enrolled</li>
          <li onClick={() => navigate('/completed')}>Completed</li>
          <li onClick={() => navigate(`/user-progress-page/${userId}`,{ state: { userType: 'participant' } })}>Progress-Overview</li>
        </ul>
        <Logout />
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1 style={{ color: "black"}}>Welcome, Participant!</h1>
        </header>


      </div>
    </div>
  );
};

export default ParticipantDashboard;