import React, { useState, useEffect } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import axios from 'axios';

const AddModule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || "hr"; // Default to "hr" if not provided
  const { course_id } = location.state || {}; // Fetch course_id from location.state
  const [moduleTitle, setModuleTitle] = useState('');
  const [learningPoints, setLearningPoints] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (course_id) {
      // Fetch next order number for the course
      const fetchNextOrder = async () => {
        try {
          const response = await axios.get(
            `http://127.0.0.1:5000/api/courses/${course_id}/next-order`
          );
          setOrderNo(response.data.next_order);
        } catch (error) {
          console.error('Failed to fetch next order number:', error);
          setErrorMessage('Could not fetch the next order number.');
        }
      };

      fetchNextOrder();
    }
  }, [course_id]);

  const handleBackButtonClick = () => {
  navigate("/course-edit", { state: { userType } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input fields
    if (!course_id || !moduleTitle || !orderNo) {
      setErrorMessage('Please fill all required fields!');
      return;
    }

    const data = {
      course_id,
      module_title: moduleTitle,
      learning_points: learningPoints,
      order_no: orderNo,
    };

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/add-module', data);

      if (response.status === 200) {
        alert('Module added successfully!');
        setErrorMessage('');
        // Clear the form after successful submission
        setModuleTitle('');
        setLearningPoints('');
        // Fetch next order number after adding a module
        const nextResponse = await axios.get(
          `http://127.0.0.1:5000/api/courses/${course_id}/next-order`
        );
        setOrderNo(nextResponse.data.next_order);
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Failed to add module.');
        setSuccessMessage('');
      } else {
        setErrorMessage('Network error. Please try again later.');
        setSuccessMessage('');
      }
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        background: 'linear-gradient(to right, #ff7e5f, #feb47b)',
        backgroundImage: 'url(/3.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        minHeight: '100vh',
      }}
    >
      <h2 style={{ textAlign: 'center',color: 'white', marginBottom: '20px' }}>Add a New Module</h2>

      <div
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        }}
      >

        <button className="course-edit-page-back-button" onClick={handleBackButtonClick}>
          ← Back
        </button>

        {/* Display Success/Error Messages */}
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        {/* Form to Add Module */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="courseId" style={{ display: 'block' }}>Course ID</label>
            <input
              type="text"
              id="courseId"
              value={course_id}
              readOnly
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="moduleTitle" style={{ display: 'block' }}>Module Title</label>
            <input
              type="text"
              id="moduleTitle"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Enter module title"
              required
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="learningPoints" style={{ display: 'block' }}>Learning Points</label>
            <textarea
              id="learningPoints"
              value={learningPoints}
              onChange={(e) => setLearningPoints(e.target.value)}
              placeholder="Enter learning points (Optional)"
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                minHeight: '100px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="orderNo" style={{ display: 'block' }}>Order Number</label>
            <input
              type="number"
              id="orderNo"
              value={orderNo}
              readOnly
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#10c932',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Module
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddModule;
