import SyncedHlsVideos from '@/components/SyncedHlsVideos';

export default function Page() {
  return (
    <div>
      <h1>Toggle HLS Videos</h1>
      <SyncedHlsVideos
        video1Src="https://pub-e668f82c3ede4548869ac0a3acad4e7f.r2.dev/meghalaya-1/output.m3u8"
        video2Src="https://pub-e668f82c3ede4548869ac0a3acad4e7f.r2.dev/meghalaya-1-dub/output.m3u8"
        width={800}
        height={450}
      />
    </div>
  );
}
