"""Refresh website data: python scripts/import_workbook.py path/to/workbook.xlsx"""
import sys,json,datetime
from pathlib import Path
import openpyxl
w=openpyxl.load_workbook(sys.argv[1],data_only=True)
rows=[]
ratings={r[0]:r[17] for r in list(w['Main'].values)[1:] if r[0]}
keys=['match','seconds','kills','deaths','assists','damage','cs','gold','vision','firstBlood','win','cspm','gpm','dpm','vpm','teamKills','kp','champion','lane','cc']
for s in w:
    if s.cell(1,1).value!='Match ID': continue
    for r in list(s.values)[1:]:
        if not isinstance(r[0],(int,float)): continue
        d=dict(zip(keys,r));d['player']=s.title;d['match']=str(int(d['match']))
        t=d['seconds'];d['seconds']=t.hour*3600+t.minute*60+t.second if isinstance(t,datetime.time) else float(t)*86400
        rows.append(d)
out={'source':Path(sys.argv[1]).name,'season':'2026–27','ratings':ratings,'rows':rows}
target=Path(__file__).resolve().parents[1]/'docs'/'data.json'
target.write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(f'Imported {len(rows)} player records across {len(set(r["match"] for r in rows))} matches')
