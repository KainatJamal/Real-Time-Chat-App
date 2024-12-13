import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, getDocs, doc, deleteDoc, setDoc, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, auth, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../styles/styles.css';
import chatImage from '../components/Chat_1_-removebg-preview.png';
import AddContactModal from './AddContactModal';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';

// Initialize Socket.IO with a single server
const socket = io('http://localhost:3000');
const PAGE_SIZE = 20; // For message pagination

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [notification, setNotification] = useState('');
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false); // For typing indicator
  const [glowMessageId, setGlowMessageId] = useState(null);
  const location = useLocation();

  const completePhoneNumber = localStorage.getItem('completePhoneNumber');

  useEffect(() => {
    if (completePhoneNumber) {
      const handleReceiveMessage = (data) => {
        // Check if the message is related to the selected contact
        if (data.from === selectedContact?.phone || data.to === selectedContact?.phone) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, data]
              .sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp
              .filter((msg, index, self) => index === self.findIndex((m) => m.id === msg.id)); // Remove duplicates
  
            // Set glow effect for the new message
            setGlowMessageId(data.id);
            return updatedMessages;
          });
        }
      };
  
      // Listen for the receive_message event from the server
      socket.on('receive_message', handleReceiveMessage);
  
      return () => {
        // Cleanup the socket event listener
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [completePhoneNumber, selectedContact]);  
  
  useEffect(() => {
    if (completePhoneNumber) {
      const contactsRef = collection(db, 'users', completePhoneNumber, 'contacts');
      const unsubscribe = onSnapshot(contactsRef, (snapshot) => {
        const newContacts = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setContacts(newContacts); // Set contacts for the logged-in user
      });
  
      return () => unsubscribe();
    }
  }, [completePhoneNumber]);
  

  useEffect(() => {
    if (selectedContact && completePhoneNumber) {
      const fetchMessages = async () => {
        const senderMessagesRef = collection(db, 'users', completePhoneNumber, 'contacts', selectedContact.phone, 'messages');
        const recipientMessagesRef = collection(db, 'users', selectedContact.phone, 'contacts', completePhoneNumber, 'messages');
  
        const senderQuery = query(senderMessagesRef, orderBy('timestamp', 'asc'), limit(PAGE_SIZE));
        const recipientQuery = query(recipientMessagesRef, orderBy('timestamp', 'asc'), limit(PAGE_SIZE));
  
        const senderSnapshot = await getDocs(senderQuery);
        const recipientSnapshot = await getDocs(recipientQuery);
  
        const senderMessages = senderSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
  
        const recipientMessages = recipientSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
  
        const allMessages = [...senderMessages, ...recipientMessages]
          .sort((a, b) => a.timestamp - b.timestamp) // Sort messages by timestamp
          .filter((msg, index, self) => index === self.findIndex((m) => m.id === msg.id)); // Remove duplicates
  
        setMessages(allMessages);
      };
  
      fetchMessages();
    }
  }, [selectedContact, completePhoneNumber]);  

  const sendMessage = async (e) => {
    e.preventDefault(); // Prevent the page from refreshing
  
    if (!selectedContact) return;
  
    const messageData = {
      id: new Date().getTime().toString(),
      from: completePhoneNumber,
      to: selectedContact.phone,
      message,
      timestamp: new Date(),
    };
  
    try {
      // Send message to the server
      socket.emit('send_message', messageData);
      const senderChatRef = collection(db, 'users', completePhoneNumber, 'contacts', selectedContact.phone, 'messages');
      const recipientChatRef = collection(db, 'users', selectedContact.phone, 'contacts', completePhoneNumber, 'messages');
      await addDoc(senderChatRef, messageData);
      await addDoc(recipientChatRef, messageData);
      setGlowMessageId(messageData.id); // Set the ID of the new message to glow
      setMessage('');
    } catch (error) {
      console.error("Error saving message to Firestore: ", error);
    }
  };
  

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `chat_images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };  

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleAddContact = async (contact) => {
    try {
      const contactRef = doc(db, 'users', completePhoneNumber, 'contacts', contact.phone);
      await setDoc(contactRef, {
        ...contact,
        profilePicURL: contact.profilePicURL,
        phoneNumber: contact.phoneNumber
      });

      setContacts((prevContacts) => {
        const exists = prevContacts.some((c) => c.id === contact.phone);
        if (!exists) {
          return [...prevContacts, { ...contact, id: contact.phone }];
        }
        return prevContacts;
      });

      handleCloseModal();
    } catch (error) {
      console.error('Error adding contact: ', error);
    }
  };

  const handleSearchChange = debounce((e) => setSearchQuery(e.target.value), 300);

  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    localStorage.setItem(`selectedContact_${completePhoneNumber}`, JSON.stringify(contact)); // Store per user
  };
  

  const handleEditContact = async (id, currentName, currentPhone) => {
    const newName = prompt("Enter new name:", currentName);
    const newPhone = prompt("Enter new phone number:", currentPhone);

    if (newName !== null && newPhone !== null) {
      const updates = {};
      if (newName && newName !== currentName) updates.name = newName;
      if (newPhone && newPhone !== currentPhone) updates.phone = newPhone;

      if (Object.keys(updates).length > 0) {
        const contactRef = doc(db, 'users', completePhoneNumber, 'contacts', id);
        try {
          await updateDoc(contactRef, updates);
        } catch (error) {
          console.error("Error updating contact: ", error);
        }
      }
    }
  };

  const handleDeleteContact = async (id) => {
    const contactRef = doc(db, 'users', completePhoneNumber, 'contacts', id);
    try {
      await deleteDoc(contactRef);
    } catch (error) {
      console.error("Error deleting contact: ", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedContact || !completePhoneNumber) return;
  
    const senderChatRef = doc(db, 'users', completePhoneNumber, 'contacts', selectedContact.phone, 'messages', messageId);
    const recipientChatRef = doc(db, 'users', selectedContact.phone, 'contacts', completePhoneNumber, 'messages', messageId);
  
    try {
      // Delete the message from both sender and recipient's chats
      await deleteDoc(senderChatRef);
      await deleteDoc(recipientChatRef);
  
      // Update messages in UI after deletion
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error("Error deleting message: ", error);
    }
  };

  // Emit typing status
const handleTyping = () => {
  if (selectedContact) {
    socket.emit('typing', { from: completePhoneNumber, to: selectedContact.phone });
  }
};

// Listen for typing status
useEffect(() => {
  const handleTypingStatus = (data) => {
    if (data.from === selectedContact?.phone) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000); // Hide typing indicator after 3 seconds
    }
  };

  socket.on('typing', handleTypingStatus);

  return () => {
    socket.off('typing', handleTypingStatus);
  };
}, [selectedContact]);

  return (
    <div className="home-container">
      {notificationVisible && (
        <div className="notification-popup">
          {notification}
        </div>
      )}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Contacts</h2>
          <button className="add-contact-button" onClick={handleOpenModal}>+</button>
        </div>
        <input
          type="text"
          placeholder="Search"
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className="contacts-list">
          {filteredContacts.map((contact) => (
            <div
            key={contact.id}
            className={`contact-item ${selectedContact && selectedContact.id === contact.id ? 'selected-contact' : ''}`}
            onClick={() => handleContactClick(contact)}
          >          
              <img
                src="https://via.placeholder.com/40"
                alt="Avatar"
                className="avatar"
              />
              <span className="contact-name">{contact.name}</span>
              <button
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditContact(contact.id, contact.name, contact.phone);
                }}
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteContact(contact.id);
                }}
              >
                <i className="fas fa-trash"></i>
              </button>
              <button
                className="call-button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                📞
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {selectedContact ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <img
                  src="https://via.placeholder.com/40"
                  alt="Avatar"
                  className="avatar"
                />
                <span className="contact-name">{selectedContact.name}</span>
              </div>
              <div className="chat-header-right">
                <button className="call-button" onClick={() =>(selectedContact)}>📞</button>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
              <div
              key={msg.id}
              className={`message-wrapper ${msg.from === completePhoneNumber ? 'sent-wrapper' : 'received-wrapper'}`}
            >
              <div
                className={`message-bubble ${msg.from === completePhoneNumber ? 'sent' : 'received'} ${glowMessageId === msg.id ? 'glow' : ''}`}
              >
            
                    <span className="message-text">{msg.message}</span>
                  </div>
                  <span className="message-timestamp">
                    {new Date(msg.timestamp?.seconds * 1000).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', year: 'numeric', month: 'short', day: 'numeric' })},
                    {new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' })} PST
                  </span>
                  <button
                    className="delete-message-button"
                    onClick={() => handleDeleteMessage(msg.id)}
                  >
                    <i className="fas fa-trash-alt"></i> {/* FontAwesome delete icon */}
                  </button>
                </div>
              ))}
              {isTyping && <div className="typing-indicator">User is typing...</div>}
            </div>
            <div className="message-input-container">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="message-input"
                placeholder="Type a message"
              />
<button type="button" onClick={sendMessage} className="send-button" disabled={!message.trim()}>
  Send
</button>
            </div>
          </>
        ) : (
          <div className="centered-image-container">
            <img src={chatImage} alt="Chat" className="centered-image" />
          </div>
        )}
      </div>
              
      <AddContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddContact={handleAddContact}
      />
    </div>
  );
};

export default Home;