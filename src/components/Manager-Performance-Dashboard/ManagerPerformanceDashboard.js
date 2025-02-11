import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ManagerPerformanceDashboard.css';

const PerformanceDashboardManager = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // Use React Router's navigate
  const location = useLocation();
  const userType = location.state?.userType || "hr"; // Default to "hr" if not provided

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Retrieve user_id and role_id dynamically from localStorage
        const userId = localStorage.getItem('user_id'); // Ensure it's stored on login
        const roleId = localStorage.getItem('role_id'); // Ensure it's stored on login

        if (!userId || !roleId) {
          console.error("User is not authenticated");
          return;
        }

        const response = await axios.get('http://localhost:5000/api/manager/users', {
          params: {
            user_id: userId,  // Pass dynamic user_id
            role_id: roleId   // Pass dynamic role_id
          }
        });

        // Ensure the response is an array and set it to the state
    const usersData = Array.isArray(response.data.users) ? response.data.users : [];
    setUsers(usersData);
    setFilteredUsers(usersData);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching users:', error);
    setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleUserClick = (userId) => {
    navigate(`/user-progress-page/${userId}`, { state: { userType: 'manager' } }); // Navigate to the user progress page
  };

  const handleBackButtonClick = () => {
    navigate(userType === 'hr' ? '/hr-dashboard' : (userType === 'instructor' ? '/instructor-dashboard' : '/manager-dashboard'));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Filter users based on the search term
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(value.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  if (loading) return <div>Loading enrolled courses...</div>;

  return (
    <div
      style={{
        background: 'linear-gradient(to right, #6a11cb, #2575fc)',
        backgroundImage: 'url("3.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        padding: '20px',
        minHeight: '100vh',
        color: '#fff',
      }}
    >
      <h2 className="user-progress-page-header" style={{ textAlign: 'center', marginBottom: '20px' }}>Progress Page</h2>

      {/* Search Bar */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            padding: '10px',
            width: '80%',
            maxWidth: '500px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '16px',
            backgroundColor: '#f7f7f7',
            marginBottom: '20px',
            transition: 'border-color 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        <button className="user-progress-page-back-button" onClick={handleBackButtonClick}>
          Back
        </button>

        {filteredUsers.map((user) => (
          <div
            key={user.user_id}
            style={{
              margin: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              padding: '20px',
              width: '300px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '20px' }}>
              {user.username || 'No User'}
            </h3>
            <p style={{ margin: '10px 0', color: '#666', fontSize: '16px' }}>
              <strong> {user.first_name || 'No first name'} {user.last_name || 'No last name'}</strong>
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Email:</strong> {user.email || 'No email'}
            </p>
            <button
              style={{
                marginTop: '10px',
                padding: '10px 15px',
                border: 'none',
                backgroundColor: '#6a11cb',
                color: '#fff',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
              onClick={() => handleUserClick(user.user_id)}
            >
              View Progress
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceDashboardManager;
