import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './DepartmentManagementPage.css';

const DepartmentManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || 'hr';

  // State for departments, search query, and error message
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/departments');
        setDepartments(response.data || []);
        setFilteredDepartments(response.data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Failed to fetch departments.');
      }
    };

    fetchDepartments();
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  
    // Filter departments based on search query
    if (query) {
      const filtered = departments.filter((department) =>
        (department.department_name?.toLowerCase().includes(query) || 
        department.manager_name?.toLowerCase().includes(query))
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  };
  
  // Handle "Create Department"
  const handleCreateDepartment = () => {
    navigate('/create-department', { state: { userType } });
  };


  // Handle "Change Manager"
  const handleChangeManager = (departmentId) => {
    navigate(`/change-manager`, { state: {  departmentId,userType } });
  };

  // Handle "Change Participants"
  const handleChangeParticipants = (departmentId) => {
    navigate(`/change-participants`, { state: { departmentId,userType } });
  };

  // Handle "Delete Department"
  const handleDeleteDepartment = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/departments/${departmentId}`);

        setDepartments(departments.filter((department) => department.department_id !== departmentId));
        setFilteredDepartments(filteredDepartments.filter((department) => department.department_id !== departmentId));
        alert('Department deleted successfully');
      } catch (err) {
        console.error('Error deleting department:', err);
        setError('Failed to delete the department.');
      }
    }
  };

  // Back button handler
  const handleBack = () => {
    navigate(userType === 'hr' ? '/hr-dashboard' : '/instructor-dashboard');
  };

  return (
    <div className="department-management-page-container">
      <h1 className="department-management-page-header">Department Management</h1>
      <button className="department-management-page-back-button" onClick={handleBack}>Back</button>

      {/* Search Bar */}
      <div className="department-management-page-search-container">
        <input 
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search departments..."
          className="department-management-page-search-input"
        />
      </div>
      <div className="department-management-page-create-button-container">
      <button onClick={handleCreateDepartment} className="department-management-page-create-button">Create New Department</button>
    </div>
      {error && <div className="department-management-page-error-message">{error}</div>}

      {filteredDepartments.length === 0 ? (
        <p>No departments available.</p>
      ) : (
        <div className="department-management-page-departments-grid">
          {filteredDepartments.map((department) => (
            <div key={department.department_id} className="department-management-page-department-card">
              <h2>{department.department_name}</h2>
              <p><strong>Manager:</strong> {department.manager_name}</p>
              <p><strong>Participants:</strong> {department.participants_count}</p>
              <div className="department-management-page-button-row">
                <button onClick={() => handleChangeManager(department.department_id)} className="department-management-page-blue-button">Change Manager</button>
                <button onClick={() => handleChangeParticipants(department.department_id)} className="department-management-page-blue-button">Change Participants</button>
                <button onClick={() => handleDeleteDepartment(department.department_id)} className="department-management-page-red-button">Delete Department</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentManagementPage;
