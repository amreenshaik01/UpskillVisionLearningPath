import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './ChangeManager.css';

const ChangeManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { departmentId } = location.state || {};

  // State for department and manager list
  const [department, setDepartment] = useState(null);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch departments and managers on component mount
  useEffect(() => {
    const fetchDepartmentsAndManagers = async () => {
      try {
        // Fetch all departments
        const departmentsResponse = await axios.get('http://127.0.0.1:5000/api/departments');
        const departments = departmentsResponse.data;

        // Find the department based on departmentId
        const department = departments.find(dep => dep.department_id === parseInt(departmentId));

        if (department) {
          setDepartment(department);
        } else {
          setError('Department not found.');
          return;
        }

        // Fetch list of available managers (assuming API for fetching users with manager roles)
        const managersResponse = await axios.get('http://127.0.0.1:5000/api/managers');
        setManagers(managersResponse.data);
      } catch (err) {
        console.error('Error fetching departments or managers:', err);
        setError('Failed to fetch departments or managers.');
      }
    };

    fetchDepartmentsAndManagers();
  }, [departmentId]);

  // Handle manager selection change
  const handleManagerChange = (e) => {
    setSelectedManager(e.target.value);
  };

  // Handle form submission to update manager
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedManager) {
      setError('Please select a manager.');
      return;
    }

    try {
      // Make API call to update the manager for the department
      await axios.put(`http://127.0.0.1:5000/api/departments/${departmentId}/change-manager`, {
        manager_id: selectedManager,
      });

      alert('Manager updated successfully.');
      navigate("/department-management-page");
      setError('');
      setSelectedManager(''); // Reset selected manager after success
    } catch (err) {
      console.error('Error updating manager:', err);
      setError('Failed to update the manager.');
      setSuccessMessage('');
    }
  };

  // Back button handler
  const handleBack = () => {
    navigate('/department-management-page');
  };

  return (
    <div className="change-manager-page-container">
      <h1 className="change-manager-page-header">Change Department Manager</h1>
      <button className="change-manager-page-back-button" onClick={handleBack}>← Back</button>

      {error && <div className="change-manager-page-error-message">{error}</div>}
      {successMessage && <div className="change-manager-page-success-message">{successMessage}</div>}

      {department && (
        <div className="change-manager-page-form">
          <h2>{department.department_name}</h2>
          {/* Assuming current manager info is stored in the department response */}
          <p><strong>Current Manager:</strong> {department.manager_name}</p>

          <form onSubmit={handleSubmit}>
            <div className="change-manager-page-form-group">
              <label htmlFor="manager">Select New Manager</label>
              <select
                id="manager"
                value={selectedManager}
                onChange={handleManagerChange}
                className="change-manager-page-select"
              >
                <option value="">Select a Manager</option>
                {managers.map((manager) => (
                  <option key={manager.user_id} value={manager.user_id}>
                    {manager.first_name} {manager.last_name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="change-manager-page-submit-button">Update Manager</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChangeManager;
