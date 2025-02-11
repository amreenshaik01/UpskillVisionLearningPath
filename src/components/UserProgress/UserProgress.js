import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Bar } from 'react-chartjs-2';
import './UserProgress.css';
import { useParams } from 'react-router-dom';
import { useNavigate,useLocation } from 'react-router-dom'; // For navigation



import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function UserProgress() {
  const { courseId,userId } = useParams(); // Retrieve courseId from the route
  const [courseName, setCourseName] = useState(''); // State for course name
  const [progressData, setProgressData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Use React Router's navigate
  const location = useLocation();
  const userType = location.state?.userType || "hr";


  useEffect(() => {
    if (!courseId) {
      console.error("Course ID is undefined.");
      setLoading(false);
      return;
    }

    if (!userId) {
      setError("User ID not provided.");
      setLoading(false);
      return;
    }
    const fetchUserProgress = async () => {
      try {
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourseName(courseResponse.data.course_name);
        const response = await axios.get(`http://localhost:5000/api/progress/user/${userId}`);
        setProgressData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user progress:', error);
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [courseId,userId]);

  const renderQuizPerformanceChart = (item) => {
    const data = {
      labels: ['Correct', 'Incorrect', 'Skipped'],
      datasets: [
        {
          label: 'Quiz Performance',
          data: [item.correct_answers, item.incorrect_answers, item.skipped_answers],
          backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
    };

    return <Bar data={data} options={options} />;
  };

  if (loading) return <p>Loading progress...</p>;
  if (error) return <div className="error">Error: {error}</div>;


  const handleBackButtonClick = () => {
    navigate(
      userType === "hr" 
        ? "/hr-dashboard" 
        : userType === "manager" 
        ? "/manager-dashboard" 
        : userType === "instructor" 
        ? "/instructor-dashboard" 
        : "/participant-dashboard"
    );
      };

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

<h1 className="user-progress-header">Progress for {courseName}</h1>

    <div>
      {progressData.length === 0 ? (
        <p>No progress data available.</p>
      ) : (
        <div className="user-progress-container">
          {progressData.map((item, index) => (
            <div key={index} className="user-progress-module-card">
              <h2 className="user-progress-module-title">{item.module_title}</h2>
              <div className="user-progress-section">
                <p>Completion Status:</p>
                <CircularProgressbar
                  value={item.completion_status}
                  text={`${item.completion_status}%`}
                  styles={buildStyles({
                    textColor: '#4CAF50',
                    textSize:'14px',
                    pathColor: '#4CAF50',
                    trailColor: '#d6d6d6',
                  })}
                />
              </div>

              <div className="user-progress-quiz-section">
                <p>Quiz Performance:</p>
                <div className="chart-container">{renderQuizPerformanceChart(item)}</div>
              </div>

              <div className="user-progress-details-section">
                <p>Resources Completed: {item.resources_completed || 0}</p>
                <p>Quiz Score: {item.quiz_score || 0}</p>
                <p>Quiz Status: {item.pass_fail_status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="user-progress-back-button" onClick={handleBackButtonClick}>
                Back
              </button>
    </div>
    </div>
  );
}

export default UserProgress;
