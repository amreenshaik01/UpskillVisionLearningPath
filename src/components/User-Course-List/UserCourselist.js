import React, { useState, useEffect } from 'react';
import './UserCourselist.css';

const UserCourselist = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null); // To store the userId dynamically

  useEffect(() => {
    // Retrieve user_id from localStorage
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }

    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();

        // Sync localStorage with server data
        const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
        const syncedCourses = data.map((course) => {
          const storedCourse = storedCourses.find(
            (c) => c.courseId === course.course_id
          );

          if (storedCourse) {
            if (storedCourse.status === 'enroll') {
              course.enrolled = true;
            } else if (storedCourse.status === 'complete') {
              course.completed = true;
            }
          }
          return course;
        });

        // Update localStorage with the latest data from the server
        localStorage.setItem(
          'courses',
          JSON.stringify(
            syncedCourses
              .map((course) => ({
                courseId: course.course_id,
                status: course.completed
                  ? 'complete'
                  : course.enrolled
                  ? 'enroll'
                  : null,
              }))
              .filter((c) => c.status) // Filter out null statuses
          )
        );

        setCourses(syncedCourses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleAction = async (endpoint, courseId) => {
    if (!userId) {
      setError('User ID not found. Please log in first.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, user_id: userId }),
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.message || `${endpoint} failed`);
      }

      const updatedStatus = endpoint === 'enroll' ? 'enroll' : endpoint === 'complete' ? 'complete' : null;

      // Update the course state and localStorage
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.course_id === courseId
            ? {
                ...course,
                enrolled: endpoint === 'enroll',
                completed: endpoint === 'complete',
              }
            : course
        )
      );

      // Update localStorage with the new status
      const storedCourses = JSON.parse(localStorage.getItem('courses')) || [];
      const existingIndex = storedCourses.findIndex((c) => c.courseId === courseId);

      if (updatedStatus) {
        if (existingIndex >= 0) {
          storedCourses[existingIndex].status = updatedStatus;
        } else {
          storedCourses.push({ courseId, status: updatedStatus });
        }
      } else if (existingIndex >= 0) {
        storedCourses.splice(existingIndex, 1); // Remove if unrolled or incomplete
      }

      localStorage.setItem('courses', JSON.stringify(storedCourses));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackButtonClick = () => {
    window.history.back(); // Go to the previous page
  };

  if (loading) {
    return <div>Loading courses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="course-list-container">
      <h1 className="user-course-list-header">Courses List</h1>
      
      <button className="user-course-list-back-button" onClick={handleBackButtonClick}>
        Back
      </button>
      <div className="course-grid"> {/* Wrap courses in course-grid div */}
        {courses.map((course) => (
          <div key={course.course_id} className="course-card">
            <h3>{course.course_name || 'Untitled Course'}</h3>
            <p><strong>Description:</strong> {course.description || 'No description available.'}</p>
            <p><strong>Instructor:</strong> {course.instructor_name || 'Unknown Instructor'}</p>
            <p><strong>Start Date:</strong> {course.start_date ? new Date(course.start_date).toLocaleDateString() : 'TBD'}</p>
            <p><strong>End Date:</strong> {course.end_date ? new Date(course.end_date).toLocaleDateString() : 'TBD'}</p>
            <p><strong>Status:</strong> {course.completed ? 'Completed' : course.enrolled ? 'Enrolled' : 'Not Enrolled'}</p>
            {course.completed ? (
              <button className="completed-button" disabled>
                Completed
              </button>
            ) : course.enrolled ? (
              <div>
                <button
                  className="complete-button"
                  onClick={() => handleAction('complete', course.course_id)}
                >
                  Mark as Completed
                </button>
                <button
                  className="unenroll-button"
                  onClick={() => handleAction('unenroll', course.course_id)}
                >
                  Unenroll
                </button>
              </div>
            ) : (
              <button
                className="enroll-button"
                onClick={() => handleAction('enroll', course.course_id)}
              >
                Enroll
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserCourselist;
