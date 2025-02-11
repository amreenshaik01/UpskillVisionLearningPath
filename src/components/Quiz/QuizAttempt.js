import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./QuizAttempt.css";

function QuizAttempt() {
  const { quizId, moduleId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/get-quizzes/${quizId}/${moduleId}`
        );
        setQuiz(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };
    fetchQuiz();
  }, [quizId, moduleId]);

  // Handle answer change
  const handleAnswerChange = (questionId, answerText) => {
    setAnswers({ ...answers, [questionId]: answerText });
  };

  // Submit the quiz
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("user_id");

    if (!userId) {
      alert("You must be logged in to submit a quiz.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/quizzes/${quizId}/submit`,
        {
          user_id: userId, // Dynamically fetch user ID
          module_id: moduleId,
          answers,
        }
      );

      alert(`Quiz submitted! Score: ${response.data.score}`);
      navigate("/enrolled"); // Redirect to the dashboard after submission
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit the quiz. Please try again.");
    }
  };

  if (loading) return <div>Loading quiz...</div>;

  return (
    <div className="quiz-attempt-container">
      <h2>{quiz.quiz_title}</h2>
      <form onSubmit={handleSubmit}>
        {quiz.questions.map((question) => (
          <div key={question.question_id} className="question-block">
            <h3>{question.question_text}</h3>
            {question.answers.map((answer) => (
              <div key={answer.answer_id} className="answer-option">
                <input
                  type="radio"
                  name={`question-${question.question_id}`}
                  value={answer.answer_text}
                  onChange={() => handleAnswerChange(question.question_id, answer.answer_text)}
                />
                <label>{answer.answer_text}</label>
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="submit-button">Submit Quiz</button>
      </form>
    </div>
  );
}

export default QuizAttempt;
