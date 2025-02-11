import React, { useState } from "react";
import axios from "axios";
import "./SignUp.css";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    first_name: "",
    last_name: "",
    role_id: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    number: false,
    uppercase: false,
    lowercase: false,
    special: false,
  });

  const handleRoleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      role_id: parseInt(e.target.value, 10),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "password") {
      const pass = value;
      setPasswordCriteria({
        length: pass.length >= 8,
        number: /[0-9]/.test(pass),
        uppercase: /[A-Z]/.test(pass),
        lowercase: /[a-z]/.test(pass),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      });
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match!");
      return false;
    }

    if (
      !passwordCriteria.length ||
      !passwordCriteria.number ||
      !passwordCriteria.uppercase ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.special
    ) {
      setError("Password must meet all criteria!");
      return false;
    }

    if (!formData.role_id) {
      setError("Please select a role!");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/users",
        formData
      );
      console.log("User created successfully:", response.data);
      alert(
        "Signup successful! Your account is pending HR admin approval."
      );
      setFormData({
        username: "",
        email: "",
        password: "",
        passwordConfirm: "",
        first_name: "",
        last_name: "",
        role_id: "",
      });
      setPasswordCriteria({
        length: false,
        number: false,
        uppercase: false,
        lowercase: false,
        special: false,
      });
    } catch (err) {
      console.error("Error during signup:", err);
      alert("Signup Failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <img
            src="/ss.png"
            alt="Upskill Logo"
            className="signup-logo"
          />
          <h2>Sign Up</h2>
        </div>
        <div className="signup-body">
          {error && <div className="signup-error-message">{error}</div>}
          {successMessage && (
            <div className="signup-success-message">{successMessage}</div>
          )}

          {/* Username */}
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            required
          />

          {/* First Name */}
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Enter your first name"
            required
          />

          {/* Last Name */}
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter your last name"
            required
          />

          {/* Email */}
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          {/* Password */}
          <label htmlFor="password">Create Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
          />

          {/* Password Criteria */}
          <div className="signup-password-criteria">
            <ul>
              <li className={passwordCriteria.length ? "valid" : "invalid"}>
                Minimum 8 characters
              </li>
              <li className={passwordCriteria.number ? "valid" : "invalid"}>
                At least one number
              </li>
              <li className={passwordCriteria.uppercase ? "valid" : "invalid"}>
                At least one uppercase letter
              </li>
              <li className={passwordCriteria.lowercase ? "valid" : "invalid"}>
                At least one lowercase letter
              </li>
              <li className={passwordCriteria.special ? "valid" : "invalid"}>
                At least one special character
              </li>
            </ul>
          </div>

          {/* Confirm Password */}
          <label htmlFor="passwordConfirm">Confirm Password</label>
          <input
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
          />

          {/* Role Selection */}
          <label htmlFor="role">Select Your Role</label>
          <select
            id="role"
            name="role_id"
            value={formData.role_id}
            onChange={handleRoleChange}
            required
          >
            <option value="">--Select--</option>
            <option value="1">HR Admin</option>
            <option value="2">Manager</option>
            <option value="3">Instructor</option>
            <option value="4">Participant</option>
          </select>

          {/* Submit Button */}
          <button
            className="signup-submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
