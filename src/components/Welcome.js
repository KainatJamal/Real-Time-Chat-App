import React, { useState, useEffect } from 'react';
import '../styles/styles.css'; // Adjust the path as needed
import chatImage from '../components/Chat_1_-removebg-preview.png'; // Adjust the path as needed

const Welcome = () => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const buttonTimer = setTimeout(() => {
      setShowButtons(true);
    }, 4000); // Adjust the delay to match your image animation duration

    return () => clearTimeout(buttonTimer);
  }, []);

  const handleLoginClick = () => {
    window.location.href = '/login'; // Adjust the path as needed
  };

  const handleSignUpClick = () => {
    window.location.href = '/callroom'; // Adjust the path as needed to match your routing
  };

  return (
    <div className="welcome-container">
      <div className="text-container">
        <h1 className="welcome-title">Welcome to ChatSnap!</h1>
        <p className="welcome-text">Connect. Snap. Chat. Your conversations, just a snap away!</p>
      </div>
      <img src={chatImage} alt="Chat Icon" className="chat-image fade-in-image" />
      {showButtons && (
        <div className="button-container">
          <button className="login-button" onClick={handleLoginClick}>
            Login
          </button>
          <button className="login-button" onClick={handleSignUpClick}>
            Sign Up
          </button>
        </div>
      )}
    </div>
  );
};

export default Welcome;
