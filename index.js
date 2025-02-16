const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Use the CORS middleware to enable Cross-Origin Resource Sharing man
app.use(cors({
  origin: 'https://kristinallarsen.github.io/iiif_gallery/',
  optionsSuccessStatus: 200  // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(bodyParser.json());

app.options('*', cors()); // Include a preflight OPTIONS request handler

app.post('/saveCollection', async (req, res) => {
  const { collectionName, collection } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = 'iiif-collections'; // Your repository name for storing collections

  const path = `collections/${collectionName}.json`;
  const message = `Create collection "${collectionName}"`;

  const content = Buffer.from(JSON.stringify(collection, null, 2)).toString('base64');

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
