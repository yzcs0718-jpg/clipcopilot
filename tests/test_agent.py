import importlib.util,json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path('tools').resolve()))
from agent import execute,validate
class AgentTests(unittest.TestCase):
 def test_reject_bool_and_out_of_range(self):
  for c in [{'asset':True,'start':0,'end':1},{'asset':0,'start':0,'end':9}]:
   with self.assertRaises(ValueError):validate({'clips':[c]},[{'duration':4}])
 def test_real_local_pipeline_burns_captions_and_rejects_overwrite(self):
  with tempfile.TemporaryDirectory() as folder:
   out=Path(folder)/'movie.mp4';script=Path(folder)/'script.md';script.write_text('# Demo\nScene One\nScene Two',encoding='utf-8')
   result=execute(['dist/demo/shot1.mp4','dist/demo/shot2.mp4'],out,'16:9',1,script_path=script,burn=True)
   self.assertTrue(result['success']);self.assertEqual([s['stage'] for s in result['trace']],['inspect','planner','validator','renderer','reviewer']);self.assertTrue(out.with_suffix('.srt').is_file());self.assertTrue(out.with_suffix('.agent.json').is_file())
   with self.assertRaises(ValueError):execute(['dist/demo/shot1.mp4'],out)
if __name__=='__main__':unittest.main()
