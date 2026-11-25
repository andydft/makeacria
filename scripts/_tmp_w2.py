import json
w=json.load(open('public/goku-origem-parte2/words.json',encoding='utf-8'))['words']
for i,x in enumerate(w):
    t=x['text'].strip('.,!?:;"').lower()
    if t in ['goku','até','era','ele','raditz','então','agora','e','continua']:
        print(i, round(x['offset'],3), x['text'])