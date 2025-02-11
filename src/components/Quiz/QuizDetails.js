import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function QuizDetails() {
  const { quizId, moduleId } = useParams();  // Only quizId and moduleId are used
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        // Fetch quiz details using only quizId and moduleId
        const response = await axios.get(
          `http://localhost:5000/api/get-quizzes/${quizId}/${moduleId}`
        );
        setQuiz(response.data);
      } catch (err) {
        setError('Failed to load quiz details');
        console.error('Error fetching quiz details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId, moduleId]);

  // Navigate to quiz attempt page
  const handleStartQuiz = () => {
    navigate(`/quiz/${quizId}/${moduleId}/attempt`);
  };

  if (loading) return <div>Loading quiz details...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="quiz-details-container">
      {quiz ? (
        <>
          <h2>{quiz.quiz_title}</h2>
          <p>Total Score: {quiz.total_score}</p>
          <p>Passing Score: {quiz.passing_score}</p>

          <h3>Questions:</h3>
          {quiz.questions.map((question) => (
            <div key={question.question_id}>
              <h4>{question.question_text}</h4>
              <ul>
                {question.answers.map((answer) => (
                  <li key={answer.answer_id}>
                    {answer.answer_text} - {answer.is_correct ? 'Correct' : 'Incorrect'}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Start Quiz Button */}
          <button onClick={handleStartQuiz} className="start-quiz-button">
            Start Quiz
          </button>
        </>
      ) : (
        <p>No quiz details found.</p>
      )}
    </div>
  );
}

export default QuizDetails;
