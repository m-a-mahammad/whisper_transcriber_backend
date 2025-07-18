import dotenv from 'dotenv';
dotenv.config();
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import apikeys from './apikeys.json' with { type: 'json' };
import { JWT } from 'google-auth-library';

apikeys.private_key = apikeys.private_key.replace(/\\n/g, '\n');
const FOLDER_ID = process.env.INPUT_FOLDER_ID || ""; // ← Replace this
const SCOPE = ['https://www.googleapis.com/auth/drive'];

async function authorize() {
  const auth = new google.auth.JWT({
    email: apikeys.client_email,
    key: apikeys.private_key,
    scopes: SCOPE,
  });
  await auth.authorize();
  return auth;
}

function askYouTubeURL(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('🎥 Enter YouTube URL: ',
      (answer) => { rl.close();
        resolve(answer.trim());
      });
    });
  }

const userInputURL = await askYouTubeURL();

async function createNotebook() {
  const cells = [
    // Cell 1: Install dependencies
    {
      cell_type: 'code',
      metadata: {},
      source: [
        '!pip install -U openai-whisper yt-dlp\n',
        '!sudo apt update && sudo apt install ffmpeg'
      ],
      execution_count: null,
      outputs: []
    },
    
    // Cell 2: Import libraries
    {
      cell_type: 'code',
      metadata: {},
      source: [
        'from google.colab import drive\n',
        'from google.colab import files\n',
        'uploaded = files.upload()\n',
        'import whisper\n',
        'import os'
      ],
      execution_count: null,
      outputs: []
    },
    
    // Cell 3: Mount Drive and setup
    {
      cell_type: 'code',
      metadata: {},
      source: [
        'drive.mount(\'/content/drive\')\n',
        'model = whisper.load_model("medium.en")\n',
        'input_folder = "/content/drive/MyDrive/whisper_inputs/"\n',
        'output_folder = "/content/drive/MyDrive/whisper_outputs/"\n',
        'os.makedirs(input_folder, exist_ok=True)\n',
        'os.makedirs(output_folder, exist_ok=True)'
      ],
      execution_count: null,
      outputs: []
    },
    
    // Cell 4: Download YouTube video
    {
      cell_type: 'code',
      metadata: {},
      source: [
        '# 🗑️ Remove old files before adding new ones\n',
        'import glob\n',
        'for f in glob.glob(f"{input_folder}*"):os.remove(f)\n',
        'for f in glob.glob(f"{output_folder}*"):os.remove(f)\n',
        '# 🟢 Download video from YouTube\n',
        `youtube_url = "${userInputURL}"\n`,
        '# !yt-dlp -x --audio-format mp3 -o "{input_folder}/downloaded.%(ext)s" {youtube_url}\n',
        '!yt-dlp --cookies /content/cookies.txt -x --audio-format mp3 -o "{input_folder}/downloaded.%(ext)s" {youtube_url}'
      ],
      execution_count: null,
      outputs: []
    },
    
    // Cell 5: Process audio files
    {
      cell_type: 'code',
      metadata: {},
      source: [
        '# 🔁 Process audio files\n',
        'for file in os.listdir(input_folder):\n',
        '    if file.endswith((".mp4", ".mp3", ".wav")):\n',
        '        print(f"Processing: {file}...")\n',
        '        result = model.transcribe(f"{input_folder}{file}")\n',
        '        srt_path = f"{output_folder}{os.path.splitext(file)[0]}.srt"\n',
        '        with open(srt_path, "w") as f:\n',
        '            for i, seg in enumerate(result["segments"]):\n',
        '                f.write(f"{i+1}\\n{seg[\'start\']} --> {seg[\'end\']}\\n{seg[\'text\']}\\n\\n")\n',
        '        print(f"Saved: {srt_path}")'
      ],
      execution_count: null,
      outputs: []
    }
  ];

  const notebook = {
    cells: cells,
    metadata: {
      colab: { 
        name: 'whisper_transcriber.ipynb',
        provenance: [],
        collapsible: true,
        accelerator: 'T4_GPU'
      },
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python'
      },
      language_info: {
        name: 'python',
        version: '3.10.12'
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };

  const filePath = path.join(process.cwd(), 'whisper_transcriber.ipynb');
  await fs.promises.writeFile(filePath, JSON.stringify(notebook, null, 2));
  console.log('✅ Notebook created with 5 cells:', filePath);
  return filePath;
}

async function uploadFile(auth: JWT, filePath: string) {
  const drive = google.drive({ version: 'v3', auth });
  const fileName = path.basename(filePath);

  // Step 1: Check if file already exists in the folder
  const existing = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and name = '${fileName}'`,
    fields: 'files(id, name, webViewLink)',
  });

  if (!existing.data.files) {
    throw new Error("Notebook does not exist on Drive")
  }
  
  if (existing.data.files.length > 0) {
    const file = existing.data.files[0];
    console.log('📂 Notebook already exists on Drive:');
    console.log(`- Colab URL: https://colab.research.google.com/drive/${file.id}`);
    console.log(`- Drive URL: ${file.webViewLink}`);
    return file;
  }

  // Step 2: Upload file if not found
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  type FileMetadata = {
    name: string,
    parents: string[]
  }
  
  
  const fileMetadata:FileMetadata = {
    name: fileName,
    parents: [FOLDER_ID],
  };
  
  const fileStream = fs.createReadStream(filePath);
  const media = {
    mimeType: 'application/json',
    body: fileStream,
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id,name,webViewLink',
  });

  console.log('📤 Upload successful:');
  console.log(`- File ID: ${res.data.id}`);
  console.log(`- Colab URL: https://colab.research.google.com/drive/${res.data.id}`);
  console.log(`- Drive URL: ${res.data.webViewLink}`);

  return res.data;
}

// Main execution
authorize()
  .then(async (auth) => {
    try {
      const notebookPath = await createNotebook();
      await uploadFile(auth, notebookPath);
    } catch (err) {
      if (err instanceof Error) {
        console.error('❌ Main execution error:', err.message);
        process.exit(1);
      }
    }
  })
  .catch((err) => {
    console.error('❌ Authorization error:', err.message);
    process.exit(1);
  });