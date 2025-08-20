'use client'
import {useRef, useState, useEffect} from 'react'
import Hls from 'hls.js'

interface SyncedVideosProps {
  video1Src: string
  video2Src: string
  width?: number
  height?: number
}

export default function SyncedHlsVideos({ video1Src, video2Src, width = 640, height = 360 }: SyncedVideosProps) {
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const [showVideo1, setShowVideo1] = useState(true)

  useEffect(() => {
    let hls1: Hls | null = null;
    let hls2: Hls | null = null;

    if (Hls.isSupported()) {
      if (video1Ref.current) {
        hls1 = new Hls();
        hls1.loadSource(video1Src);
        hls1.attachMedia(video1Ref.current);
      }
      if (video2Ref.current) {
        hls2 = new Hls();
        hls2.loadSource(video2Src);
        hls2.attachMedia(video2Ref.current);
      }
    } else {
      if (video1Ref.current) video1Ref.current.src = video1Src;
      if (video2Ref.current) video2Ref.current.src = video2Src;
    }

  }, [video1Src, video2Src])

  const handleToggle = () => {
    if (!video1Ref.current || !video2Ref.current) return;

    const currentTime = showVideo1 ? video1Ref.current.currentTime : video2Ref.current.currentTime;

    if (showVideo1) {
      video1Ref.current.pause();
      video2Ref.current.currentTime = currentTime;
      video2Ref.current.play();
    } else {
      video2Ref.current.pause();
      video1Ref.current.currentTime = currentTime;
      video1Ref.current.play();
    }

    setShowVideo1((prev) => !prev);

  }

  return (
    <div>
      <div style={{ position: 'relative', width, height }}>
        <video
          ref={video1Ref}
          width={width}
          height={height}
          style={{ display: showVideo1 ? 'block' : 'none' }}
          controls
          autoPlay={true}
        />
        <video
          ref={video2Ref}
          width={width}
          height={height}
          style={{ display: showVideo1 ? 'none' : 'block' }}
          controls
        />
      </div>
      <button onClick={handleToggle} style={{ marginTop: '1rem' }}>
        Toggle Video
      </button>
    </div>
  );
}
