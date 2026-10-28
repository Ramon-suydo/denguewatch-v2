import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const local=process.platform==='win32'?'.artifacts/ml-venv/Scripts/python.exe':'.artifacts/ml-venv/bin/python';
const python=process.env.ML_PYTHON||(existsSync(local)?local:process.platform==='win32'?'python':'python3');
const args=process.argv[2]==='test'?['-m','unittest','discover','-s','tests','-p','expanded_count_test.py']:['ml/manila_count.py','evaluate'];
const result=spawnSync(python,args,{stdio:'inherit',env:{...process.env,OMP_NUM_THREADS:'1',OPENBLAS_NUM_THREADS:'1',MKL_NUM_THREADS:'1'}});
if(result.error)throw result.error;
process.exit(result.status??1);
