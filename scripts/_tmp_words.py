import json
w=json.load(open('public/goku-origem-parte1/words.json',encoding='utf-8'))['words']
targets=set(['inspiração','ele','akira','mas','vinte','no','cauda','com','seis','de','segue'])
for i,x in enumerate(w):
    t=x['text'].strip('.,!?:;"').lower()
    if t in targets:
        print(i, round(x['offset'],3), x['text'])