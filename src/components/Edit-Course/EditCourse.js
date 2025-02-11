import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const EditCourse = () => {
  const { courseId } = useParams(); // Get course ID from the route
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const userType = location.state?.userType || "hr"; // Default to "hr" if not provided

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [courseData, setCourseData] = useState({
    courseTitle: "",
    description: "",
    instructor: "",
  });
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseResponse, instructorResponse] = await Promise.all([
          fetch(`http://127.0.0.1:5000/api/courses/${courseId}`),
          fetch("http://127.0.0.1:5000/api/instructors"),
        ]);

        if (courseResponse.ok && instructorResponse.ok) {
          const courseData = await courseResponse.json();
          const instructorsData = await instructorResponse.json();

          // console.log("Fetched course data:", courseData); // Debugging: Check the course data
          
          setCourseData({
            courseTitle: courseData.course_name,
            description: courseData.description,
            instructor: courseData.instructor_id,
          });
          setStartDate(courseData.start_date); // Ensure this directly sets '2025-01-02'
          setEndDate(courseData.end_date);     // Ensure this directly sets '2025-01-30'
          setDuration(courseData.duration_weeks || "");
          setInstructors(instructorsData);
        } else {
          throw new Error("Failed to fetch course or instructor data.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate); // No formatting needed here
  
    if (duration > 0) {
      const calculatedEndDate = new Date(newStartDate);
      calculatedEndDate.setDate(calculatedEndDate.getDate() + duration * 7);
      setEndDate(calculatedEndDate.toISOString().split("T")[0]); // Ensures 'YYYY-MM-DD'
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
      setEndDate(calculatedEndDate.toISOString().split("T")[0]); // Ensures 'YYYY-MM-DD'
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

    if (!payload.course_name || !payload.description || !payload.start_date || !payload.end_date || !payload.instructor_id) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Send notification first using your backend API
      const notificationResponse = await fetch("http://127.0.0.1:5000/api/courses/update-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_id: courseId,
        }),
      });

      if (!notificationResponse.ok) {
        const notificationError = await notificationResponse.json();
        alert(`Error sending notification: ${notificationError.message || "Failed to send notification"}`);
        return;
      }

      console.log("Notification sent successfully.");

      const response = await fetch(`http://127.0.0.1:5000/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Course updated successfully!");
        navigate("/course-edit", { state: { userType } });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || "Failed to update course"}`);
      }
    } catch (err) {
      console.error("Error submitting data:", err);
      alert("Failed to update course. Please try again later.");
    }finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/course-edit", { state: { userType } });
  };

  if (error) {
    return <div>{error}</div>;
  }

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      margin: 0,
      fontFamily: "'Roboto', sans-serif",
      background: "linear-gradient(to bottom right, #89f7fe, #66a6ff)", // Gradient background
      backgroundImage: `url('/3.jpg')`, // Ensure the image is in the public folder
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
        <h2 style={styles.formTitle}>EDIT COURSE</h2>
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
          ></textarea>
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
              {isLoading ? "Updating..." : "Update"}
            </button>
            <button 
              type="button" 
              style={styles.cancelButton} 
              onClick={handleCancel}
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
