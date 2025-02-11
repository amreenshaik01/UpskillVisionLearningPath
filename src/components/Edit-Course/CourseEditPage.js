import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './CourseEditPage.css';

const CourseEditPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || 'hr';
  
  // State for courses, search query, and error message
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/courses');
        setCourses(response.data || []);
        setFilteredCourses(response.data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to fetch courses.');
      }
    };

    fetchCourses();
  }, []);

  // Handle search input change
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter courses based on search query
    if (query) {
      const filtered = courses.filter((course) =>
        course.course_name.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  };

  // Edit course handler
  const handleEdit = (courseId) => {
    navigate(`/edit-course/${courseId}`, { state: { userType } });
  };

  // Delete course handler
  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.post('http://127.0.0.1:5000/api/courses/delete-notify', {
          course_id: courseId,
        });

        await axios.delete(`http://127.0.0.1:5000/api/courses/${courseId}`);

        setCourses(courses.filter((course) => course.course_id !== courseId));
        setFilteredCourses(filteredCourses.filter((course) => course.course_id !== courseId));
        alert('Course deleted and notification sent successfully');
      } catch (err) {
        console.error('Error deleting course:', err);
        setError('Failed to delete the course.');
      }
    }
  };

  // Back button handler
  const handleBack = () => {
    navigate(userType === 'hr' ? '/hr-dashboard' : '/instructor-dashboard');
  };

  return (
    <div className="course-edit-page-container">
      <h1 className="course-edit-page-header">Edit Course</h1>
      <button className="course-edit-page-back-button" onClick={handleBack}>Back</button>

      {/* Search Bar */}
      <div className="course-edit-page-search">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search for courses..."
          className="course-edit-page-search-input"
        />
      </div>

      {error && <div className="course-edit-page-error-message">{error}</div>}

      {filteredCourses.length === 0 ? (
        <p>No courses available.</p>
      ) : (
        <div className="course-edit-page-courses-grid">
          {filteredCourses.map((course) => (
            <div key={course.course_id} className="course-edit-page-course-card">
              <h2>{course.course_name}</h2>
              <p><strong>Description:</strong> {course.description}</p>
              <p><strong>Instructor:</strong> {course.instructor_name}</p>
              <p>
                <strong>Start Date:</strong> {course.start_date} <br />
                <strong>End Date:</strong> {course.end_date}
              </p>
              <div className="course-edit-page-button-row">
                <button onClick={() => handleEdit(course.course_id)} className="course-edit-page-blue-button">Edit Course</button>
                <button onClick={() => handleDelete(course.course_id)} className="course-edit-page-blue-button">Delete Course</button>
              </div>
              <div className="course-edit-page-button-row">
                <button onClick={() => navigate('/add-modules/', { state: { course_id: course.course_id, userType: 'hr' } })} className="course-edit-page-blue-button">Add Modules</button>
                <button onClick={() => navigate('/add-resource', { state: { course_id: course.course_id, userType: 'hr' } })} className="course-edit-page-blue-button">Add Resources</button>
                <button onClick={() => navigate(`/add-quiz`, { state: { course_id: course.course_id, userType: 'hr' } })} className="course-edit-page-blue-button">Add Quiz</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseEditPage;
