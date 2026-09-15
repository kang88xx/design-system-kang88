import subprocess
B='/Users/henry/.codex/skills/gstack/browse/dist/browse'
for page in ['about','services','pricing','projects','blog','contact-us','home-v2']:
 for args in [('goto','https://opalhaus.framer.website/'+page),('eval','scripts/inspect.js','--out','evidence/'+page+'.json'),('screenshot','--viewport','evidence/'+page+'.png')]:
  p=subprocess.run([B,*args],capture_output=True,text=True);p.check_returncode()
 print(page,flush=True)
