import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CreateCourse = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const userType = location.state?.userType || "hr";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [courseData, setCourseData] = useState({
    courseTitle: "",
    description: "",
    instructor: "",
  });
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/instructors");
        if (response.ok) {
          const data = await response.json();
          setInstructors(data);
        } else {
          console.error("Failed to fetch instructors.");
        }
      } catch (error) {
        console.error("Error fetching instructors:", error);
      }
    };
    fetchInstructors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (duration > 0) {
      const calculatedEndDate = new Date(newStartDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + duration * 7);
      setEndDate(calculatedEndDate.toISOString().split("T")[0]);
    } else {
      setEndDate("");
    }
  };

  const handleDurationChange = (e) => {
    const weeks = parseInt(e.target.value, 10);
    setDuration(weeks);

    if (startDate && weeks > 0) {
      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + weeks * 7);
      setEndDate(calculatedEndDate.toISOString().split("T")[0]);
    } else {
      setEndDate("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      course_name: courseData.courseTitle,
      description: courseData.description,
      start_date: startDate,
      end_date: endDate,
      instructor_id: courseData.instructor,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const createdCourseId = data.course_id;

        const notifyResponse = await fetch(
          "http://127.0.0.1:5000/api/courses/notify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_id: createdCourseId }),
          }
        );

        if (notifyResponse.ok) {
          alert("Course created and notification sent successfully!");
        } else {
          const notifyError = await notifyResponse.json();
          alert(`Failed to send notification: ${notifyError.message}`);
        }

        navigate(userType === "hr" ? "/hr-dashboard" : "/instructor-dashboard");
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to create course"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message || "Failed to create course. Please try again later."}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(userType === "hr" ? "/hr-dashboard" : "/instructor-dashboard");
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      margin: 0,
      fontFamily: "'Roboto', sans-serif",
      background: "linear-gradient(to bottom right, #89f7fe, #66a6ff)", // Gradient background
      backgroundImage: `url(3.jpg)`, // Replace with your desired image URL
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    },
    formSection: {
      width: "100%",
      maxWidth: "480px",
      background: "rgba(255, 255, 255, 0.9)", // Transparent white
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(10px)", // Adds a blur effect for the background
    },
    formTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#333",
      marginBottom: "20px",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    input: {
      width: "100%",
      padding: "12px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      fontSize: "15px",
      transition: "border-color 0.3s, box-shadow 0.3s",
    },
    buttons: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
    },
    submitButton: {
      flex: 1,
      padding: "10px",
      background: "linear-gradient(to right, #ff416c, #ff4b2b)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
      marginRight: "10px",
      transition: "transform 0.3s",
    },
    cancelButton: {
      flex: 1,
      padding: "10px",
      background: "linear-gradient(to right, #6a11cb, #2575fc)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer",
      transition: "transform 0.3s",
    },
  };
    

  return (
    <div style={styles.container}>
      <div style={styles.formSection}>
        <h2 style={styles.formTitle}>Create New Course</h2>
        <form style={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            name="courseTitle"
            placeholder="Course Title"
            style={styles.input}
            value={courseData.courseTitle}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            style={styles.input}
            value={courseData.description}
            onChange={handleInputChange}
            required
          />
          <select
            name="instructor"
            style={styles.input}
            value={courseData.instructor}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Instructor</option>
            {instructors.map((instructor) => (
              <option key={instructor.user_id} value={instructor.user_id}>
                {instructor.first_name} {instructor.last_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            style={styles.input}
            value={startDate}
            onChange={handleStartDateChange}
            required
          />
          <input
            type="number"
            style={styles.input}
            placeholder="Duration (weeks)"
            value={duration}
            onChange={handleDurationChange}
            required
          />
          <input
            type="text"
            style={styles.input}
            placeholder="End Date"
            value={endDate}
            readOnly
          />
          <div style={styles.buttons}>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
