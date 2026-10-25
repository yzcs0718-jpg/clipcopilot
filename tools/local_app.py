#!/usr/bin/env python3
"""Serve ClipPilot locally; optional private Ollama daemon with cloud disabled."""
import argparse,hmac,json,os,secrets,shutil,socket,subprocess,sys,threading,time,webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'server'))
from local_model import LocalModel,LocalError,creative,analyze

class LocalHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Frame-Options','DENY');self.send_header('Cache-Control','no-store');super().end_headers()
 def valid_host(self):
  return self.headers.get('Host','') in ('127.0.0.1:'+str(self.server.server_port),'localhost:'+str(self.server.server_port))
 def reply(self,code,data):
  body=json.dumps(data,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def authorized(self):
  origin=self.headers.get('Origin');expected='http://'+self.headers.get('Host','')
  return self.valid_host() and (not origin or origin==expected) and hmac.compare_digest(self.headers.get('X-ClipPilot-Local',''),self.server.token)
 def do_OPTIONS(self):self.reply(403,{'error':'只接受本地同源请求'})
 def do_GET(self):
  if not self.valid_host():return self.reply(403,{'error':'Host 不匹配'})
  path=urlsplit(self.path).path
  if path=='/api/local/models':
   if not self.authorized():return self.reply(403,{'error':'本地访问令牌或来源无效'})
   if not self.server.client:return self.reply(403,{'error':'本地 AI 未开启；使用 --enable-local-ai 启动'})
   try:return self.reply(200,{'models':self.server.client.models(),'cloudEnabled':False})
   except LocalError as e:return self.reply(503,{'error':str(e)})
  if path.startswith('/api/'):return self.reply(404,{'error':'接口不存在'})
  if self.headers.get('Sec-Fetch-Site')=='cross-site':return self.reply(403,{'error':'不接受跨站访问本地工作台'})
  if path in ['/','/index.html']:
   html=(ROOT/'dist/index.html').read_text()
   html=html.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="clippilot-local-token" content="'+self.server.token+'">',1)
   body=html.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();return self.wfile.write(body)
  super().do_GET()
 def list_directory(self,path):self.send_error(403,'Directory listing disabled');return None
 def do_POST(self):
  if not self.authorized():return self.reply(403,{'error':'本地访问令牌或来源无效'})
  path=urlsplit(self.path).path
  if path not in ['/api/local/creative','/api/local/analyze']:return self.reply(404,{'error':'接口不存在'})
  if not self.server.client:return self.reply(403,{'error':'本地 AI 未开启；不会自动转为收费服务'})
  if not self.server.inference.acquire(blocking=False):return self.reply(429,{'error':'已有本地推理任务，请等待完成'})
  try:
   size=int(self.headers.get('Content-Length','0'))
   if not 0<size<=3000000:raise LocalError('请求需小于 3MB')
   data=json.loads(self.rfile.read(size));result=(creative if path.endswith('/creative') else analyze)(data,self.server.client)
   self.reply(200,result)
  except (ValueError,TypeError,KeyError) as e:self.reply(400,{'error':str(e)})
  except Exception:self.reply(502,{'error':'本地任务失败，请查看模型、内存和输入格式'})
  finally:self.server.inference.release()

def make_server(port=8765,client=None):
 server=ThreadingHTTPServer(('127.0.0.1',port),partial(LocalHandler,directory=str(ROOT/'dist')));server.token=secrets.token_urlsafe(32);server.client=client;server.inference=threading.Lock();return server

def start_ollama():
 executable=shutil.which('ollama')
 if not executable:raise LocalError('未安装 Ollama。请先安装并准备本地视觉模型，再运行；程序不会自动下载安装或使用云模型。')
 with socket.socket() as probe:probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
 env=os.environ.copy();env['OLLAMA_HOST']='127.0.0.1:'+str(port);env['OLLAMA_NO_CLOUD']='1';env['OLLAMA_ORIGINS']='';env['OLLAMA_KEEP_ALIVE']='0'
 process=subprocess.Popen([executable,'serve'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 client=LocalModel(port)
 for _ in range(60):
  if process.poll() is not None:raise LocalError('独立 Ollama 服务启动失败，请检查安装版本和运行权限')
  try:client.models();return process,client
  except LocalError:time.sleep(.25)
 process.terminate();process.wait(timeout=10);raise LocalError('独立 Ollama 服务未及时就绪')

def main():
 parser=argparse.ArgumentParser(description='ClipPilot 免费本地版');parser.add_argument('--port',type=int,default=8765);parser.add_argument('--enable-local-ai',action='store_true');parser.add_argument('--no-open',action='store_true');args=parser.parse_args();process=None;server=None
 try:
  client=None
  if args.enable_local_ai:process,client=start_ollama()
  server=make_server(args.port,client);url='http://127.0.0.1:'+str(server.server_port);print('ClipPilot: '+url,flush=True);print('云模型禁止；本地 AI '+('已开启（需要已安装模型）' if client else '未开启')+'。Ctrl+C 退出。',flush=True)
  if not args.no_open:webbrowser.open(url)
  server.serve_forever()
 except KeyboardInterrupt:pass
 except (LocalError,OSError) as e:print(str(e),file=sys.stderr);return 1
 finally:
  if server:server.server_close()
  if process and process.poll() is None:
   process.terminate()
   try:process.wait(timeout=10)
   except subprocess.TimeoutExpired:process.kill();process.wait()
 return 0
if __name__=='__main__':sys.exit(main())
