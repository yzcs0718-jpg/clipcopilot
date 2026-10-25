"""Build reproducible user downloads without runtime data or credentials."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/downloads'
OUT.mkdir(exist_ok=True)
def allowed(path):
 parts=path.relative_to(ROOT).parts
 if any(p in {'.git','.openai','__pycache__','node_modules'} for p in parts):return False
 if path.name.startswith('.env') and path.name!='.env.example':return False
 if path.suffix in {'.pyc','.tar','.gz'}:return False
 if path.parent==OUT:return path.name=='ClipPilot-Collector.zip'
 return True
roots=['dist','server','tools','tests','skills','.github','collector']
files=[]
for directory in roots:
 files.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and allowed(p))
files.extend(p for p in ROOT.iterdir() if p.is_file() and (p.suffix in {'.md','.json','.command','.bat'} or p.name=='.gitignore') and allowed(p))
for name,local in [('ClipPilot-Local.zip',True),('ClipPilot-Source.zip',False)]:
 with ZipFile(OUT/name,'w',ZIP_DEFLATED) as archive:
  for p in sorted(set(files)):
   relative=p.relative_to(ROOT)
   if local and relative.parts[0] in {'tests','skills','.github','collector'}:continue
   if relative.as_posix() in {'dist/index.html','dist/local-ai-guide.html'}:
    html=p.read_text()
    for filename in ['ClipPilot-Local.zip','ClipPilot-Source.zip']:
     html=html.replace('href="downloads/'+filename+'"','href="https://yzcs0718-jpg.github.io/clipcopilot/downloads/'+filename+'"')
    html=html.replace('https://yzcs0718-jpg.github.io/clipcopilot/downloads/ClipPilot-Source.zip','https://github.com/yzcs0718-jpg/clipcopilot/archive/refs/heads/main.zip')
    archive.writestr(str(Path('ClipPilot')/relative),html)
   else:archive.write(p,str(Path('ClipPilot')/relative))
 print(name)
