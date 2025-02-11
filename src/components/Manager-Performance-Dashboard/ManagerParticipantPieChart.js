import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useNavigate} from 'react-router-dom';
import "./ManagerParticipantPieChart.css";

ChartJS.register(ArcElement, Tooltip, Legend);

const ParticipantPieChartPage = () => {
  const [participantData, setParticipantData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const managerId = localStorage.getItem("user_id"); // Retrieve manager_id from localStorage
  const navigate = useNavigate(); // Use React Router's navigate

  useEffect(() => {
    const fetchParticipantCourseStatus = async () => {
      if (!managerId) {
        setError("Manager ID is missing. Please log in again.");
        return;
      }

      setLoading(true);
      setError(null);

      const apiUrl = `http://localhost:5000/api/manager/participants/course-status?manager_id=${managerId}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("✅ API Response:", data);

        setParticipantData(data);
      } catch (error) {
        console.error("❌ Error fetching participants' course status:", error);
        setError(`Failed to fetch data. Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantCourseStatus();
  }, [managerId]); // Depend on managerId to re-fetch data if it changes

  const handleBackButtonClick = () => {
    navigate('/manager-dashboard');
  };

  return (
    <div className="participant-piechart-page">
      <h1>Active vs Completed Courses</h1>
      <button className="user-progress-page-back-button" onClick={handleBackButtonClick}>
          Back
        </button>
      {loading && <p>Loading participant data...</p>}
      {error && <p className="error">{error}</p>}
      {participantData.length > 0 ? (
        <div className="participant-grid">
          {participantData.map((participant, index) => (
            <ParticipantPieChart key={index} participant={participant} />
          ))}
        </div>
      ) : (
        !loading && <p>No participant data available</p>
      )}
    </div>
  );
};

const ParticipantPieChart = ({ participant }) => {
  const activeCount = participant.active_courses ? participant.active_courses.length : 0;
  const completedCount = participant.completed_courses ? participant.completed_courses.length : 0;

  const data = {
    labels: ["Active Courses", "Completed Courses"],
    datasets: [
      {
        data: [activeCount, completedCount],
        backgroundColor: ["#007bff", "#28a745"],
        hoverBackgroundColor: ["#0056b3", "#218838"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="participant-card">
      <h3>{participant.name}</h3>
      <Pie data={data} options={options} />
      <div className="course-count">
        <p>Completed: <strong>{completedCount}</strong></p>
        <p>Active: <strong>{activeCount}</strong></p>
      </div>
    </div>
  );
};

export default ParticipantPieChartPage;
