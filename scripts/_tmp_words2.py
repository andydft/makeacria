import json
w=json.load(open('public/goku-origem-parte2/words.json',encoding='utf-8'))['words']
targets=set(['Quando','Mas','Aquela','Depois','E','O','De','Segue'])
for i,x in enumerate(w):
    t=x['text'].strip('.,!?:;"').lower()
    if t in [k.lower() for k in targets]:
        print(i, round(x['offset'],3), x['text'])