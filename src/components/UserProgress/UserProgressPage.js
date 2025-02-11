import React, { useState, useEffect } from 'react';
import { useParams,useNavigate, useLocation } from 'react-router-dom'; // For navigation
import './UserProgressPage.css';

const UserProgressPage = () => {
  const { userId } = useParams(); // Retrieve userId from the route
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Use React Router's navigate
  const location = useLocation();
  const userType = location.state?.userType || "hr";


  useEffect(() => {
    if (!userId) {
      setError("User ID not provided.");
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/enroll?user_id=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch enrolled courses');
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setError("No courses found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userId]);

  const handleCourseDetails = (courseId) => {
    navigate(`/user-progress/${courseId}/${userId}`,{ state: { userType } }); // Navigate to course details page
  };

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

  if (loading) return <div>Loading enrolled courses...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  if (courses.length === 0) {
    
    return (
      
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(to right,rgb(81, 102, 208), #2575fc)', // Background gradient
        }}
      >
        <div
          style={{
            backgroundColor: '#fff', // White background for the message box
            padding: '20px 40px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Soft shadow
            textAlign: 'center',
            color: '#333', // Dark text for readability
            fontSize: '24px',
            fontWeight: 'bold',
            width: '300px', // Width for the flexbox container
          }}
        >
          No enrolled courses found
        </div>
      </div>
    );
  }

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
      <h2 className="user-progress-page-header" style={{ textAlign: 'center', marginBottom: '20px' }}>Progress Page</h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        <button className="user-progress-page-back-button" onClick={handleBackButtonClick}>
          Back
        </button>

        {courses.map((course) => (
          <div
            key={course.course_id}
            style={{
              margin:'20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              padding: '20px',
              width: '300px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '20px' }}>
              {course.course_name || 'Untitled Course'}
            </h3>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Description:</strong> {course.description || 'No description available.'}
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Instructor:</strong> {course.instructor_name || 'Unknown Instructor'}
            </p>
            <button
              style={{
                marginTop: '10px',
                padding: '10px 15px',
                border: 'none',
                backgroundColor: '#6a11cb',
                color: '#fff',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
              onClick={() => handleCourseDetails(course.course_id)}
            >
              View Progress
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProgressPage;
