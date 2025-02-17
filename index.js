const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for specific origin
const allowedOrigins = [
  'https://kristinallarsen.github.io' // No trailing slash
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'], // Add OPTIONS for preflight
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('IIIF Backend is running!');
});

app.options('*', cors());

app.post('/saveCollection', async (req, res) => {
  const { collectionName, collection } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = 'iiif-collections';

  const path = `collections/${collectionName}.json`;
  const message = `Create collection "${collectionName}"`;

  const content = Buffer.from(
      JSON.stringify({ collectionName }), // Ensure this is valid JSON
      'utf-8' // Explicit encoding (optional but safe)
    ).toString('base64');

  const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

  try {
    const response = await axios.put(
      url,
      {
        message,
        content
      },
      {
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: 'Collection saved successfully!', data: response.data });
  } catch (error) {
    console.error('Error saving collection:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to save collection' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
module.exports = app;
