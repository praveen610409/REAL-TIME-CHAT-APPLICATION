import React, { useState, useEffect, useRef } from 'react';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load previous messages from localStorage
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  
    // Set up WebSocket
    ws.current = new WebSocket('ws://localhost:4000');
  
    ws.current.onopen = () => {
      console.log('Connected to server ✅');
      setLoading(false); // Remove loading state when WebSocket connection opens
  
      // Send initial message only once per session
      if (!sessionStorage.getItem('initialHelloSent')) {
        ws.current.send('Hello, Server!');
        sessionStorage.setItem('initialHelloSent', 'true');
      }
    };
  
    ws.current.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };
  
    ws.current.onmessage = (event) => {
      const handleMessage = (msgObj) => {
        setMessages((prev) => [...prev, msgObj]);
      };
    
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const msgObj = JSON.parse(reader.result);
            handleMessage(msgObj);
          } catch {
            const time = new Date().toLocaleTimeString();
            handleMessage({ text: reader.result, sender: 'Server', time });
          }
        };
        reader.readAsText(event.data);
      } else {
        try {
          const msgObj = JSON.parse(event.data);
          handleMessage(msgObj);
        } catch {
          const time = new Date().toLocaleTimeString();
          handleMessage({ text: event.data, sender: 'Server', time });
        }
      }
    };
    
  
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);
  

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = () => {
    if (ws.current && newMessage.trim()) {
      const time = new Date().toLocaleTimeString();
      ws.current.send(newMessage);
      setMessages((prev) => [...prev, { text: newMessage, sender: 'You', time }]);
      setNewMessage('');
    }
  };

  return loading ? (
    <div>Connecting...</div>
  ) : (
    <div style={styles.container}>
      <h2 style={styles.header}>💬 Elegant Chat</h2>
      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'You' ? '#cce5ff' : '#e2e3e5',
            }}
          >
            <div style={styles.meta}>
              <strong>{msg.sender}</strong>{' '}
              <span style={styles.time}>{msg.time}</span>
            </div>
            <div>{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: 'Segoe UI, sans-serif',
    backgroundColor: '#fff',
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
    borderRadius: '10px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '15px',
    color: '#333',
  },
  chatBox: {
    height: '350px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
  },
  message: {
    maxWidth: '75%',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    wordWrap: 'break-word',
  },
  meta: {
    fontSize: '0.75rem',
    color: '#555',
    marginBottom: '5px',
  },
  time: {
    fontWeight: 'normal',
    marginLeft: '10px',
    fontSize: '0.7rem',
    color: '#888',
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default Chat;
