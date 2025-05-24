let socket = null;

export function connectSocket({ token, room, onMessage, onOpen, onClose }) {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  const wsUrl = `ws://192.168.80.248:3000/?token=${token}&room=${room}`;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('✅ WebSocket Connected');
    onOpen && onOpen();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage && onMessage(message);
    } catch (e) {
      console.error('❌ Error parsing WebSocket message', e);
    }
  };

  socket.onclose = () => {
    console.log('🔌 WebSocket Disconnected');
    onClose && onClose();
    socket = null;
  };

  socket.onerror = (error) => {
    console.error('❌ WebSocket error', error.message);
  };

  return socket;
}

export function sendSocketMessage(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export function closeSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
