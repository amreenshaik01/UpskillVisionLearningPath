import React, { useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './QuestionForm.css';

function QuestionForm() {
  const { quizId, totalScore } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "hr"; // Default to "hr" if not provided


  const [questions, setQuestions] = useState(
    Array.from({ length: totalScore }, () => ({
      questionText: '',
      answers: ['', '', '', ''],
      correctAnswer: null,
    }))
  );

  const handleQuestionTextChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].questionText = value;
    setQuestions(updatedQuestions);
  };

  const handleAnswerChange = (questionIndex, answerIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers[answerIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].correctAnswer = value;
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      for (let i = 0; i < questions.length; i++) {
        const { questionText, answers, correctAnswer } = questions[i];
        const questionResponse = await axios.post(
          `http://localhost:5000/api/quizzes/${quizId}/questions`,
          {
            question_text: questionText,
            question_type: 'mcq',
          }
        );

        const questionId = questionResponse.data.question_id;

        for (let j = 0; j < answers.length; j++) {
          const isCorrect = j === correctAnswer;
          await axios.post(
            `http://localhost:5000/api/questions/${questionId}/answers`,
            { answer_text: answers[j], is_correct: isCorrect }
          );
        }
      }

      alert('Questions and answers added successfully!');

      navigate("/course-edit", { state: { userType } });

    } catch (err) {
      console.error('Error adding questions and answers:', err);
      alert('Failed to add questions and answers.');
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
    <div className="question-form-container">
      <h2>Add Questions for Quiz</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="form-group">
            <h3>Question {questionIndex + 1}</h3>
            <label>Question Text:</label>
            <input
              type="text"
              value={question.questionText}
              onChange={(e) => handleQuestionTextChange(questionIndex, e.target.value)}
              required
            />
            <h4>Answers:</h4>
            {question.answers.map((answer, answerIndex) => (
              <div key={answerIndex} className="form-group">
                <label>Answer {answerIndex + 1}:</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => handleAnswerChange(questionIndex, answerIndex, e.target.value)}
                  required
                />
              </div>
            ))}
            <div>
              <label>Select Correct Answer:</label>
              <select
                value={question.correctAnswer}
                onChange={(e) => handleCorrectAnswerChange(questionIndex, parseInt(e.target.value))}
                required
              >
                <option value={null}>Select Correct Answer</option>
                {question.answers.map((_, answerIndex) => (
                  <option key={answerIndex} value={answerIndex}>
                    Answer {answerIndex + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <button type="submit">Add Questions and Answers</button>
      </form>
    </div>
  </div>
  );
}

export default QuestionForm;
