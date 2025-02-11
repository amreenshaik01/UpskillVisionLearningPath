import React, { useState, useEffect } from 'react';
import './UserCourselist.css';

const Unenrolled = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Retrieve userId from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    } else {
      setError('User not logged in.');
      setLoading(false);
    }
  }, []);

  // Fetch unenrolled courses once userId is available
  useEffect(() => {
    if (!userId) return;

    const fetchCourses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/unenrolled?user_id=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch unenrolled courses');
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          setCourses(data);
        } else {
        
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userId]);

  const handleEnroll = async (courseId) => {
    if (!userId) {
      alert('Please log in first!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: Number(userId), course_id: courseId }),
      });

      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(errorMessage.message || 'Failed to enroll in the course.');
      }

      // Update localStorage
      const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
      const updatedCourse = { courseId, status: 'enroll' };
      const existingIndex = storedCourses.findIndex((c) => c.courseId === courseId);

      if (existingIndex !== -1) {
        storedCourses[existingIndex] = updatedCourse;
      } else {
        storedCourses.push(updatedCourse);
      }

      localStorage.setItem('courses', JSON.stringify(storedCourses));

      // Remove the enrolled course from the courses state
      setCourses((prevCourses) =>
        prevCourses.filter((course) => course.course_id !== courseId)
      );

      alert('Successfully enrolled!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBackButtonClick = () => {
    window.history.back(); // Go to the previous page
  };

  if (loading) return <div>Loading unenrolled courses...</div>;
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
      className="course-list-container"
      style={{
        background: 'linear-gradient(to right, #f12711, #f5af19)', // Gradient background
        backgroundImage: 'url("3.jpg")', // Image background
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Fixed background effect
        padding: '20px',
        minHeight: '100vh',
        color: '#fff', // Ensure text is readable on a dark background
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>Unenrolled Courses</h2>

      <button className="course-edit-page-back-button" onClick={handleBackButtonClick}>
        Back
      </button>

      <div
        className="course-grid"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
        }}
      >
        {courses.map((course) => (
          <div
            key={course.course_id}
            className="course-card"
            style={{
              margin:'20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent card
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
              <strong>Description:</strong>{' '}
              {course.description || 'No description available.'}
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Instructor:</strong>{' '}
              {course.instructor_name || 'Unknown Instructor'}
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>Start Date:</strong>{' '}
              {course.start_date
                ? new Date(course.start_date).toLocaleDateString()
                : 'TBD'}
            </p>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
              <strong>End Date:</strong>{' '}
              {course.end_date
                ? new Date(course.end_date).toLocaleDateString()
                : 'TBD'}
            </p>
            <button
              onClick={() => handleEnroll(course.course_id)}
              className="enroll-button"
            >
              Enroll
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Unenrolled;