import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { NextRequest } from 'next/server';

const YT_DLP_PATH: string = '/home/mnnazrul/.local/bin/yt-dlp';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url: string | null = searchParams.get('url');

  console.log("the control reached here.");

  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const ytDlpProcess: ChildProcessWithoutNullStreams = spawn(YT_DLP_PATH, [
      '-f',
      'best[ext=mp4]',
      '-o',
      '-',
      url,
    ]);

    ytDlpProcess.on('error', (err: Error) => {
      console.error('yt-dlp process error:', err);
    });

    return new Response(ytDlpProcess.stdout as unknown as ReadableStream<Uint8Array>, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        // 'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
  } catch (error: unknown) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Download failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
