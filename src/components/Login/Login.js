import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorOtp, setErrorOtp] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleOtpChange = (e) => setOtp(e.target.value);
  const handleRoleChange = (e) => setRoleId(e.target.value);

  const handleLogin = async () => {
    if (!email || !password || !roleId) {
      alert('Please fill in all fields!');
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/login', {
        email,
        password,
        role_id: roleId, // Ensure consistent naming
      });

      // On successful login, store role_id and user_id in localStorage
      const { user_id, role_id } = response.data; // Destructure the response

      localStorage.setItem('user_id', user_id);
      localStorage.setItem('role_id', role_id);

      setOtpSent(true);
      // setErrorMessage('');
      console.log(response.data.message);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          alert('Invalid role for the requested access.');
        } else if (status === 403) {
          alert('Your account is pending approval. Please wait for HR to approve your account.');
        } else {
          alert('Invalid email or password');
        }
      } else {
        alert('Something went wrong. Please try again later.');
      }
    }finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!otp) {
      alert('Please enter the OTP!');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorOtp("");

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/verify-otp', {
        otp,
        email,
      });

      // Store the token in localStorage
      localStorage.setItem('access_token', response.data.token);

      // Redirect based on the role
      switch (roleId) {
        case '1':
          window.location.href = '/hr-dashboard';
          break;
        case '2':
          window.location.href = '/manager-dashboard';
          break;
        case '3':
          window.location.href = '/instructor-dashboard';
          break;
        case '4':
          window.location.href = '/participant-dashboard';
          break;
        default:
          window.location.href = '/';
      }
    } catch (error) {
      alert('Invalid OTP');
    }finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img
            src="/ss.png"
            alt="Upskill Logo"
            className="login-logo"
          />
        </div>
        <div className="login-body">
          {/* Role Selection */}
          {!otpSent && (
            <>
              <label htmlFor="role">Select Your Role</label>
              <select
                id="role"
                name="role_id"
                value={roleId}
                onChange={handleRoleChange}
                required
              >
                <option value="">--Select--</option>
                <option value="1">HR Admin</option>
                <option value="2">Manager</option>
                <option value="3">Instructor</option>
                <option value="4">Participant</option>
              </select>
            </>
          )}

          {/* Email and Password input fields */}
          {!otpSent && (
            <>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
              />

              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
              />

              {/* Display error message if login failed */}
              {errorMessage && <p className="error-message">{errorMessage}</p>}

              <div className="forgot-password">
                <a href="/forgot-password">Forgot Password?</a>
              </div>

              <button className="login-button" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </>
          )}

          {/* OTP input field */}
          {otpSent && (
            <>
              <label htmlFor="otp">OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="Enter the OTP sent to your email"
              />

              {/* Display error message if OTP verification failed */}
              {errorOtp && <p className="error-message">{errorOtp}</p>}

              <button className="login-button" onClick={handleOtpVerification} disabled={isVerifyingOtp}>
                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          <div className="sign-up">
            <span>Or</span>
            <a href="/signup" className="sign-up-link">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
