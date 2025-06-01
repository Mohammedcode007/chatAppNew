const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { createFriendRequestServer } = require('./websocket/chatServer');
const authController = require('./controllers/auth');
const userController = require('./controllers/userController');
const friendsController = require('./controllers/friendController');
const uploadRoutes = require('./routes/upload');
const Message = require('./models/Message');


const { HTTP_PORT, MONGO_URI } = require('./config');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());

// ربط MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes تسجيل ودخول
app.post('/signup', authController.signup);
app.post('/login', authController.login);
app.post('/logout', authMiddleware, authController.logout);
app.post('/updateUser', authMiddleware, authController.updateUser);

app.get('/search', userController.searchUsers);
app.post('/friends/requests',authMiddleware, friendsController.respondToFriendRequest);
app.get('/friends/requests', authMiddleware, friendsController.getFriendRequests);


app.use('/api', uploadRoutes);

// إنشاء WebSocket server
createFriendRequestServer(server);

async function deleteMessagesWithoutReceiver() {
  try {
    const result = await Message.deleteMany({
      receiver: { $exists: false }
    });

    console.log(`تم حذف ${result.deletedCount} رسالة لا تحتوي على حقل receiver.`);
  } catch (error) {
    console.error('حدث خطأ أثناء حذف الرسائل:', error);
  }
}
// deleteMessagesWithoutReceiver()
server.listen(HTTP_PORT, () => {
  console.log(`Server running on port ${HTTP_PORT}`);
});
