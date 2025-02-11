import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate,useLocation } from 'react-router-dom';


const AddResource = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "hr"; 
  const course_id = location.state?.course_id || ""; 
  const [modules, setModules] = useState([]); // Store available modules
  const [moduleId, setModuleId] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('link');
  const [resourceContent, setResourceContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch modules for the course
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/course-modules/${course_id}`);
        setModules(response.data.modules || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setErrorMessage('Failed to fetch modules. Please try again later.');
      }
    };

    if (course_id) {
      fetchModules();
    }
  }, [course_id]);


  const handleBackButtonClick = () => {
    navigate("/course-edit", { state: { userType } });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input fields
    if ( !moduleId || !resourceTitle || !resourceContent) {
      setErrorMessage('Please fill all required fields!');
      return;
    }

    // Additional validation for resourceContent based on resourceType
    if (resourceType === 'link' || resourceType === 'file') {
      if (!resourceContent.startsWith('http://') && !resourceContent.startsWith('https://')) {
        setErrorMessage('Please provide a valid URL (starting with http:// or https://).');
        return;
      }
    }

    const data = {
      course_id,
      module_id: moduleId,
      resource_title: resourceTitle,
      resource_type: resourceType,
      resource_content: resourceContent,
    };

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/add-resource', data);

      if (response.status === 200) {
        alert('Resource added successfully!');
        setErrorMessage('');
        // Clear the form after successful submission
        setModuleId('');
        setResourceTitle('');
        setResourceType('link');
        setResourceContent('');
      }
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Failed to add resource.');
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
      <h2 style={{ textAlign: 'center', color: 'white',marginBottom: '20px' }}>Add a New Resource</h2>

      <div
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          backgroundColor: 'white',  // Change the background color to white
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        }}
      >

        <button className="course-edit-page-back-button" onClick={handleBackButtonClick}>
          Back
        </button>
        
        {/* Display Success/Error Messages */}
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        {/* Form to Add Resource */}
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
            <label htmlFor="moduleId" style={{ display: 'block' }}>Module</label>
            <select
              id="moduleId"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              required
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">Select a module</option>
              {modules.map((module) => (
                <option key={module.module_id} value={module.module_id}>
                  {module.module_title}
                </option>
              ))}
            </select>
          </div>


          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="resourceTitle" style={{ display: 'block' }}>Resource Title</label>
            <input
              type="text"
              id="resourceTitle"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              placeholder="Enter resource title"
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
            <label htmlFor="resourceType" style={{ display: 'block' }}>Resource Type</label>
            <select
              id="resourceType"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              <option value="link">Link</option>
              <option value="file">File</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="resourceContent" style={{ display: 'block' }}>Resource Content</label>
            <textarea
              id="resourceContent"
              value={resourceContent}
              onChange={(e) => setResourceContent(e.target.value)}
              placeholder="Enter the URL, file link, or details"
              required
              style={{
                width: '90%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                minHeight: '100px',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor:'#10c932',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Resource
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddResource;