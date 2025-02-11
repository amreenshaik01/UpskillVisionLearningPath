import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HRCourseReview.css"; // Import external CSS file

const CourseReviews = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Fetch all courses
    useEffect(() => {
        fetch("http://localhost:5000/api/courses")
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    setError(data.message);
                } else {
                    setCourses(data);
                }
            })
            .catch(() => setError("Failed to fetch courses"));
    }, []);

    // Fetch reviews for the selected course
    const fetchReviews = (courseId) => {
        setLoading(true);
        fetch(`http://localhost:5000/api/course-reviews?course_id=${courseId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.message) {
                    setReviews([]);
                    setError(data.message);
                } else {
                    setReviews(data);
                    setError("");
                }
            })
            .catch(() => setError("Failed to fetch reviews"))
            .finally(() => setLoading(false));
    };

    const handleBackButtonClick = () => navigate("/hr-dashboard");


    return (
        <div className="course-reviews-container">
            <h1 className="course-reviews-title">Course Reviews</h1>

            <button className="hr-course-review-back-button" onClick={handleBackButtonClick}>
        ← Back
      </button>

            {/* Main content with courses on the left and reviews on the right */}
            <div className="content-wrapper">
                {/* Courses List */}
                <div className="courses-list">
                    <h3 className="course-reviews-subtitle">Select a Course:</h3>
                    {courses.length > 0 ? (
                        <ul className="course-list">
                            {courses.map((course) => (
                                <li key={course.course_id} className="course-list-item">
                                    <button
                                        className={`course-button ${selectedCourse === course.course_id ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedCourse(course.course_id);
                                            fetchReviews(course.course_id);
                                        }}
                                    >
                                        {course.course_name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="error">No courses available.</p>
                    )}
                </div>

                {/* Reviews Section */}
                {selectedCourse && (
                    <div className="reviews-container">
                        <h3 className="course-reviews-subtitle">Reviews</h3>
                        {loading ? (
                            <p className="loading">Loading reviews...</p>
                        ) : error ? (
                            <p className="error">{error}</p>
                        ) : (
                            <ul className="reviews-list">
                                {reviews.map((review, index) => (
                                    <li key={index} className="review-item">
                                        <strong className="review-user">{review.user_name}</strong> - ⭐ {review.rating}
                                        <p className="review-text">{review.review_text}</p>
                                        <small className="review-date">{review.created_at}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseReviews;
