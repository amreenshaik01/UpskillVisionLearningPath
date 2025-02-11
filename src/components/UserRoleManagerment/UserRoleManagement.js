import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserRoleManagement.css'; // Ensure this import is here
import {useNavigate, useLocation } from 'react-router-dom'; // For navigation


function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Use React Router's navigate
  const location = useLocation();
  const userType = location.state?.userType || "hr";

  // Fetch users and roles on initial load
  useEffect(() => {
    // Fetch users
    axios.get('http://localhost:5000/api/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });

    // Fetch roles
    axios.get('http://localhost:5000/api/roles')
      .then(response => {
        setRoles(response.data);
      })
      .catch(error => {
        console.error('Error fetching roles:', error);
      });
  }, []);

  // Handle user selection
  const handleUserSelection = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);

    // Fetch the user's current role
    if (userId) {
      axios.get(`http://localhost:5000/api/users/${userId}`)
        .then(response => {
          setCurrentRole(response.data.role_name || 'No Role');
        })
        .catch(error => {
          console.error('Error fetching user role:', error);
        });
    } else {
      setCurrentRole('');
    }
  };

  // Handle role change
  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  // Update user role via API
  const updateRole = () => {
    if (!selectedUser || !selectedRole) {
      setMessage('Please select both a user and a role');
      return;
    }

    // Store the original current role (do not change it immediately)
    const originalRole = currentRole;

    axios.put(`http://localhost:5000/api/users/${selectedUser}/role`, { role_id: selectedRole })
      .then(response => {
        // Keep the original role in the message, do not change currentRole yet
        setMessage(`User role updated successfully: ${originalRole} → ${response.data.new_role}`);
        
        // Optionally, you could update `currentRole` when the page is refreshed or when explicitly fetching the updated user.
      })
      .catch(error => {
        console.error('Error updating role:', error);
        setMessage('Failed to update role');
      });
  };

  const handleBackButtonClick = () => {
    navigate(userType === "hr" ? "/hr-dashboard" : "/participant-dashboard");
  };

  return (
    <div className="UserRoleManagement">
      <h1>Update User Role</h1>

      <button className="user-role-management-back-button" onClick={handleBackButtonClick}>
          Back
        </button>

      <div>
        <label htmlFor="user">Select User:</label>
        <select id="user" onChange={handleUserSelection}>
          <option value="">--Select a user--</option>
          {users.map(user => (
            <option key={user.user_id} value={user.user_id}>
              {user.first_name} {user.last_name} ({user.username})
            </option>
          ))}
        </select>
      </div>

      {currentRole && (
        <div>
          <p>Current Role: {currentRole}</p>
        </div>
      )}

      <div>
        <label htmlFor="role">Select Role:</label>
        <select id="role" onChange={handleRoleChange} disabled={!selectedUser}>
          <option value="">--Select a role--</option>
          {roles.map(role => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>

      <button className="submit-button" onClick={updateRole} disabled={!selectedUser || !selectedRole}>
        Update Role
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default UserRoleManagement;
