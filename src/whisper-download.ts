import dotenv from 'dotenv';
dotenv.config();
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { google } from 'googleapis';
import apikeys from './apikeys.json' with { type: 'json' };

apikeys.private_key = apikeys.private_key.replace(/\\n/g, '\n');
const desktopPath = path.join(os.homedir(), 'Desktop');
const FOLDER_ID = process.env.OUTPUT_FOLDER_ID || ""; // Replace with your folder ID
const SCOPE = ['https://www.googleapis.com/auth/drive'];

// Create desktop directory if it doesn't exist
if (!fs.existsSync(desktopPath)) {
  fs.mkdirSync(desktopPath, { recursive: true });
}

async function authorize() {
  const auth = new google.auth.JWT({
    email: apikeys.client_email,
    key: apikeys.private_key,
    scopes: SCOPE,
  });
  await auth.authorize();
  return auth;
}

async function downloadSRT(auth: JWT) {
  const drive = google.drive({ version: 'v3', auth });
  
  try {
    console.log('🔍 Searching for .srt files...');
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and (name contains '.srt' or mimeType='text/plain')`,
      fields: 'files(id, name)',
      pageSize: 10
    });

    if (!res.data.files || res.data.files.length === 0) {
      throw new Error('No .srt files found in the specified folder');
    }

    console.log(`📄 Found ${res.data.files.length} file(s):`);
    res.data.files.forEach(file => console.log(`- ${file.name}`));

    for (const file of res.data.files) {
      const destPath = path.join(desktopPath, file.name as string);
      
      // Ensure directory exists for the file
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`⬇️ Downloading ${file.name}...`);
      const dest = fs.createWriteStream(destPath);

      if (!file.id) {
        console.warn(`⚠️ Skipping file "${file.name}" due to missing ID`);
        continue;
      }
      
      const fileStream = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'stream' }
      );

      await new Promise<void>((resolve, reject) => {
        fileStream.data
          .on('end', () => {
            console.log(`✅ Saved to: ${destPath}`);
            resolve();
          })
          .on('error', reject)
          .pipe(dest);
      });
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Error:', err.message);
      console.log('ℹ️ Troubleshooting:');
      console.log(`1. Verify folder ID: ${FOLDER_ID}`);
      console.log('2. Check file exists in Google Drive');
      console.log('3. Confirm service account has access');
    }
  }
}

authorize()
  .then(downloadSRT)
  .catch(err => console.error('❌ Authorization failed:', err.message));