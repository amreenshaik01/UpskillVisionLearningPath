import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './HR-Dashboard.css';
import Logout from '../Logout/Logout';

const HRdashboard = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState('');
  const [showApprovalSection, setShowApprovalSection] = useState(false);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/users/pending');
        setPendingUsers(response.data.pending_users || []);
      } catch (err) {
        console.error('Error fetching pending users:', err);
        setError('Failed to fetch pending users.');
      }
    };
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/users/approve/${userId}`);
      alert('User approved successfully');
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>HR Dashboard</h2>
        <ul className="sidebar-menu">
          <li onClick={() => setShowApprovalSection(!showApprovalSection)}>
            {showApprovalSection ? 'Hide User Approvals' : 'Approve Users'}
          </li>
          <li onClick={() => navigate('/user-role-management', { state: { userType: 'hr' } })}>User Role Management</li>

          <li onClick={() => navigate('/course-list', { state: { userType: 'hr' } })}>View Courses List</li>
          <li>
            <Link to="/Courses" state={{ userType: "hr" }}>Create Course</Link>
          </li>
          <li onClick={() => navigate('/course-edit', { state: { userType: 'hr' } })}>Edit Course</li>
          <li onClick={() => navigate('/department-management-page', { state: { userType: 'hr' } })}>Manage Department</li>
        </ul>
        <Logout />
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <h1>Welcome, HR!</h1>
        </header>

        {/* User Approval Section */}
        {showApprovalSection && (
          <section className="pending-users-section">
            <h2>Users Awaiting Approval</h2>
            {error && <div className="error-message">{error}</div>}
            {pendingUsers.length === 0 ? (
              <p className="no-users">No users awaiting approval.</p>
            ) : (
              <div className="user-card-container">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h3>{user.first_name} {user.last_name}</h3>
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <span className="role-badge">{user.role_name || "N/A"}</span>
                    </div>
                    <button className="approve-button" onClick={() => handleApprove(user.id)}>✅ Approve</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* HR Performance Sections */}
        <section className="hr-performance-section">
          <div className="hr-buttons-container">
            <div className="hr-button-box">
              <h3>User Performance</h3>
              <button className="view-button" onClick={() => navigate('/hr-performance-dashboard', { state: { userType: 'hr' } })}>View</button>
            </div>
            <div className="hr-button-box">
              <h3>Filter Performance</h3>
              <button className="view-button" onClick={() => navigate('/hr-filter-performance', { state: { userType: 'hr' } })}>View</button>
            </div>
          </div>
          <div className="hr-buttons-container">
            <div className="hr-button-box">
              <h3>Leaderboard</h3>
              <button className="view-button" onClick={() => navigate('/hr-leaderboard-page', { state: { userType: 'hr' } })}>View</button>
            </div>
            <div className="hr-button-box">
              <h3>Active Vs Completed</h3>
              <button className="view-button" onClick={() => navigate('/hr-participant-pie-chart', { state: { userType: 'hr' } })}>View</button>
            </div>
            <div className="hr-button-box">
              <h3>Course Review</h3>
              <button className="Course Review" onClick={() => navigate('/hr-course-review', { state: { userType: 'hr' } })}>View</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HRdashboard;