import subprocess
B='/Users/henry/.codex/skills/gstack/browse/dist/browse'
def run(*args):
 p=subprocess.run([B,*args],capture_output=True,text=True); print(p.stdout[:250]); p.check_returncode()
for name,y in [('projects',2000),('services',4000),('faq',5900),('footer',9000)]:
 run('js',f'window.scrollTo(0,{y})');run('screenshot','--viewport',f'evidence/home-{name}.png')
run('eval','scripts/inspect.js','--out','evidence/home-bottom.json')
for name,size in [('tablet','768x1024'),('mobile','390x844')]:
 run('viewport',size);run('goto','https://opalhaus.framer.website/');run('eval','scripts/inspect.js','--out',f'evidence/home-{name}.json');run('screenshot','--viewport',f'evidence/home-{name}.png')
