const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const VIDEO_ID = "PV2zjV3Ir2c";

let newTitle;

async function getVideoStats() {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${API_KEY}`;
  const res = await axios.get(url);
  const stats = res.data.items[0].statistics;

  newTitle = `This video has ${stats.viewCount} views, ${stats.likeCount} likes, and ${stats.commentCount} comments.`;
  console.log(`📊 New title: ${newTitle}`);
}

async function updateVideoTitle() {
  console.log("🛠️ Starting updateVideoTitle()...");

  // Step 1: Parse credentials
  console.log("🔐 Parsing credentials and token...");
  const credentials = JSON.parse(process.env.CREDENTIALS_JSON);
  const token = JSON.parse(process.env.TOKEN_JSON);
  console.log("🔐 Parsing completed");
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  console.log("✅ OAuth2 client initialized.");
  oAuth2Client.setCredentials(token);
  console.log("🔑 Token set. Authorization complete.");

  // Step 2: Set up YouTube API client
  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
  console.log("📡 YouTube client initialized.");

  // Step 3: Fetch current video snippet
  console.log(`📥 Fetching video data for VIDEO_ID: ${VIDEO_ID}`);
  const res = await youtube.videos.list({
    part: 'snippet',
    id: VIDEO_ID,
  });
  console.log("📥 Video data fetched successfully.");
  if (!res.data.items || res.data.items.length === 0) {
    console.error("❌ Video not found or not accessible. Check if it's private and if OAuth account matches.");
    return;
  }

  const snippet = res.data.items[0].snippet;
  console.log("📄 Current title:", snippet.title);
  console.log("✏️ Preparing to update title...");

  // Step 4: Update the title and description
  snippet.title = newTitle;
  snippet.description = 'Updated automatically via API.';
  console.log("📋 New title set:", snippet.title);

  // Step 5: Make update request
  const updateRes = await youtube.videos.update({
    part: 'snippet',
    requestBody: {
      id: VIDEO_ID,
      snippet,
    },
  });

  console.log("✅ Title updated successfully!");
  console.log(`🔁 New title: "${updateRes.data.snippet.title}"`);
}


async function runUpdateCycle() {
  try {
    await getVideoStats();
    await updateVideoTitle();
  } catch (err) {
    console.error('❌ Error:', err.message || err);
  }
}

runUpdateCycle();
setInterval(runUpdateCycle, 5 * 60 * 1000); // Update every 5 minutes
