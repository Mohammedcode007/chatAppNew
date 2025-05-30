// module.exports = {
//   MONGO_URI: 'mongodb+srv://mohammed:12345@cluster0.c9tdum2.mongodb.net/',
//   JWT_SECRET: 'your_jwt_secret_here',
//   WS_PORT: 8080,
//   HTTP_PORT: 3000,
// };

require('dotenv').config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  WS_PORT: process.env.WS_PORT || 8080,
  HTTP_PORT: process.env.HTTP_PORT || 3000,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
