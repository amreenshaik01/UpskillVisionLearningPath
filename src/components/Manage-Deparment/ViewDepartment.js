import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewDepartment.css'; // Import CSS file

const DepartmentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');
  const [manager, setManager] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    const roleId = localStorage.getItem('role_id');

    if (!userId || !roleId) {
      setError('User is not logged in or role information is missing');
      setLoading(false);
      return;
    }

    const fetchDepartmentData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/manager/users', {
          params: { user_id: userId, role_id: roleId },
        });

        if (response.data) {
          setDepartment(response.data.department);
          setManager(response.data.manager);
          setUsers(response.data.users || []);
        } else {
          setError('No users found or manager not assigned to any department');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching department data:', error);
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, []);

  if (loading) return <div className="loading">Loading department details...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="department-dashboard">
      {/* Back Button at Top Left */}
      <button className="back-button" onClick={() => navigate('/manager-dashboard')}>
        Back
      </button>

      <h2 className="dashboard-header">Department Dashboard</h2>

      <div className="department-details">
        <h3>Department: {department || 'No Department'}</h3>
        <h4>Manager: {manager || 'No Manager'}</h4>
      </div>

      <div className="user-list">
        <h4>Participants</h4>
        {users.length > 0 ? (
          <div className="user-cards">
            {users.map((user) => (
              <div key={user.user_id} className="user-card">
                <h3>{user.username}</h3>
                <p><strong>{user.first_name} {user.last_name}</strong></p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No users found in this department.</p>
        )}
      </div>
    </div>
  );
};

export default DepartmentDashboard;
