import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerLeaderboardPage.css";

const ManagerLeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const managerId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!managerId) {
      setError("Manager ID is missing. Please log in again.");
      return;
    }

    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);

      const apiUrl = `http://localhost:5000/api/manager/course-leaderboard?manager_id=${managerId}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        setError(`Failed to fetch leaderboard data. Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [managerId]);

  const handleBackButtonClick = () => {
    navigate("/manager-dashboard");
  };

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getInitials = (name) => {
    const nameArray = name.split(" ");
    const initials = nameArray.map((part) => part.charAt(0).toUpperCase()).join("");
    return initials;
  };

  return (
    <div className="course-leaderboard-page">
      <h1>Course Leaderboard</h1>

      <button className="back-button" onClick={handleBackButtonClick}>
        ← Back
      </button>

      {loading && <div className="loading-spinner"></div>}
      {error && <p className="error">{error}</p>}

      {leaderboardData.length > 0 ? (
        <div className="leaderboard-grid">
          {leaderboardData.map((participant, index) => (
            <div key={participant.user_id} className={`leaderboard-card rank-${index + 1}`}>
              <div className="rank-badge">{getMedal(index + 1)}</div>
              <div className="leaderboard-info">
                <div className="avatar">{getInitials(participant.name)}</div>
                <h2>{participant.name}</h2>
                <p>Completed Courses: <strong>{participant.completed_courses_count}</strong></p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="no-results">No participants found in your department.</p>
      )}
    </div>
  );
};

export default ManagerLeaderboardPage;
