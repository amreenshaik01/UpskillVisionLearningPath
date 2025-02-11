import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HRLeaderboardPage.css";

const HRLeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:5000/api/hr/course-leaderboard");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        setError(`Failed to fetch leaderboard data. ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const handleBackButtonClick = () => navigate("/hr-dashboard");

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
    <div className="hr-leaderboard-page">
      <h1>🏆 HR Course Leaderboard</h1>

      <button className="hr-leaderboard-back-button" onClick={handleBackButtonClick}>
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
        !loading && <p className="no-results">No results found</p>
      )}
    </div>
  );
};

export default HRLeaderboardPage;
