import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/styles.css';
import { addDoc, collection, getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; // Import these methods


const ChatRoom = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [flagUrl, setFlagUrl] = useState('https://flagcdn.com/pk.svg');
  const [profilePic, setProfilePic] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [profilePicSize, setProfilePicSize] = useState(150);
  const profilePicRef = useRef(null);
  const navigate = useNavigate();

  const countries = [
    { code: '+92', name: 'Pakistan (پاکستان)', flagUrl: 'https://flagcdn.com/pk.svg' },
    { code: '+1', name: 'United States', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: '+57', name: 'Colombia', flagUrl: 'https://flagcdn.com/co.svg' },
    { code: '+91', name: 'India (भारत)', flagUrl: 'https://flagcdn.com/in.svg' },
    { code: '+49', name: 'Germany (Deutschland)', flagUrl: 'https://flagcdn.com/de.svg' },
    { code: '+93', name: 'Afghanistan (افغانستان)', flagUrl: 'https://flagcdn.com/af.svg' },
    { code: '+355', name: 'Albania (Shqipëri)', flagUrl: 'https://flagcdn.com/al.svg' },
  ];

  const handlePhoneNumberChange = (e) => setPhoneNumber(e.target.value);
  const handleNameChange = (e) => setName(e.target.value);

  const handleCountryCodeChange = (e) => {
    const selectedCountry = countries.find(country => country.code === e.target.value);
    setCountryCode(selectedCountry.code);
    setFlagUrl(selectedCountry.flagUrl);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProfilePic = () => {
    setProfilePic('');
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newSize = profilePicSize + e.movementY;
      setProfilePicSize(Math.max(Math.min(newSize, 300), 50)); // Limit size
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }

    if (!phoneNumber.trim()) {
      alert("Phone number is required.");
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence); // Set session persistence to local storage

      const completePhoneNumber = `${countryCode}${phoneNumber}`;
      const email = `${completePhoneNumber}@example.com`; // Create a dummy email for authentication
      const password = 'password'; // Set a default password

      // Create a new user with email and password
      await createUserWithEmailAndPassword(auth, email, password);

      // Handle profile picture upload if provided
      let profilePicURL = '';
      if (profilePic) {
        const userId = auth.currentUser.uid; // Use user ID from Firebase Authentication
        const storageRef = ref(storage, `profilePics/${userId}`);
        await uploadString(storageRef, profilePic, 'data_url');
        profilePicURL = await getDownloadURL(storageRef);
      }

      // Save user profile information in Firestore
      const userRef = doc(db, 'users', completePhoneNumber);
      await setDoc(userRef, {
        name,
        phoneNumber: completePhoneNumber,
        profilePicURL,
        countryCode,
      });
      localStorage.setItem('completePhoneNumber', completePhoneNumber);

      // Set notification message in local storage
      localStorage.setItem('notification', `Signed up successfully with ${completePhoneNumber}`);
      alert('Information saved successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Error saving information: ', error.message);
      alert('Error saving information: ' + error.message);
    }
  };

  const handleLogin = async () => {
    const completePhoneNumber = `${countryCode}${phoneNumber}`;
    const email = `${completePhoneNumber}@example.com`; // Create a dummy email for authentication
    const password = 'password'; // Use the same default password

    try {
      await setPersistence(auth, browserLocalPersistence); // Set session persistence to local storage

      // Sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', completePhoneNumber);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        localStorage.setItem('completePhoneNumber', completePhoneNumber);
        localStorage.setItem('notification', `Logged in successfully with ${completePhoneNumber}`);
        navigate('/home');
      } else {
        alert('No user found with this phone number. Please sign up first.');
      }
    } catch (error) {
      console.error('Error during login:', error.message);
      alert('Error during login: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-r from-red-400 to-white p-4">
      <div className="profile-pic-wrapper">
        <div className="profile-pic-container" style={{ width: profilePicSize, height: profilePicSize }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            className="profile-pic-input"
            id="profilePicInput"
          />
          <label htmlFor="profilePicInput" className="profile-pic-label">
            <img 
              src={profilePic || 'https://via.placeholder.com/150'} 
              alt="Profile" 
              className="profile-pic"
              ref={profilePicRef}
              style={{ width: profilePicSize, height: profilePicSize }}
            />
            <span className="profile-pic-overlay">Select Profile Picture</span>
          </label>
          <div className="resize-handle" onMouseDown={handleMouseDown}></div>
        </div>
        {profilePic && (
          <button className="delete-icon" onClick={handleDeleteProfilePic}>
            <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6H5v14h14V6zM16 4H8v2H5v1h14V6h-3V4zM8 8h8v12H8V8z" fill="#fff"/>
            </svg>
          </button>
        )}
      </div>

      {/* Name Input Field */}
      <div className="name-input-container mt-4">
        <header className="name-input-header">Enter your name:</header>
        <div className="name-input-form">
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="name-input"
          />
        </div>
      </div>

      {/* Phone Number Input Field */}
      <div className="phone-input-container1 mt-4">
        <header className="phone-input-header">Enter your phone number:</header>
        <div className="phone-input-form">
          <div className="country-code-dropdown-container">
            <select 
              value={countryCode} 
              onChange={handleCountryCodeChange} 
              className="country-code-dropdown"
              style={{
                backgroundImage: `url(${flagUrl})`,
                backgroundPosition: '10px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '24px auto',
              }}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} {country.code}
                </option>
              ))}
            </select>
          </div>
          <input
            type="tel"
            placeholder="(415) 555-2671"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            className="phone-number-input"
          />
        </div>
      </div>

      <button className="signin-button mt-4" onClick={handleSave}>
        SignUp
      </button>

      {/* Phone Number Input Field */}
      <div className="phone-input-container2 mt-4">
        <header className="phone-input-header1">If already a user, then:</header>
        <div className="phone-input-form1">
          <div className="country-code-dropdown-container">
            <select 
              value={countryCode} 
              onChange={handleCountryCodeChange} 
              className="country-code-dropdown"
              style={{
                backgroundImage: `url(${flagUrl})`,
                backgroundPosition: '10px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '24px auto',
              }}
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} {country.code}
                </option>
              ))}
            </select>
          </div>
          <input
            type="tel"
            placeholder="(415) 555-2671"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            className="phone-number-input1"
          />
        </div>
      </div>

      <button className="login1-button mt-4" onClick={handleLogin}>
        Login
      </button>
    </div>
  );
};

export default ChatRoom;
