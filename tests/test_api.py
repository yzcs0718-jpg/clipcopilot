import importlib.util,os,threading,json,unittest,urllib.request,urllib.error
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from io import BytesIO
os.environ.update(APP_TOKEN='a'*24,MODEL_NAME='text-test',VISION_MODEL_NAME='vision-test',MODEL_BASE_URL='https://provider.invalid/v1',MODEL_API_KEY='mock-only')
spec=importlib.util.spec_from_file_location('api','server/api.py');api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
class AnalysisTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),api.Handler);threading.Thread(target=cls.server.serve_forever,daemon=True).start()
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close()
 def request(self,data,token='a'*24):
  req=urllib.request.Request('http://127.0.0.1:%s/api/analyze'%self.server.server_port,json.dumps(data).encode(),{'Content-Type':'application/json','Authorization':'Bearer '+token})
  with urllib.request.urlopen(req) as r:return json.load(r)
 def data(self):return {'reference':{'name':'demo.mp4','duration':4},'frames':[{'time':0,'image':'data:image/jpeg;base64,/9j/'}],'transcript':'示例文案','shots':[{'start':0,'end':4,'note':'桌面','copy':'','effect':'缓慢推近'}]}
 def test_health_requires_auth_and_does_not_return_secrets(self):
  req=urllib.request.Request('http://127.0.0.1:%s/api/health'%self.server.server_port,headers={'Authorization':'Bearer '+'a'*24})
  with urllib.request.urlopen(req) as response:data=json.load(response)
  self.assertTrue(data['model_configured']);self.assertNotIn('mock-only',json.dumps(data))
 def test_auth_required(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.request(self.data(),token='wrong')
  self.assertEqual(e.exception.code,401)
 def test_reject_remote_image_urls(self):
  data=self.data();data['frames'][0]['image']='https://example.com/a.jpg'
  with self.assertRaises(urllib.error.HTTPError) as e:self.request(data)
  self.assertEqual(e.exception.code,400)
 def test_multimodal_payload(self):
  original=urllib.request.urlopen;forwarded=[]
  def fake(req,*args,**kwargs):
   if req.full_url.startswith('https://provider.invalid'):
    forwarded.append(json.loads(req.data));return BytesIO(json.dumps({'choices':[{'message':{'content':'观察与建议'}}]}).encode())
   return original(req,*args,**kwargs)
  with patch.dict(os.environ,{'ALLOW_MODEL_CALLS':'1'}),patch.object(api.urllib.request,'urlopen',side_effect=fake):self.assertEqual(self.request(self.data())['analysis'],'观察与建议')
  self.assertEqual(forwarded[0]['model'],'vision-test');self.assertTrue(any(x['type']=='image_url' for x in forwarded[0]['messages'][1]['content']))
 def test_unconfigured_server_denies_empty_bearer_on_all_endpoints(self):
  with patch.object(api,'TOKEN',''):
   for path in ['/api/plan','/api/analyze']:
    req=urllib.request.Request('http://127.0.0.1:%s%s'%(self.server.server_port,path),b'{}',{'Authorization':'Bearer '})
    with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(req)
    self.assertEqual(e.exception.code,401)
 def test_plan_rejects_boolean_duration(self):
  req=urllib.request.Request('http://127.0.0.1:%s/api/plan'%self.server.server_port,json.dumps({'brief':'demo','assets':[{'name':'video','duration':True}]}).encode(),{'Authorization':'Bearer '+'a'*24})
  with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(req)
  self.assertEqual(e.exception.code,400)
class ProviderTests(unittest.TestCase):
 setUpClass=classmethod(AnalysisTests.setUpClass.__func__)
 tearDownClass=classmethod(AnalysisTests.tearDownClass.__func__)
 data=AnalysisTests.data
 def post(self,path,data):
  req=urllib.request.Request('http://127.0.0.1:%s%s'%(self.server.server_port,path),json.dumps(data).encode(),{'Content-Type':'application/json','Authorization':'Bearer '+'a'*24})
  with urllib.request.urlopen(req) as r:return json.load(r)
 def configured(self):return {'ZHIPU_API_KEY':'mock-zhipu','KIMI_API_KEY':'mock-kimi','DEEPSEEK_API_KEY':'mock-deepseek','DOUBAO_API_KEY':'mock-doubao','DOUBAO_MODEL':'ep-text','DOUBAO_VISION_MODEL':'ep-vision'}
 def test_zero_cost_default_blocks_all_model_paths_without_network(self):
  for provider in ['zhipu','kimi','deepseek','doubao','custom']:
   with self.subTest(provider=provider),patch.dict(os.environ,{**self.configured(),'ALLOW_MODEL_CALLS':'0'}):
    config=api.choose_provider({'provider':provider})
    with patch.object(api.urllib.request,'urlopen') as send:
     with self.assertRaises(api.ProviderError) as e:api.call_provider(config,[{'role':'user','content':'OK'}])
     self.assertEqual(e.exception.status,403);send.assert_not_called()
 def test_disabled_api_rejects_plan_analyze_and_test(self):
  with patch.dict(os.environ,{'ALLOW_MODEL_CALLS':'0'}):
   for path,data in [('/api/plan',{'brief':'demo','assets':[{'name':'a','duration':4}]}),('/api/analyze',self.data()),('/api/test',{})]:
    with self.subTest(path=path),self.assertRaises(urllib.error.HTTPError) as e:self.post(path,data)
    self.assertEqual(e.exception.code,403)
 def test_four_provider_routing_and_models_use_mock_responses_only(self):
  original=urllib.request.urlopen;sent=[]
  def fake(req,*args,**kwargs):
   if req.full_url.startswith('http://127.0.0.1:'):return original(req,*args,**kwargs)
   sent.append((req.full_url,json.loads(req.data),req.get_header('Authorization')))
   return BytesIO(json.dumps({'choices':[{'message':{'content':'```json\n{"clips":[{"asset":0,"start":0,"end":2,"caption":"demo"}]}\n```'}}]}).encode())
  with patch.dict(os.environ,{**self.configured(),'ALLOW_MODEL_CALLS':'1'}),patch.object(api.urllib.request,'urlopen',side_effect=fake):
   for id in ['zhipu','kimi','deepseek','doubao']:
    result=self.post('/api/plan',{'provider':id,'brief':'demo','assets':[{'name':'a.mp4','duration':4}]})
    config=api.provider_config(id);self.assertEqual(result['provider'],id);self.assertEqual(sent[-1][0],config['base']+'/chat/completions');self.assertEqual(sent[-1][1]['model'],config['model']);self.assertEqual(sent[-1][2],'Bearer '+config['key'])
 def test_provider_selection_cannot_override_endpoint_or_key(self):
  with self.assertRaises(ValueError):api.choose_provider({'provider':'https://attacker.invalid'})
  with patch.dict(os.environ,self.configured()):
   config=api.choose_provider({'provider':'deepseek','base_url':'https://attacker.invalid','api_key':'bad'})
   self.assertEqual(config['base'],'https://api.deepseek.com');self.assertEqual(config['key'],'mock-deepseek')
 def test_missing_vision_model_is_explicit(self):
  with patch.dict(os.environ,{**self.configured(),'DOUBAO_VISION_MODEL':''}):
   with self.assertRaises(api.ProviderError) as e:api.choose_provider({'provider':'doubao'},vision=True)
   self.assertIn('视觉模型',str(e.exception))
 def test_health_never_returns_provider_keys(self):
  with patch.dict(os.environ,self.configured()):
   serialized=json.dumps(api.public_providers())
   for key in self.configured().values():
    if key.startswith('mock-'):self.assertNotIn(key,serialized)
 def test_provider_errors_are_safe_and_actionable(self):
  with patch.dict(os.environ,{**self.configured(),'ALLOW_MODEL_CALLS':'1'}),patch.object(api.urllib.request,'urlopen',side_effect=urllib.error.HTTPError('https://provider.invalid',429,'secret-key-should-not-leak',{},None)):
   with self.assertRaises(api.ProviderError) as e:api.call_provider(api.choose_provider({'provider':'zhipu'}),[])
   self.assertEqual(e.exception.status,429);self.assertNotIn('secret-key',str(e.exception))
if __name__=='__main__':unittest.main()
