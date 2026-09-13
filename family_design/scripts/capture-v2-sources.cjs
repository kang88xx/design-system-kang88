const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const videoDir = path.join(root, 'references/v2-source/videos');
const assetDir = path.join(root, 'references/v2-source/assets');
fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });

const videos = ['send', 'receive', 'swap', 'nft', 'watch', 'activity', 'onboarding', 'missioncontrol', 'dragdropdone'];
const base = 'https://family.co/videos/';
const ffmpeg = '/tmp/ffmpeg-7.0.2-amd64-static/ffmpeg';

for (const name of videos) {
  const mp4 = path.join(videoDir, `${name}.mp4`);
  const poster = path.join(videoDir, `${name}-poster.jpg`);
  if (!fs.existsSync(mp4)) execFileSync('curl', ['-L', '--fail', '-sS', `${base}${name}.mp4`, '-o', mp4]);
  if (!fs.existsSync(poster)) execFileSync(ffmpeg, ['-y', '-ss', '0.5', '-i', mp4, '-frames:v', '1', '-q:v', '2', poster], { stdio: 'ignore' });
}

const manifest = videos.map(name => {
  const stat = fs.statSync(path.join(videoDir, `${name}.mp4`));
  let duration = null;
  try { duration = execFileSync(ffmpeg, ['-i', path.join(videoDir, `${name}.mp4`)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { duration = String(e.stderr || e.stdout || ''); }
  const m = String(duration).match(/Duration: (\d\d):(\d\d):(\d\d\.\d\d)/);
  return { name, source: `${base}${name}.mp4`, local: `references/v2-source/videos/${name}.mp4`, poster: `references/v2-source/videos/${name}-poster.jpg`, bytes: stat.size, duration: m ? `${m[1]}:${m[2]}:${m[3]}` : 'unavailable' };
});
fs.writeFileSync(path.join(videoDir, 'manifest.json'), JSON.stringify({ capturedAt: new Date().toISOString(), videos: manifest }, null, 2));
console.log(JSON.stringify(manifest, null, 2));
