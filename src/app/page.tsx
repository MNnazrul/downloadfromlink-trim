// frontend/src/app/page.tsx
'use client';

import React, { useState, useRef, ChangeEvent } from 'react';

interface MediaMetadata {
  duration: number;
  width?: number;
  height?: number;
}

export default function MediaTrimmer(): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaURL, setMediaURL] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [cutMediaURL, setCutMediaURL] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mediaDuration, setMediaDuration] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(false);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Convert time string (HH:MM:SS) to seconds
  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  };

  // Convert seconds to time string (HH:MM:SS)
  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate time format (HH:MM:SS)
  const isValidTimeFormat = (timeStr: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  // Handle file selection
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else if (file.type.startsWith('audio/')) {
        setMediaType('audio');
      } else {
        setError('Please select a valid audio or video file');
        return;
      }

      // Clear any existing URL data
      setVideoUrl('');
      setVideoInfo(null);
      setIsValidUrl(false);
      setIsAudioOnly(false);

      setSelectedFile(file);
      setError('');
    }
  };

  // Handle media metadata loaded
  const handleMediaLoadedMetadata = (): void => {
    if (mediaRef.current) {
      const duration = mediaRef.current.duration;
      setMediaDuration(duration);
      // Only set times if they're empty or invalid
      if (!startTime || !isValidTimeFormat(startTime)) {
        setStartTime('00:00:00');
      }
      if (!endTime || !isValidTimeFormat(endTime)) {
        setEndTime(secondsToTime(duration));
      }
    }
  };

  // Handle server-side media trimming
  const handleTrim = async (): Promise<void> => {
    if (!mediaURL) {
      setError('Please select a media file first');
      return;
    }

    if (!startTime || !endTime) {
      setError('Start and end times must be set');
      return;
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      setError('Please ensure time inputs are valid');
      return;
    }

    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    const duration = endSeconds - startSeconds;

    if (startSeconds >= endSeconds) {
      setError('Start time must be before end time');
      return;
    }

    if (endSeconds > mediaDuration) {
      setError('End time cannot exceed media duration');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('media', selectedFile);
      }
      // formData.append('media', file);
      formData.append('startTime', startTime);
      formData.append('duration', duration.toString());
      formData.append('mediaType', mediaType || '');
      formData.append('isUrl', (!selectedFile).toString());

      const response = await fetch('/api/trim-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trim media');
      }

      const mediaBlob = await response.blob();
      const url = URL.createObjectURL(mediaBlob);
      setCutMediaURL(url);
      setProgress(100);
    } catch (error) {
      console.error('Error trimming media:', error);
      setError(error instanceof Error ? error.message : 'Failed to trim media');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download the cut media
  const downloadMedia = (): void => {
    if (cutMediaURL && selectedFile) {
      const a = document.createElement('a');
      a.href = cutMediaURL;
      const extension = selectedFile.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'mp3');
      a.download = `trimmed-${selectedFile.name.split('.')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (mediaURL) URL.revokeObjectURL(mediaURL);
      if (cutMediaURL) URL.revokeObjectURL(cutMediaURL);
    };
  }, [mediaURL, cutMediaURL]);

  // Render media player based on type
  const renderMediaPlayer = (url: string, ref?: React.RefObject<HTMLVideoElement | HTMLAudioElement | null>) => {
    if (mediaType === 'video') {
      return (
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          src={url}
          controls
          className="media-player"
          onLoadedMetadata={handleMediaLoadedMetadata}
          preload="metadata"
        />
      );
    } else {
      return (
        <audio
          ref={ref as React.RefObject<HTMLAudioElement>}
          src={url}
          controls
          className="media-player"
          onLoadedMetadata={handleMediaLoadedMetadata}
          preload="metadata"
        />
      );
    }
  };

  // Add this new function to handle both file and URL submissions:
  const handleSubmit = async () => {
    if (!selectedFile && !videoUrl) {
      setError('Please provide either a file or video URL');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      if (videoUrl) {
        const response = await fetch(`/api/download?url=${encodeURIComponent(videoUrl)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setMediaURL(blobUrl);
        setMediaType('video');
        const file = new File([blob], 'downloaded-video.mp4', {
          type: blob.type,
          lastModified: Date.now(),
        });
        setSelectedFile(file);
        setCutMediaURL('');
      } else {
        // Handle file submission
        const url = URL.createObjectURL(selectedFile!);
        setMediaURL(url);
        setCutMediaURL('');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process media');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateUrl = async (url: string) => {
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (data.valid) {
        setVideoInfo(data);
        setIsValidUrl(true);
        setError('');
      } else {
        setIsValidUrl(false);
        setError(data.error || 'Invalid URL');
      }
    } catch (error) {
      setIsValidUrl(false);
      setError('Failed to validate URL');
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('url', videoUrl);
      formData.append('isAudioOnly', isAudioOnly.toString());

      const response = await fetch('/api/download', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMediaURL(url);
      setMediaType(isAudioOnly ? 'audio' : 'video');
      setSelectedFile(null);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download media');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Media Trimmer</h1>
        <p>Upload an audio or video file and specify time range to cut a segment</p>
      </header>

      <main>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="upload-section">
          <h2>1. Upload Media</h2>
          <div className="input-container">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              className="file-input"
              aria-label="Select audio or video file"
              disabled={!!videoUrl}
            />
            <div className="url-input-group">
              <label htmlFor="video-url">Or enter video URL:</label>
              <input
                id="video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setVideoInfo(null);
                  setIsValidUrl(false);
                }}
                placeholder="Enter YouTube/TikTok/Facebook URL"
                className="url-input"
                disabled={!!selectedFile}
              />
              <div className="audio-only-toggle">
                <input
                  type="checkbox"
                  id="audio-only"
                  checked={isAudioOnly}
                  onChange={(e) => setIsAudioOnly(e.target.checked)}
                  disabled={!!selectedFile}
                />
                <label htmlFor="audio-only" className={!!selectedFile ? 'disabled' : ''}>
                  Audio Only
                </label>
              </div>
              {videoInfo && (
                <div className="video-info">
                  <p>Title: {videoInfo.title}</p>
                  <p>Duration: {secondsToTime(videoInfo.duration)}</p>
                  {videoInfo.thumbnailUrl && (
                    <img
                      src={videoInfo.thumbnailUrl}
                      alt="Video thumbnail"
                      className="video-thumbnail"
                    />
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!videoUrl && !selectedFile) || isProcessing}
              className="submit-button"
            >
              {isProcessing ? 'Processing...' : 'Submit Media'}
            </button>
          </div>
          {selectedFile && (
            <p className="file-info">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              <br />
              Type: {mediaType === 'video' ? 'Video' : 'Audio'}
            </p>
          )}
        </section>

        {mediaURL && (
          <section className="media-section">
            <h2>2. Original {mediaType === 'video' ? 'Video' : 'Audio'}</h2>
            {renderMediaPlayer(mediaURL, mediaRef)}
            <div className="media-info-container">
              {mediaDuration > 0 && (
                <p className="media-info">Duration: {secondsToTime(mediaDuration)}</p>
              )}
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = mediaURL;
                  const extension = selectedFile?.name.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'mp3');
                  const fileName = selectedFile?.name || `original.${extension}`;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="download-original-button"
                type="button"
              >
                Download Original {mediaType === 'video' ? 'Video' : 'Audio'}
              </button>
            </div>
          </section>
        )}
        <button
          className='clear-button'
          onClick={() => {
            setMediaURL('');
            setMediaType(null);
            setSelectedFile(null);
            setCutMediaURL('');
            setVideoUrl('');
            setVideoInfo(null);
            setIsValidUrl(false);
            setIsAudioOnly(false);
            setStartTime('');
            setEndTime('');
            setMediaDuration(0);

            // Reset file input by clearing its value
            const fileInput = document.querySelector('.file-input') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          }}
        >
          Clear
        </button>

        {mediaURL && (
          <section className="controls-section">
            <h2>3. Set Time Range</h2>
            <div className="time-inputs">
              <div className="time-input-group">
                <label htmlFor="start-time">Start Time (HH:MM:SS):</label>
                <input
                  id="start-time"
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  placeholder="00:00:00"
                  maxLength={8}
                  disabled={!mediaURL}
                  className={!mediaURL ? 'disabled' : ''}
                />
              </div>
              <div className="time-input-group">
                <label htmlFor="end-time">End Time (HH:MM:SS):</label>
                <input
                  id="end-time"
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                  placeholder="00:00:00"
                  maxLength={8}
                  disabled={!mediaURL}
                  className={!mediaURL ? 'disabled' : ''}
                />
              </div>
            </div>

            {isValidTimeFormat(startTime) && isValidTimeFormat(endTime) && (
              <div className="segment-info">
                <p>
                  Segment duration: {secondsToTime(Math.max(0, timeToSeconds(endTime) - timeToSeconds(startTime)))}
                </p>
              </div>
            )}

            <button
              onClick={handleTrim}
              disabled={isProcessing || !isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)}
              className="cut-button"
              type="button"
            >
              {isProcessing ? 'Processing...' : 'Trim Media'}
            </button>

            {isProcessing && (
              <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }} />
                <span>{progress}%</span>
              </div>
            )}
          </section>
        )}

        {cutMediaURL && (
          <section className="result-section">
            <h2>4. Trimmed {mediaType === 'video' ? 'Video' : 'Audio'}</h2>
            {renderMediaPlayer(cutMediaURL)}
            <div className="result-actions">
              <button onClick={downloadMedia} className="download-button" type="button">
                Download Trimmed {mediaType === 'video' ? 'Video' : 'Audio'}
              </button>
              <button
                onClick={() => {
                  setCutMediaURL('');
                  // Reset times to initial state
                  setStartTime('00:00:00');
                  setEndTime(secondsToTime(mediaDuration));
                }}
                className="clear-button"
                type="button"
              >
                Clear Result
              </button>
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-bar {
          margin-top: 20px;
          background-color: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .progress {
          height: 20px;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }

        .media-player {
          width: 100%;
          max-width: 100%;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .url-input-group {
          margin-top: 20px;
          padding: 15px;
          border: 1px dashed #ccc;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .url-input {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .url-input::placeholder {
          color: #999;
        }

        .url-submit-button {
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 8px;
        }

        .url-submit-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .input-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .submit-button {
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }

        .submit-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .audio-only-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .video-info {
          margin-top: 12px;
          padding: 10px;
          background-color: #f3f4f6;
          border-radius: 4px;
        }

        .video-thumbnail {
          max-width: 200px;
          margin-top: 8px;
          border-radius: 4px;
        }

        .video-info p {
          margin: 4px 0;
          font-size: 14px;
        }

        // Common button styles
        button {
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .submit-button {
          background-color: #4f46e5;
          color: white;
          padding: 12px 24px;
          font-size: 16px;
          width: 100%;
          max-width: 200px;
          margin: 15px auto;
        }

        .submit-button:hover {
          background-color: #4338ca;
        }

        .submit-button:disabled {
          background-color: #9ca3af;
        }

        .cut-button {
          background-color: #059669;
          color: white;
          width: 100%;
          max-width: 250px;
          margin: 20px auto;
          display: block;
        }

        .cut-button:hover {
          background-color: #047857;
        }

        .cut-button:disabled {
          background-color: #9ca3af;
        }

        .download-button {
          background-color: #2563eb;
          color: white;
          margin-right: 10px;
        }

        .download-button:hover {
          background-color: #1d4ed8;
        }

        .clear-button {
          background-color: #dc2626;
          color: white;
          margin: 10px 0;
        }

        .clear-button:hover {
          background-color: #b91c1c;
        }

        .result-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          justify-content: center;
        }

        // Additional styles for better UI
        .time-inputs {
          display: flex;
          gap: 20px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .time-input-group {
          flex: 1;
          min-width: 200px;
        }

        .time-input-group input {
          width: 100%;
          padding: 10px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .time-input-group input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .time-input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        // Progress bar improvements
        .progress-bar {
          height: 12px;
          background-color: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
          margin: 20px 0;
          position: relative;
        }

        .progress {
          height: 100%;
          background-color: #4f46e5;
          transition: width 0.3s ease;
          border-radius: 9999px;
          position: relative;
        }

        .progress-bar span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1f2937;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 0 2px white;
        }

        // Section styling
        section {
          background-color: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        section h2 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .time-input-group input.disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .time-input-group input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .file-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f3f4f6;
        }

        .url-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f3f4f6;
        }

        .audio-only-toggle input:disabled + label {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .audio-only-toggle label.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        // Add visual indication for disabled section
        .url-input-group.disabled {
          opacity: 0.8;
          background-color: #f3f4f6;
        }

        .input-container {
          position: relative;
        }

        .input-container::after {
          content: "OR";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          margin: 10px 0;
          font-weight: bold;
          color: #6b7280;
        }

        .media-info-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 15px;
          padding: 10px 0;
          gap: 20px;
        }

        .media-info {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        .download-original-button {
          background-color: #8b5cf6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .download-original-button:hover {
          background-color: #7c3aed;
        }

        .download-original-button:active {
          background-color: #6d28d9;
        }
      `}</style>
    </div>
  );
}