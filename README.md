# Real-Time Chat Application  

This is a real-time chat application built with **React**, **Firebase**, and **Socket.IO**. The app allows users to manage contacts, send and receive messages in real-time, and get live updates on message status.

---

## Features  
- **User Authentication**: Use `auth` for secure user login.
- **Contact Management**: Add, edit, and delete contacts.
- **Real-Time Messaging**:
  - Send and receive messages instantly using **Socket.IO**.
  - Typing indicators and message delivery glow effects.
- **Media Upload**: Upload and send images in chats (partial functionality included).
- **Search and Filter**: Quickly search contacts by name.
- **Message History**: Fetch chat history with pagination.

---

## Tech Stack  
- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: React.js
- **Database & Authentication**: Firebase Firestore & Firebase Authentication
- **Hosting**: Firebase Hosting

---

## How It Works

**Contacts Management**:
Contacts are stored in Firestore under the user's unique ID.
Add, edit, or delete contacts using Firestore's setDoc, updateDoc, and deleteDoc.

**Messaging**:
Real-time messaging is powered by Socket.IO.
Messages are stored in Firestore under the sender and receiver's contact nodes.

**Real-Time Updates**:
Use onSnapshot for live updates of contacts and message history.
Typing indicators and new message glow effects for enhanced UX.

---

## Acknowledgments
- **Socket.IO** for seamless WebSocket communication.
- **Firebase** for authentication, database, and hosting support.
- **React** for building the user interface.

