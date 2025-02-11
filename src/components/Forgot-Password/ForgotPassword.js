import React, { useState } from 'react';
import './ForgotPassword.css';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [captchaValue, setCaptchaValue] = useState(null);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false); 

  const navigate = useNavigate(); 

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleCaptchaChange = (value) => setCaptchaValue(value);
  const handleOtpChange = (e) => setOtp(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);

  const handleGenerateOtp = async () => {
    if (!email) {
      alert('Please enter your email');
    } else if (!captchaValue) {
      alert('Please complete the captcha');
    } else {
      try {
        const response = await axios.post('http://127.0.0.1:5000/api/generate-otp', { email });
        console.log(response.data.message);
        setIsOtpSent(true); // Mark OTP as sent
        alert('OTP sent to your email!');
      } catch (error) {
        console.error('Error generating OTP:', error);
        alert('Error generating OTP. Please try again.');
      }
    }
  };

  const handleVerifyOtpAndResetPassword = async () => {
    if (!otp || !newPassword) {
      alert('Please enter both OTP and new password');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/password-reset/request', {
        email,
        otp,
        new_password: newPassword,
      });
      console.log(response.data.message);
      alert('Password reset successful!');
      window.location.href = '/'
      navigate('/login'); 
    } catch (error) {
      console.error('Error verifying OTP and resetting password:', error);
      alert('Invalid OTP or error resetting password.');
    }
  };

  const handleCancel = () => {
    navigate('/'); 
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>{isOtpSent ? 'Verify OTP and Reset Password' : 'Generate OTP'}</h2>
        
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
        />

        {/* Show OTP input and new password fields if OTP is sent */}
        {isOtpSent && (
          <>
            <label htmlFor="otp">OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter OTP"
            />
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={handleNewPasswordChange}
              placeholder="Enter your new password"
            />
          </>
        )}

        {/* Google reCAPTCHA */}
        <ReCAPTCHA
          sitekey="6LfOzpsqAAAAAE6J4VdredEFp9QM2UZWy3aKuNGT"
          onChange={handleCaptchaChange}
        />
        
        <div className="buttons">
          {!isOtpSent ? (
            <button className="generate-otp-button" onClick={handleGenerateOtp}>
              Generate OTP
            </button>
          ) : (
            <button className="reset-password-button" onClick={handleVerifyOtpAndResetPassword}>
              Verify OTP and Reset Password
            </button>
          )}
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
