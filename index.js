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

app.get('/getCollection/:collectionName', async (req, res) => {
  const { collectionName } = req.params;
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = 'iiif-collections';

  const path = `collections/${collectionName}.json`;

  const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw' // Get raw JSON content
      }
    });

    const collectionData = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf-8'));

    res.status(200).json(collectionData);
  } catch (error) {
    console.error('Error retrieving collection:', error.message);
    res.status(404).json({ error: 'Collection not found' });
  }
});

app.options('*', cors());

app.post('/saveCollection', async (req, res) => {
  const { collection } = req.body; // Receive the full collection object
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = 'iiif-collections';

  if (!collection || !collection.collectionName) {
    return res.status(400).json({ error: 'Collection data is missing or invalid' });
  }

  const collectionName = collection.collectionName; // Extract collection name
  const path = `collections/${collectionName}.json`; // Path for saving the collection
  const message = `Create collection "${collectionName}"`;

  // Save the full collection data
  const content = Buffer.from(
    JSON.stringify(collection, null, 2), // Ensure the full collection object is saved
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
