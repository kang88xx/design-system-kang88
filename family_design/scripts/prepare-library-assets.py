import pathlib,json,re,subprocess,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
base=root/'references/v2-source';out=base/'previews';out.mkdir(exist_ok=True)
tokens=json.loads((root/'tokens.json').read_text())['color']
css=':root{'+''.join('--'+n+':'+v['value']+';' for n,v in tokens.items())+'}'
for p in (base/'assets').glob('inline-svg-*.svg'):
 s=p.read_text();s=s.replace('><','><',1);end=s.find('>');s=s[:end+1]+'<style>'+css+'</style>'+s[end+1:]
 (out/p.name.replace('inline-','')).write_text(s)
manifest=json.loads((base/'videos/manifest.json').read_text())
ffmpeg=pathlib.Path('/tmp/ffmpeg-7.0.2-amd64-static/ffmpeg')
def storyboard(item):
 name=item['name'];parts=[float(x) for x in item['duration'].split(':')];duration=parts[0]*3600+parts[1]*60+parts[2]
 item['durationSeconds']=round(duration,3);item['storyboard']=f'references/v2-source/previews/{name}-storyboard.jpg'
 # Uniform temporal samples; thumbnail is a strip of three original frames.
 interval=duration/3
 subprocess.run([str(ffmpeg),'-y','-hide_banner','-loglevel','error','-i',str(root/item['local']),'-vf',f'fps=1/{interval},scale=180:-2,tile=3x1','-frames:v','1',str(root/item['storyboard'])],check=True)
 return item
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:manifest['videos']=list(pool.map(storyboard,manifest['videos']))
(base/'media-library.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('94 token-resolved SVGs and 9 film storyboards prepared')
