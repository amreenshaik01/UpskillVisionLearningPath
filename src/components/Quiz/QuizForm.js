import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate,useLocation } from 'react-router-dom';
import './QuizForm.css';

function QuizForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "hr"; 
  const course_id = location.state?.course_id || ""; 
  const [modules, setModules] = useState([]); // Store available modules
  const [moduleId, setModuleId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [totalScore, setTotalScore] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passingScore, setPassingScore] = useState('');

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
    try {
      const response = await axios.post('http://localhost:5000/api/quizzes', {
        course_id,
        module_id: moduleId,
        quiz_title: quizTitle,
        total_score: totalScore,
        passing_score: passingScore,
      });

      alert(response.data.message);

      // Check if the quiz ID is available in the response data
      if (response.data.quiz_id) {
        // Navigate to QuestionForm with quizId and totalScore (number of questions to add)
        navigate(`/add-question/${response.data.quiz_id}/${totalScore}`);
      } else {
        alert('Quiz ID is missing.');
      }
    } catch (err) {
      console.error('Error adding quiz:', err);
      alert('Failed to add quiz.');
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
      <h2 style={{ textAlign: 'center', color: 'white',marginBottom: '20px' }}>Add a New Quiz</h2>

      <button className="back-button" onClick={handleBackButtonClick}>
          Back
        </button>

    <div className="quiz-form-container">

      {/* Display Success/Error Messages */}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

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

        <div className="form-group">
          <label>Quiz Title:</label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Total Score (Number of Questions):</label>
          <input
            type="number"
            value={totalScore}
            onChange={(e) => setTotalScore(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Passing Score (Number of Questions Correct):</label>
          <input
            type="number"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Quiz</button>
      </form>
    </div>
  </div>
  );
}

export default QuizForm;
