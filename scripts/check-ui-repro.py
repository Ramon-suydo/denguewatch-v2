from pathlib import Path
import sys,json,hashlib
project=Path.cwd();sys.path.insert(0,str(project/'ml'))
import pipeline
scratch=project/'.artifacts/ui-overhaul/repro'
pipeline.ROOT=scratch;pipeline.WORK=scratch/'work';pipeline.OUT=scratch/'data/processed/ml';pipeline.PUBLIC=scratch/'public/ml';pipeline.DOCS=scratch/'docs'
for path in [pipeline.WORK,pipeline.OUT,pipeline.PUBLIC,pipeline.DOCS/'evidence/ml',scratch/'tests/fixtures']:path.mkdir(parents=True,exist_ok=True)
pipeline.train();pipeline.evaluate();pipeline.export()
paths=['data/processed/ml/training.json','data/processed/ml/evaluation.json','data/processed/ml/test-predictions.json','public/ml/models.json','public/ml/evaluation.json','public/ml/history.json','public/ml/replay.json','public/ml/summary.json','tests/fixtures/ml-parity.json','docs/ML_EVALUATION.md','docs/evidence/ml/confusion.png','docs/evidence/ml/calibration.png']
rows=[]
for path in paths:
 before=hashlib.sha256((project/path).read_bytes()).hexdigest();after=hashlib.sha256((scratch/path).read_bytes()).hexdigest();rows.append({'path':path,'expected':before,'actual':after,'identical':before==after})
report={'scope':'Unchanged pipeline imported with output paths redirected into ignored scratch; original source-data loader retained. Full training/evaluation/export. No committed data or model writes.','results':rows,'passed':all(row['identical'] for row in rows)}
(project/'docs/evidence/ui-reproducibility.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');print(json.dumps({'artifacts':len(rows),'byte_identical':sum(row['identical'] for row in rows),'passed':report['passed']}));assert report['passed']
