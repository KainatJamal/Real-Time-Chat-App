import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Welcome from './components/Welcome';
import AddContactModal from './components/AddContactModal';
import Home from './components/Home';
import ChatRoom from './components/ChatRoom';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/ChatRoom" element={<ChatRoom />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/AddContactModal" element={<AddContactModal />} />

      </Routes>
    </Router>
  );
}

export default App;
