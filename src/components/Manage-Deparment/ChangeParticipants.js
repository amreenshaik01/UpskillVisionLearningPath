import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./ChangeParticipants.css";

const ManageDepartmentParticipants = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [manager, setManager] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [departmentParticipants, setDepartmentParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    fetchDepartments();
    fetchAllParticipants();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/departments");
      setDepartments(res.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchAllParticipants = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/participants");
      setAllParticipants(res.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const fetchDepartmentParticipants = async (departmentId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/departments/${departmentId}/participants`);
      setDepartmentParticipants(res.data);
      fetchManagerOfDepartment(departmentId);
    } catch (error) {
      console.error("Error fetching department participants:", error);
    }
  };

  const fetchManagerOfDepartment = async (departmentId) => {
    try {
      const department = departments.find(dep => dep.department_id === departmentId);
      if (department) {
        const managerRes = await axios.get(`http://localhost:5000/api/users/${department.manager_id}`);
        setManager(managerRes.data);
      }
    } catch (error) {
      console.error("Error fetching department manager:", error);
    }
  };

  const handleAddParticipants = async () => {
    if (!selectedDepartment) {
      alert("Please select a department first.");
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/departments/${selectedDepartment}/participants`, {
        participant_ids: selectedParticipants,
      });
      alert("Participants added successfully!");
      fetchDepartmentParticipants(selectedDepartment);
      setSelectedParticipants([]);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error adding participants:", error);
      alert("Failed to add participants.");
    }
  };

  const handleCheckboxChange = (event, participantId) => {
    const isChecked = event.target.checked;
    setSelectedParticipants(prevState => 
      isChecked ? [...prevState, participantId] : prevState.filter(id => id !== participantId)
    );
  };

  const handleRemoveParticipant = async (participantId) => {
    try {
      await axios.delete(`http://localhost:5000/api/departments/${selectedDepartment}/participants/${participantId}`);
      alert("Participant removed successfully!");
      fetchDepartmentParticipants(selectedDepartment);
    } catch (error) {
      console.error("Error removing participant:", error);
      alert("Failed to remove participant.");
    }
  };

  // Back button handler
  const handleBack = () => {
    navigate('/department-management-page');
  };

  return (
    <div className="container mx-auto p-4">
      <h3 className="text-xl font-bold mb-4">Manage Department Participants</h3>
      <button className="change-manager-page-back-button" onClick={handleBack}>Back</button>
      <select
        className="border p-2 w-full mb-4"
        value={selectedDepartment}
        onChange={(e) => {
          const deptId = e.target.value;
          setSelectedDepartment(deptId);
          if (deptId) {
            fetchDepartmentParticipants(deptId);
          }
        }}
      >
        <option value="">Select Department</option>
        {departments.map((department) => (
          <option key={department.department_id} value={department.department_id}>
            {department.department_name}
          </option> 
        ))}
      </select>
      {selectedDepartment && manager && (
        <div className="manager-info">
          <h4>Manager: {manager.first_name} {manager.last_name}</h4>
        </div>
      )}
      {selectedDepartment && (
        <div className="participant-container flex space-x-8">
          {/* Current Participants */}
          <div className="participant-column w-1/2">
            <h3 className="text-xl font-bold mb-4">Current Participants</h3>
            <div className="table-container">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b px-4 py-2">Name</th>
                    <th className="border-b px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentParticipants.map((participant) => (
                    <tr key={participant.user_id}>
                      <td className="border-b px-4 py-2">{participant.first_name} {participant.last_name}</td>
                      <td className="border-b px-4 py-2">
                        <button
                          onClick={() => handleRemoveParticipant(participant.user_id)}
                          className="bg-red-500 text-white p-2 rounded"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Available Participants */}
          <div className="participant-column w-1/2">
            <h3 className="text-xl font-bold mb-4">Available Participants</h3>
            <div className="dropdown-container">
              <button className="dropdown-button bg-blue-500 text-white p-2 rounded" onClick={() => setDropdownOpen(!dropdownOpen)}>
                Select Participants
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {allParticipants.map((participant) => (
                    <div key={participant.user_id} className="dropdown-item flex items-center p-2">
                      <input
                        type="checkbox"
                        id={`participant-${participant.user_id}`}
                        checked={selectedParticipants.includes(participant.user_id)}
                        onChange={(e) => handleCheckboxChange(e, participant.user_id)}
                      />
                      <label className="ml-2" htmlFor={`participant-${participant.user_id}`}>
                        {participant.first_name} {participant.last_name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      )}
      <button onClick={handleAddParticipants} className="bg-green-500 text-white p-2 rounded mt-4">
              Add Selected Participants
            </button>
    </div>
  );
};

export default ManageDepartmentParticipants;
