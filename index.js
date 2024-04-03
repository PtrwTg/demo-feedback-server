require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { MongoClient } = require('mongodb');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

app.post('/api/feedback', upload.single('songFile'), async (req, res) => {
  try {
    const { songName, prediction, accuracy } = req.body;
    const songFile = req.file;

    // Upload song file to Cloudinary
    const result = await cloudinary.uploader.upload(songFile.path, { resource_type: 'video' });
    const songUrl = result.secure_url;

    // Save feedback to MongoDB
    await client.connect();
    const db = client.db('musicgenre-feedback');
    const feedbackCollection = db.collection('feedbacks');
    await feedbackCollection.insertOne({ songName, songUrl, prediction, accuracy });

    res.status(200).send('Feedback submitted successfully');
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).send('Error submitting feedback');
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('musicgenre-feedback');
    const feedbackCollection = db.collection('feedbacks');
    const feedbacks = await feedbackCollection.find().toArray();
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).send('Error fetching feedbacks');
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});