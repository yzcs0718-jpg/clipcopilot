import base64,copy,json,unittest
from server.effect_analysis import analyze_effects,validate_result
from server.local_model import LocalError
JPEG='data:image/jpeg;base64,'+base64.b64encode(b'\xff\xd8\xfffixture').decode()
def fixture():
 return {'observation':'连续采样中主体尺寸增大','unknowns':'无音轨，无法判断音效或原始模板','effects':[{'name':'可能为缩放或运镜','confidence':'low','evidenceTimes':[1,2],'reason':'主体变大','alternatives':'镜头前移或主体靠近','steps':['导入片段','首尾设置缩放关键帧'],'trialParameters':'建议100到110试做，不是原参数','verify':'对齐边缘与主体大小'}]}
class Client:
 def __init__(self,result):self.result=result;self.calls=[]
 def chat(self,model,messages,structured=False):self.calls.append((messages,structured));return json.dumps(self.result)
class EffectTests(unittest.TestCase):
 def context(self):return {'model':'test','reference':{'name':'ref.mp4','duration':5},'shot':{'start':1,'end':3},'frames':[{'time':t,'image':JPEG} for t in [1,2,3]]}
 def test_sequence_evidence_and_structured_output(self):
  client=Client(fixture());result=analyze_effects(self.context(),client)
  self.assertEqual(result['effects'][0]['evidenceTimes'],[1,2]);self.assertTrue(client.calls[0][1]);self.assertIn('3.0000',client.calls[0][0][-1]['content']);self.assertEqual(result['shot'],{'start':1,'end':3})
 def test_hallucinated_evidence_high_confidence_and_missing_steps_rejected(self):
  for update in [{'evidenceTimes':[1,4]},{'evidenceTimes':[1,1]},{'confidence':'high'},{'steps':[]},{'trialParameters':''}]:
   with self.subTest(update=update):
    result=fixture();result['effects'][0].update(update)
    with self.assertRaises(LocalError):validate_result(result,[{'time':1},{'time':2}])
 def test_unknown_is_valid_without_invented_effects(self):
  result=fixture();result['effects']=[];self.assertEqual(validate_result(result,[])['effects'],[])
 def test_bad_ranges_and_insufficient_evidence_never_call_model(self):
  for update in [{'shot':{'start':2,'end':8}},{'frames':[{'time':1,'image':JPEG}]}]:
   client=Client(fixture());data=self.context();data.update(update)
   with self.assertRaises(LocalError):analyze_effects(data,client)
   self.assertEqual(client.calls,[])

class HTTPIntegration(unittest.TestCase):
 def test_effect_mode_routes_to_structured_analyzer(self):
  import threading,urllib.request
  from tools.local_app import make_server
  client=Client(fixture());server=make_server(0,client);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   data=EffectTests().context();data['effectDetail']=True
   req=urllib.request.Request('http://127.0.0.1:'+str(server.server_port)+'/api/local/analyze',json.dumps(data).encode(),{'Content-Type':'application/json','X-ClipPilot-Local':server.token})
   with urllib.request.urlopen(req,timeout=5) as response:result=json.load(response)
   self.assertEqual(result['effects'][0]['name'],'可能为缩放或运镜');self.assertEqual(len(client.calls),1)
  finally:server.shutdown();server.server_close();thread.join()
