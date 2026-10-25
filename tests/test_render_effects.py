import contextlib,io,json,subprocess,tempfile,unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path('tools').resolve()))
from render import render
class RenderEffects(unittest.TestCase):
 def test_zoom_and_fade_render_to_mp4_without_changing_timeline_duration(self):
  plan={'clips':[{'asset':0,'start':0,'end':.5,'caption':'Zoom','effect':'push'},{'asset':0,'start':.5,'end':1,'caption':'Fade','effect':'fade'}]}
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)/'effects.mp4'
   with contextlib.redirect_stdout(io.StringIO()):render(plan,out,['dist/demo/shot1.mp4'],'1:1',True)
   result=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(out)]))
   self.assertAlmostEqual(float(result['format']['duration']),1,delta=.15);self.assertTrue(any(x['codec_type']=='audio' for x in result['streams']))
