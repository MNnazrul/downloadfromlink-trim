const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const inputDir = './input-videos'; // MP4 files directory
const outputDir = './output-hls'; // HLS output directory
const segmentDuration = 10; // seconds per segment

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all MP4 files from input directory
const mp4Files = fs.readdirSync(inputDir).filter(file => file.endsWith('.mp4'));

mp4Files.forEach((mp4File, index) => {
  const inputPath = path.join(inputDir, mp4File);
  const fileName = path.basename(mp4File, '.mp4');
  const outputPath = path.join(outputDir, fileName);
  
  // Create subdirectory for this video
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  const m3u8Path = path.join(outputPath, `${fileName}.m3u8`);
  
  console.log(`Converting ${mp4File} to HLS...`);
  
  // FFmpeg command for HLS conversion
  const ffmpegCommand = `ffmpeg -i "${inputPath}" \
    -c:v libx264 \
    -c:a aac \
    -b:v 1000k \
    -b:a 128k \
    -hls_time ${segmentDuration} \
    -hls_list_size 0 \
    -hls_segment_filename "${outputPath}/${fileName}_%03d.ts" \
    "${m3u8Path}"`;
  
  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error converting ${mp4File}:`, error);
      return;
    }
    console.log(`✅ Successfully converted ${mp4File} to HLS`);
    console.log(`   Output: ${m3u8Path}`);
  });
});

console.log(`Found ${mp4Files.length} MP4 files to convert...`);

