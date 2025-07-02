// src/app/api/download/route.js
import { spawn } from 'child_process';

const YT_DLP_PATH = '/home/mnnazrul/.local/bin/yt-dlp';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Spawn yt-dlp process to output best mp4 video to stdout
    const ytDlpProcess = spawn(YT_DLP_PATH, ['-f', 'best[ext=mp4]', '-o', '-', url]);

    return new Response(ytDlpProcess.stdout, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        // 'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Download failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
