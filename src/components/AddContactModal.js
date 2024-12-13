import React, { useState } from 'react';
import { setDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase'; // Adjust this path as needed
import '../styles/styles.css';

const AddContactModal = ({ isOpen, onClose, onAddContact }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && phone) {
      try {
        const user = auth.currentUser;
  
        if (!user || !user.uid) throw new Error("User is not authenticated or UID is missing");
  
        const completePhoneNumber = localStorage.getItem('completePhoneNumber');
        const contactRef = doc(db, 'users', completePhoneNumber, 'contacts', phone);
  
        await setDoc(contactRef, { name, phone });
  
        alert('Contact saved successfully!');
        
        onAddContact({ id: phone, name, phone }); // Notify parent component
        setName('');
        setPhone('');
        onClose();
      } catch (e) {
        console.error("Error adding document: ", e.message);
        alert("Error adding contact. Please try again.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Contact</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <div className="modal-actions">
            <button type="submit" className="submit-button">Add</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContactModal;