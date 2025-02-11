import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerFilterPerformance.css";

const FilterPerformancePage = () => {
  const [courseName, setCourseName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const managerId = localStorage.getItem("user_id");

  const fetchPerformanceData = async () => {
    if (!managerId) {
      setError("Manager ID is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    let queryParams = new URLSearchParams();
    queryParams.append("manager_id", managerId);

    if (courseName) queryParams.append("course", courseName.trim());
    if (startDate) queryParams.append("start_date", new Date(startDate).toISOString().split("T")[0]);
    if (endDate) queryParams.append("end_date", new Date(endDate).toISOString().split("T")[0]);

    const apiUrl = `http://localhost:5000/api/manager/performance?${queryParams.toString()}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setPerformanceData(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(`Failed to fetch data. Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackButtonClick = () => {
    navigate('/manager-dashboard');
  };

  return (
    <div className="filter-performance-page">
      <div className="filter-header">
        <h1>Filter Performance</h1>
        <button className="back-button" onClick={handleBackButtonClick}>Back</button>
      </div>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Course Name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="input-field"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-field"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input-field"
        />
        <button className="apply-button" onClick={fetchPerformanceData}>Apply Filter</button>
      </div>

      {loading && <div className="loading-spinner"></div>}
      {error && <p className="error">{error}</p>}

      {performanceData.length > 0 ? (
        <div className="performance-cards">
          {performanceData.map((course, index) => (
            <div key={index} className="performance-card">
              <h3>{course.course_name || "N/A"}</h3>
              <p><strong>Description:</strong> {course.description || "No description available."}</p>
              <p><strong>Start Date:</strong> {course.start_date || "N/A"}</p>
              <p><strong>End Date:</strong> {course.end_date || "N/A"}</p>
              <p><strong>Enrollment Count:</strong> {course.enrollment_count || 0}</p>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p>No results found.</p>
      )}
    </div>
  );
};

export default FilterPerformancePage;
