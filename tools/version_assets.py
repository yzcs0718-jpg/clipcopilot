"""Stamp local browser entry points, imports and workers with one release version.
This keeps shared module singletons on the same URL and prevents mixed cached releases.
"""
from pathlib import Path
import argparse,re

def version_assets(dist,version):
 if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',version):
  raise ValueError('Invalid asset version')
 for path in Path(dist).glob('*.js'):
  text=path.read_text()
  text=re.sub(r'''(['"])(\.{1,2}/[^'"\s?]+\.js)(?:\?v=[^'"\s]+)?\1''',lambda m:m[1]+m[2]+'?v='+version+m[1],text)
  path.write_text(text)
 path=Path(dist)/'index.html';text=path.read_text()
 text=re.sub(r'''((?:src|href)="(?:\./)?[^"?]+\.(?:js|css))(?:\?v=[^"]+)?"''',lambda m:m[1]+'?v='+version+'"',text)
 path.write_text(text)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--version',required=True);parser.add_argument('--dist',type=Path,default=Path(__file__).resolve().parents[1]/'dist');args=parser.parse_args();version_assets(args.dist,args.version)
