# Video/Audio Trimmer Application

A web application that allows users to trim video and audio files, with support for both local files and YouTube videos. Built with Next.js, TypeScript, and FFmpeg.

## Features

- Upload and trim local video/audio files
- Download and trim YouTube videos
- Option to extract audio-only from YouTube videos
- Real-time video/audio preview
- Time range selection with HH:MM:SS format
- Progress indicator for processing
- Support for both video (MP4) and audio (MP3) formats
- Responsive design

## Prerequisites

Before running the application, make sure you have the following installed:

1. Node.js (v14 or higher)
2. FFmpeg
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install ffmpeg

   # For CentOS/RHEL
   sudo yum install epel-release
   sudo yum install ffmpeg ffmpeg-devel
   ```

3. yt-dlp Installation and Setup:
   ```bash
   # Method 1: Using pip (Recommended)
   python3 -m pip install --user yt-dlp
   ```

   After installation, you MUST update the YT_DLP_PATH in the code:

   1. Open `frontend/src/app/api/download/route.js`
   2. Find this line:
   ```javascript
   const YT_DLP_PATH = '/home/mnnazrul/.local/bin/yt-dlp';
   ```
   3. Replace it with your own yt-dlp path. To find your path:
   ```bash
   # Run this command to find your yt-dlp location
   which yt-dlp
   
   # If the above doesn't work, use:
   find ~ -name yt-dlp 2>/dev/null
   ```
   4. Update the path in the code. For example:
   ```javascript
   // If your yt-dlp is in /usr/local/bin
   const YT_DLP_PATH = '/usr/local/bin/yt-dlp';
   
   // Or if installed with pip --user (common location)
   const YT_DLP_PATH = '/home/YOUR_USERNAME/.local/bin/yt-dlp';
   ```

   Note: The path `/home/mnnazrul/.local/bin/yt-dlp` in the code is specific to the original developer's system. You MUST change this to match your system's path.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd video-trimmer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install required packages:
   ```bash
   npm install uuid @types/uuid
   # or
   yarn add uuid @types/uuid
   ```

4. Create a `.env` file in the project root:
   ```
   YTDL_NO_UPDATE=1
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Upload Media**:
   - Click "Choose File" to upload a local video/audio file
   - OR enter a YouTube URL and click "Submit Media"
   - For YouTube videos, you can toggle "Audio Only" to download just the audio

2. **Preview**:
   - Once media is loaded, you can preview it in the built-in player
   - The total duration will be displayed

3. **Trim**:
   - Set the start and end times in HH:MM:SS format
   - Click "Trim Media" to process
   - A progress bar will show the processing status

4. **Download**:
   - Once trimming is complete, preview the trimmed media
   - Click "Download" to save the trimmed file

## yt-dlp Configuration

yt-dlp offers several configuration options that you can use to customize video downloads:

1. **Format Selection**:
   - Best video quality: `-f 'bestvideo+bestaudio'`
   - Specific format: `-f 'best[height<=720]'`
   - Audio only: `-f 'bestaudio'`

2. **Output Templates**:
   - Default: `-o '%(title)s.%(ext)s'`
   - Custom naming: `-o '%(upload_date)s-%(title)s.%(ext)s'`

3. **Common Issues & Solutions**:
   - If downloads are slow: Use `--concurrent-fragments N`
   - If getting errors: Update yt-dlp `yt-dlp -U`
   - For geo-restricted videos: Use `--geo-bypass`

4. **Updating yt-dlp**:
   ```bash
   # If installed with pip
   python3 -m pip install -U yt-dlp

   # If installed with curl
   sudo yt-dlp -U
   ```

## Technical Details

- Built with Next.js 13+ (App Router)
- TypeScript for type safety
- FFmpeg for media processing
- yt-dlp for YouTube video downloads
- Server-side processing for better performance
- Blob URLs for media preview
- Temporary file cleanup after processing

## Limitations

- Maximum file size depends on server configuration
- Supported formats: MP4 (video) and MP3 (audio)
- YouTube video quality depends on available formats
- Processing time varies based on file size and duration

## Error Handling

The application includes error handling for:
- Invalid file formats
- Invalid YouTube URLs
- Invalid time formats
- Network errors
- Processing failures

## Contributing

Feel free to submit issues and pull requests.

## License

[Add your license here]