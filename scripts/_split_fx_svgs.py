from pathlib import Path
base = Path('public')

smoke_all = (base/'fx-fumaca-susto-buzina-16bit.svg').read_text(encoding='utf-8')
# extract defs
defs = smoke_all.split('<defs>')[1].split('</defs>')[0]
# smoke only
smoke = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 40 38 16" width="600" height="253" role="img" aria-label="Fumaça 16-bits">
  <defs>{defs}</defs>
  <g id="fx-smoke">
    <path class="o" d="M12 44h4v-2h8v2h2v2h2v6h-2v2H12v-2h-2v-6h2z" />
    <path class="sm" d="M13 45h3v-2h6v2h2v1h2v5h-2v1H13v-1h-2v-5h2z" />
    <path class="sml" d="M16 44h5v2h-5z" />
    <path class="smd" d="M12 50h14v2H12z" />
    <path class="o" d="M28 48h4v-2h6v2h2v5h-2v1h-8v-1h-2z" />
    <path class="sm" d="M29 49h3v-2h4v2h2v3h-2v1h-6v-1h-1z" />
    <path class="smd" d="M29 52h9v1h-9z" />
    <path class="o" d="M41 51h6v4h-6z" />
    <path class="sm" d="M42 52h4v2h-4z" />
  </g>
</svg>'''
(base/'fx-smoke-16bit.svg').write_text(smoke, encoding='utf-8')

scared = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="54 8 22 24" width="400" height="436" role="img" aria-label="Susto 16-bits">
  <defs>{defs}</defs>
  <g id="fx-scared">
    <path class="o" d="M56 10h6v12h-2v2h-2v-2h-2zm0 16h6v4h-6z" />
    <path class="ex" d="M57 11h4v10h-4zm0 16h4v2h-4z" />
    <rect class="exl" x="58" y="12" width="1" height="7" />
    <path class="o" d="M68 16h2v2h2v2h2v4h-2v2h-4v-2h-2v-4h2v-2h2z" />
    <path class="sw" d="M69 18h1v2h1v2h1v2h-1v1h-2v-1h-1v-2h1v-2z" />
    <rect class="swl" x="69" y="20" width="1" height="2" />
  </g>
</svg>'''
(base/'fx-scared-16bit.svg').write_text(scared, encoding='utf-8')

horn = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="76 20 13 18" width="300" height="415" role="img" aria-label="Buzina 16-bits">
  <defs>{defs}</defs>
  <g id="fx-horn">
    <path class="o" d="M78 24h2v2h2v8h-2v2h-2v-2h2v-8h-2zm5-3h2v3h2v10h-2v3h-2v-2h2v-12h-2z" />
    <path class="bz" d="M79 25h1v9h-1zm5-3h1v14h-1z" />
  </g>
</svg>'''
(base/'fx-horn-16bit.svg').write_text(horn, encoding='utf-8')

imp_all = (base/'fx-impacto-poeira-16bit.svg').read_text(encoding='utf-8')
defs2 = imp_all.split('<defs>')[1].split('</defs>')[0]
impact = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 38 34" width="500" height="447" role="img" aria-label="Impacto 16-bits">
  <defs>{defs2}</defs>
  <g id="fx-impact">
    <path class="o" d="M24 10h4v6h4v-4h4v6h6v4h-6v4h6v4h-6v6h-4v-4h-4v6h-4v-6h-4v4h-4v-6h-6v-4h6v-4h-6v-4h6v-6h4v4h4z" />
    <path class="spo" d="M25 11h2v6h5v-4h2v6h6v2h-6v6h6v2h-6v6h-2v-4h-5v6h-2v-6h-5v4h-2v-6h-6v-2h6v-6h-6v-2h6v-6h2v4h5z" />
    <path class="sp" d="M26 14v5h6v-3v3h6v4h-6v5v-3h-6v5v-5h-5v3v-3h-5v-4h5v-3v3h5z" />
    <rect class="spl" x="25" y="21" width="2" height="3" />
  </g>
</svg>'''
(base/'fx-impact-16bit.svg').write_text(impact, encoding='utf-8')

dust = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 36 48 20" width="600" height="250" role="img" aria-label="Poeira 16-bits">
  <defs>{defs2}</defs>
  <g id="fx-dust">
    <path class="o" d="M44 46h4v-2h8v2h2v6h-2v2H44v-2h-2v-6h2z" />
    <path class="dt" d="M45 47h3v-2h6v2h1v4h-1v1h-9v-1h-1z" />
    <rect class="dtl" x="47" y="46" width="5" height="2" />
    <rect class="dtd" x="45" y="51" width="10" height="1" />
    <path class="o" d="M58 40h4v-2h10v2h2v2h2v8h-2v2H58v-2h-2v-8h2z" />
    <path class="dt" d="M59 41h3v-2h8v2h1v1h1v6h-1v1H59v-1h-2v-6h2z" />
    <rect class="dtl" x="61" y="40" width="6" height="2" />
    <rect class="dtd" x="59" y="48" width="12" height="2" />
    <path class="o" d="M74 47h4v-2h8v2h2v5h-2v2H74v-2h-2v-5h2z" />
    <path class="dt" d="M75 48h3v-2h6v2h1v3h-1v1h-9v-1h-1z" />
    <rect class="dtl" x="77" y="47" width="4" height="1" />
    <rect class="dtd" x="75" y="51" width="10" height="1" />
  </g>
</svg>'''
(base/'fx-dust-16bit.svg').write_text(dust, encoding='utf-8')

shake = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="52 10 26 18" width="400" height="277" role="img" aria-label="Tremor 16-bits">
  <defs>{defs2}</defs>
  <g id="fx-shake">
    <path class="o" d="M56 12h14v2H56zm4 4h14v2H60zm-6 4h12v2H54zm8 4h12v2H62z" />
    <path class="sh" d="M57 13h12v1H57zm4 4h12v1H61zm-6 4h10v1H55zm8 4h10v1H63z" />
  </g>
</svg>'''
(base/'fx-shake-16bit.svg').write_text(shake, encoding='utf-8')
print('ok')
