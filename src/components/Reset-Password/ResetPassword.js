import React, { useState } from 'react';
import './ResetPassword.css';
import { useNavigate } from 'react-router-dom'; 

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate(); 
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setNewPassword(e.target.value);
  const handleRetypePasswordChange = (e) => setRetypePassword(e.target.value);
  const handleOtpChange = (e) => setOtp(e.target.value);


  const validatePassword = () => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(newPassword)) {
      setPasswordError("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.");
      return false;
    }
    if (newPassword !== retypePassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError('');
    return true;
  };


  const validateOtp = () => {
    const validOtp = "123456"; 
    if (otp !== validOtp) {
      setOtpError("Invalid OTP. Please try again.");
      return false;
    }
    setOtpError('');
    return true;
  };


  const handleSubmit = () => {
    if (!validatePassword()) {
      return; 
    }
    if (!validateOtp()) {
      return; 
    }


    console.log('Password reset for email:', email);
    navigate('/'); 
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h2>Reset Password</h2>
        
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
        />

        <label htmlFor="newPassword">New Password</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={handlePasswordChange}
          placeholder="Enter new password"
        />

        <label htmlFor="retypePassword">Retype New Password</label>
        <input
          type="password"
          id="retypePassword"
          value={retypePassword}
          onChange={handleRetypePasswordChange}
          placeholder="Retype new password"
        />

        <label htmlFor="otp">OTP</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={handleOtpChange}
          placeholder="Enter OTP"
        />

        <div className="password-description">
          <p>Password must meet the following criteria:</p>
          <ul>
            <li>At least 8 characters</li>
            <li>Contain at least one uppercase letter</li>
            <li>Contain at least one lowercase letter</li>
            <li>Contain at least one number</li>
            <li>Contain at least one special character (e.g., @$!%*?&)</li>
          </ul>
        </div>

        {passwordError && <div className="password-error">{passwordError}</div>}
        {otpError && <div className="otp-error">{otpError}</div>}

        <button className="submit-button" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
