// frontend/src/app/api/trim-video/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const startTime = formData.get('startTime') as string;
    const duration = formData.get('duration') as string;
    const mediaType = formData.get('mediaType') as string;
    const mediaFile = formData.get('media') as File;
    if (!mediaFile) {
      return NextResponse.json(
        { error: 'No media file provided' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Save uploaded file to temp directory
    const buffer = Buffer.from(await mediaFile.arrayBuffer());
    const inputPath = path.join(tempDir, `input-${uuidv4()}.${mediaType === 'video' ? 'mp4' : 'mp3'}`);
    fs.writeFileSync(inputPath, buffer);

    // Set output path
    const outputFileName = `output-${uuidv4()}.${mediaType === 'video' ? 'mp4' : 'mp3'}`;
    const outputPath = path.join(tempDir, outputFileName);

    // Trim the media using ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-ss', startTime,           // Seek position
        '-i', inputPath,            // Input file
        '-t', duration,             // Duration
        '-map', '0',                // Map all streams
        '-c:v', 'libx264',         // Video codec
        '-c:a', 'aac',             // Audio codec
        '-b:a', '128k',            // Audio bitrate
        '-ac', '2',                // Audio channels
        '-ar', '44100',            // Audio sample rate
        '-pix_fmt', 'yuv420p',     // Pixel format
        '-movflags', '+faststart',  // Fast start for web playback
        '-y',                       // Overwrite output file
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      // Add error logging
      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });

    // Read the trimmed file
    const processedMedia = fs.readFileSync(outputPath);

    // Clean up temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    // Return the trimmed media
    return new NextResponse(processedMedia, {
      headers: {
        'Content-Type': mediaType === 'video' ? 'video/mp4' : 'audio/mpeg',
        'Content-Disposition': `attachment; filename="trimmed.${mediaType === 'video' ? 'mp4' : 'mp3'}"`,
      },
    });

  } catch (error) {
    console.error('Error trimming media:', error);
    return NextResponse.json(
      { error: 'Failed to trim media' },
      { status: 500 }
    );
  }
}