"""Original storybook vector artwork. Run with Python 3; no dependencies.
Shared lighting/eyes give cohesion; each animal has its own composed silhouette.
Coordinates use a 400x400 artboard. Output SVGs are the shipped source assets.
"""
from pathlib import Path
from html import escape
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'animals'
OUT.mkdir(parents=True, exist_ok=True)
INK = '#4b3c36'
def ellipse(x,y,rx,ry,c,extra=''):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" {extra}/>'
def circle(x,y,r,c,extra=''): return ellipse(x,y,r,r,c,extra)
def path(d,c,stroke=None,w=4,extra=''):
    return f'<path d="{d}" fill="{c}"'+(f' stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"' if stroke else '')+f' {extra}/>'
def line(d,c=INK,w=3): return path(d,'none',c,w)
def eyes(x,y,gap=28,size=8):
    return ''.join(ellipse(x+i*gap,y,size,size*1.2,INK)+circle(x+i*gap-2,y-3,2.4,'#fff') for i in [-1,1])
def blush(x,y,gap=40): return ellipse(x-gap,y,11,6,'#eaa6a0','opacity=".55"')+ellipse(x+gap,y,11,6,'#eaa6a0','opacity=".55"')
def smile(x,y): return line(f'M{x-10} {y}q10 12 20 0',w=2.8)
def nose(x,y,c=INK): return path(f'M{x-8} {y}Q{x} {y-5} {x+8} {y}Q{x+6} {y+8} {x} {y+9}Q{x-6} {y+8} {x-8} {y}',c)
def paws(c,y=330): return ellipse(154,y,28,17,c)+ellipse(246,y,28,17,c)
def face(x,y,gap=28): return eyes(x,y,gap)+blush(x,y+18,gap+18)+smile(x,y+33)
def spots(items,c): return ''.join(ellipse(*item,c) for item in items)
def write(id,name,color,body):
    # Directional gradients and soft edge shading; no ground or contact platform.
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-labelledby="title"><title id="title">{escape(name)}</title><defs><linearGradient id="fur" x1=".15" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="{color}"/><stop offset="1" stop-color="{color}" stop-opacity=".78"/></linearGradient><radialGradient id="warm"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#f0e3cc"/></radialGradient><filter id="soft" x="-.2" y="-.2" width="1.4" height="1.4"><feDropShadow dx="0" dy="4" stdDeviation="2" flood-color="#594332" flood-opacity=".1"/></filter></defs><g filter="url(#soft)">{body}</g></svg>'''
    (OUT/f'{id}.svg').write_text(svg+'\n')
F='url(#fur)'; W='url(#warm)'
# Dog: flopping velvet ears, a patch around one eye, wagging tail and soft muzzle.
write('dog','Pes','#cf9b68',
    path('M268 295q60-49 46-76-34 9-28 52',F)+ellipse(200,282,65,64,F)+ellipse(200,292,39,47,W)+paws(F)+
    path('M138 118Q78 91 81 183q5 55 38 26l35-60M260 118q60-27 59 65-6 55-39 26l-35-60','#9d6948')+
    path('M122 163q0-74 78-72 78-2 78 72v40q-6 52-78 52-72 0-78-52Z',F)+ellipse(240,173,30,38,'#a46d49')+
    eyes(200,178,36)+ellipse(200,212,44,29,W)+nose(200,201)+line('M200 211v12m0-1q-15 12-23-1m23 1q15 12 23-1')+blush(200,210,58)+path('M192 233q8 25 18 0','#e49d97')+line('M147 328v10m13-11v11m82-11v11m13-11v10','#ad8058',2))
# Cat: pointed ears, whiskers, curved upright tail and white bib.
write('cat','Kočka','#d3a27d',
    path('M261 316q72 3 55-93-7-38-27-21-8 8 4 34 25 60-34 50',F)+ellipse(200,284,63,65,F)+path('M166 248q33 17 68 0l-14 73h-42Z',W)+paws(F)+
    path('M123 159 115 85q2-14 18-5l45 33q25-8 47 0l45-33q16-8 15 9l-8 70q23 83-77 88-100-5-77-88',F)+
    path('m131 139-3-40 35 26m74 0 35-26-4 40','#e6b2a1')+path('m184 112 8 23 8-27 9 27 8-24','#b7815b')+
    eyes(200,174,37)+blush(200,199,49)+nose(200,195,'#b87871')+line('M200 204q-11 15-21 2m21-2q11 15 21 2')+line('m147 203-37-7m38 20-38 5m143-18 37-7m-38 20 38 5','#88654d',2))
# Rabbit: tall asymmetric ears, pillowy cheeks and little folded front paws.
write('rabbit','Králík','#d7c6b1',
    circle(270,298,27,W)+ellipse(200,283,66,68,F)+ellipse(200,291,44,46,W)+paws(W)+
    path('M135 143Q94 36 130 27q31-9 51 105M216 129Q224 23 257 33q40 14 1 114',F)+
    path('M144 120q-25-68-12-70 15-5 30 74m72-1q10-71 23-69 18 4-14 75','#e6b6b1')+
    ellipse(200,192,86,72,F)+ellipse(168,214,32,29,W)+ellipse(232,214,32,29,W)+eyes(200,181,35)+blush(200,207,59)+nose(200,207,'#bc8b89')+line('M200 216v9m0-1q-10 10-18 0m18 0q10 10 18 0')+path('m190 234 3 15h15l3-15','#fffdf4')+ellipse(165,282,14,27,F)+ellipse(235,282,14,27,F))
# Hamster: little rounded ears, big stuffed cheeks, tiny hands and seed.
write('hamster','Křeček','#dca86a',
    ellipse(200,270,86,77,F)+paws('#e6b1a0',337)+circle(143,125,31,F)+circle(257,125,31,F)+circle(143,125,18,'#e8b7a4')+circle(257,125,18,'#e8b7a4')+
    ellipse(200,211,94,92,F)+path('M112 204q24-25 49 10 39 23 78 0 25-35 49-10 15 100-88 102-103-2-88-102',W)+eyes(200,186,36)+blush(200,221,62)+nose(200,215,'#b98075')+smile(200,235)+
    ellipse(200,283,18,29,'#b18b57')+path('m200 262-3 39','#f0cf89')+ellipse(165,278,18,12,'#e9b9a9')+ellipse(235,278,18,12,'#e9b9a9'))
# Horse: long head, mane, ears, hoofed legs and flowing tail.
write('horse','Kůň','#bb8965',
    path('M276 236q59-28 51 69-23-35-43-19','#725646')+ellipse(212,257,82,54,F)+path('M148 278v58h27l10-59m56-2 8 61h27l-6-69',F)+path('M148 324h27v17h-27m100-17h28v17h-28','#755948')+
    path('M130 248q-15-60-4-104 8-64 60-65 57 12 50 73l-30 109','#725646')+path('M145 123 130 61q27-13 39 42m23 4 18-53q31 6 17 64',F)+path('M133 149q10-59 62-42 42 13 32 71l-6 59q-10 48-66 34-48-14-27-68Z',F)+
    path('M146 108q26-37 65 0l-28 38 1-30-27 25Z','#725646')+ellipse(173,235,51,37,'#e4bd98')+eyes(177,168,27,7)+ellipse(151,231,5,7,'#9b6f54')+ellipse(195,239,5,7,'#9b6f54')+line('M153 250q15 14 30 4'))
# Cow: little horns, floppy ears, broad pink muzzle, patches and hooves.
write('cow','Kráva','#ede6d5',
    line('M276 259q43 13 27 54','#c4b6a0',8)+path('m302 301-12 27q30 8 23-19','#716559')+ellipse(207,276,83,54,F)+ellipse(239,265,30,25,'#87786a')+path('M146 294v42h25l6-39m62 1 6 38h25v-48',F)+path('M146 329h25v14h-25m99-14h25v14h-25','#76675c')+
    path('M143 127q-27-34-10-52 10 25 32 25m72 27q27-34 10-52-10 25-32 25','#d8b886')+path('M132 132q-48-32-54 4 6 35 54 26m136-30q48-32 54 4-6 35-54 26',F)+
    ellipse(200,176,77,78,F)+path('M136 143q16-37 48-36l-6 70q-38 30-45-7','#887869')+eyes(200,164,34)+ellipse(200,217,70,39,'#e7b5a7')+ellipse(172,215,8,6,'#b8847c')+ellipse(228,215,8,6,'#b8847c')+smile(200,234)+blush(200,202,55))
# Pig: curl, triangular ears, oversized snout and cloven feet.
write('pig','Prase','#e6aa9d',
    line('M281 281q43 8 28-17-15-16-17 3 0 19 27 13','#cd8d83',7)+ellipse(200,274,85,65,F)+paws('#c6847d')+
    path('M138 150q-31-12-34-59 34-7 66 35m60 0q32-42 66-35-3 47-34 59',F)+path('m130 126-10-22 35 24m90 0 35-24-10 22','#cf8e86')+
    ellipse(200,192,91,80,F)+eyes(200,174,37)+blush(200,205,63)+ellipse(200,217,45,31,'#d69188')+ellipse(183,215,6,10,'#a86562')+ellipse(217,215,6,10,'#a86562')+smile(200,249)+line('M154 328v15m92-15v15','#98615e',2))
# Sheep: scalloped fleece, wool cap, dark face and little legs.
fleece=''.join(circle(x,y,r,W) for x,y,r in [(140,255,38),(160,224,39),(203,219,43),(247,232,39),(265,270,38),(241,302,40),(198,310,43),(154,301,40)])
write('sheep','Ovce','#9d8b7c',path('M152 301v40h25v-41m48 0v41h25v-40',F)+fleece+path('M145 145q-46-33-51 0 6 35 53 22m106-22q46-33 51 0-6 35-53 22',F)+ellipse(200,178,61,73,F)+''.join(circle(x,y,r,W) for x,y,r in [(151,116,25),(177,99,27),(207,98,29),(238,111,27),(254,131,23)])+eyes(200,173,24)+nose(200,205)+smile(200,221)+blush(200,198,42))
# Chicken: plump white body, layered wings, red comb and orange feet.
write('chicken','Slepice','#f2e8cd',path('m153 319-8 22m8-2-21 9m15-7 18 5m77-27 8 22m-8-2 21 9m-15-7-18 5','none','#cf9c58',7)+path('M266 271q69-47 44-80-27 3-31 35 6-52-24-42-23 26-1 70',F)+ellipse(200,257,89,79,F)+path('M132 227q-25 79 44 77-42-29-29-58', '#e1d4b6')+path('M181 114q-36-40-13-51 17-8 26 22-2-49 22-36 13 8 3 36 37-25 41-2 1 23-38 35','#c97060')+circle(207,159,64,F)+path('M210 203q-18 27 2 34 20-6 13-34','#c97060')+eyes(207,154,27)+path('m192 179 31-5 13 13-28 19Z','#dba95e')+blush(207,177,44))
# Duck: long curved neck, broad beak, tail curl and flat webbed feet.
write('duck','Kachna','#e5cf78',path('M141 313q-24 13-25 27 25 12 59-2l-5-25m64 0q-4 21 0 27 34 12 55-4-8-17-28-21','#d7a159')+path('M136 241q-26-22-38-11-11 15 23 47',F)+ellipse(195,278,89,51,F)+path('M232 272q-36-43-27-91 6-28 37-21 22 22 17 52l19 58',F)+circle(239,157,55,F)+path('M274 160q68-12 63 10-2 23-66 19','#d7a159')+path('M274 176q40 4 55-5','none','#b3864b',2)+eyes(245,147,21,7)+blush(245,173,31)+path('M149 259q54-13 63 22-23 31-63 3','#d1ba65')+line('M163 271q19-3 29 9','#bdad5a',2))
# Lion: sunburst mane, rounded ear tips, paw pads and a tufted tail.
mane=''.join(circle(x,y,r,'#b88751') for x,y,r in [(131,143,32),(145,108,35),(184,91,35),(224,95,35),(263,120,35),(279,162,33),(266,203,36),(231,226,34),(187,226,36),(147,211,37),(122,180,32)])
write('lion','Lev','#dbb777',line('M260 300q58-6 46-61','#c2a067',12)+ellipse(303,235,13,22,'#a57748')+ellipse(200,283,64,62,F)+ellipse(200,289,35,42,W)+paws(F)+mane+circle(145,133,22,F)+circle(255,133,22,F)+ellipse(200,165,66,62,F)+eyes(200,157,28)+ellipse(182,190,25,19,W)+ellipse(218,190,25,19,W)+nose(200,178)+line('M200 187v10m0-1q-13 12-24 0m24 0q13 12 24 0')+blush(200,181,45))
# Tiger: striped cheeks, forehead, legs and curled tail.
write('tiger','Tygr','#dfa05c',path('M261 300q69 2 51-63-12-25-28-10 17 32-18 44',F)+line('m302 243-15 6m18 15-19 3','#71503c',8)+ellipse(200,284,65,62,F)+ellipse(200,290,34,42,W)+paws(F)+circle(141,123,28,F)+circle(259,123,28,F)+circle(141,123,16,'#7d573e')+circle(259,123,16,'#7d573e')+ellipse(200,180,83,76,F)+path('m173 110 12 31 9-34m17 0 5 34 12-31m-109 52 36 12-37 7m161-19-36 12 37 7m-154 18 26 10-22 8m142-18-26 10 22 8','#79543c')+eyes(200,176,33)+ellipse(180,212,29,24,W)+ellipse(220,212,29,24,W)+nose(200,199,'#a06d60')+line('M200 208v10m0-1q-12 13-23 0m23 0q12 13 23 0')+line('m146 319 21-4m67 0 20 4','#79543c',7))
# Elephant: enormous ears, domed head, curved trunk and chunky toes.
write('elephant','Slon','#aabec3',line('M272 282q46-6 33 30','#8d9fa4',7)+ellipse(200,277,78,66,F)+paws(F)+ellipse(117,186,57,75,F)+ellipse(283,186,57,75,F)+ellipse(115,187,38,54,'#d6b5b0')+ellipse(285,187,38,54,'#d6b5b0')+ellipse(200,179,74,81,F)+eyes(200,168,35)+blush(200,198,53)+path('M178 192q-8 54 10 85 26 41 66 7 13-13 0-22-10-4-21 7-13 9-17-9l6-67',F)+line('M182 221h31m-29 17h27m-20 19 22-3','#859ca3',2)+path('M163 207q-22 32 2 34m69-34q22 22 12 30',W)+spots([(143,334,7,8),(158,336,7,8),(240,336,7,8),(255,334,7,8)],'#d8e0db'))
# Giraffe: high head, long spotted neck, ossicones and short mane.
write('giraffe','Žirafa','#ddbd75',path('M259 280q42-3 32 44','none','#b5945c',7)+ellipse(291,324,9,15,'#866744')+ellipse(211,283,75,43,F)+path('M154 301v41h23l7-40m49-3 10 43h23l-4-49',F)+path('M163 284 170 129l50-4 20 158',F)+path('M216 128q20 80 21 143l-14-1-16-141','#ae834b')+path('m168 109-4-36m51 31 8-38','none','#b79353',8)+circle(163,69,11,'#967344')+circle(224,64,11,'#967344')+path('M163 119q-38-40-48-10 5 27 46 26m67-16q36-42 48-14-5 26-45 28',F)+ellipse(197,135,49,44,F)+ellipse(197,159,50,26,'#eed5a3')+eyes(196,127,24,6)+spots([(180,155,4,3),(214,155,4,3)],'#ad8955')+smile(197,169)+spots([(185,199,9,13),(205,229,10,12),(186,259,9,11),(234,285,12,9),(156,280,11,10),(252,269,9,8)],'#b88a4e')+line('m154 338 22 0m68 0h21','#8f7149',7))
# Zebra: long striped face, upright mane and black stocking hooves.
write('zebra','Zebra','#f2eadb',path('M264 260q46-12 43 60','none','#aaa698',6)+ellipse(305,322,9,18,'#5d5b54')+ellipse(213,273,78,45,F)+path('M151 294v45h24l9-43m52-3 8 46h24l-9-50',F)+path('M145 314h31v25h-31m97-1-3-25h27l4 25','#66635b')+path('M164 244q-53-81-25-137 10-20 43-17 45 7 56 64l-24 103','#67665e')+path('m143 122-9-57q24-8 37 42m28-4 13-46q25 4 18 58',F)+path('M138 152q9-52 50-44 47 7 43 59l-13 62q-5 46-56 36-43-10-31-59Z',F)+path('m148 117 15 37 10-43m17 0 2 35 11-29m-68 48 24 15-28 2m1 19 30 10-32 3m97-53-26 15 26 3m-5 19-28 10 24 6m-60 46 22 4-21 9m61 2-22-7 24-3m26 27-13 35 18 3 9-36m-45-9-9 36 17 3 4-37','#65635c')+ellipse(174,239,45,28,'#aaa99e')+eyes(180,168,26,7)+spots([(154,237,4,6),(195,242,4,6)],'#5b5a53')+smile(174,250))
# Bear: broad honey-brown head, small round ears and paw pads.
write('bear','Medvěd','#b88d6b',ellipse(200,278,79,72,F)+ellipse(200,288,48,47,'#d6b492')+paws(F)+circle(134,120,32,F)+circle(266,120,32,F)+circle(134,120,17,'#8d654d')+circle(266,120,17,'#8d654d')+ellipse(200,179,86,77,F)+eyes(200,173,34)+ellipse(200,210,43,32,W)+nose(200,199)+line('M200 207v11m0-1q-13 14-25 0m25 0q13 14 25 0')+blush(200,200,57)+ellipse(132,272,19,37,F)+ellipse(268,272,19,37,F)+ellipse(154,331,17,10,'#8d654d')+ellipse(246,331,17,10,'#8d654d'))
# Panda: dark eye patches, black limbs, bamboo held in a paw.
write('panda','Panda','#ede9dc',ellipse(200,278,76,69,F)+ellipse(145,331,35,20,'#62625b')+ellipse(255,331,35,20,'#62625b')+ellipse(132,274,23,45,'#62625b','transform="rotate(-18 132 274)"')+ellipse(268,273,23,45,'#62625b','transform="rotate(18 268 273)"')+circle(135,117,31,'#62625b')+circle(265,117,31,'#62625b')+ellipse(200,181,86,78,F)+ellipse(163,176,22,30,'#62625b','transform="rotate(25 163 176)"')+ellipse(237,176,22,30,'#62625b','transform="rotate(-25 237 176)"')+eyes(200,174,36,7)+ellipse(200,213,35,22,W)+nose(200,202)+smile(200,226)+blush(200,209,56)+line('M280 326 297 218','#91a274',8)+line('m286 290 13 2m-8-30 13 2m-8-30 13 2','#d6dfbc',3)+path('M294 251q-31-26-36-10 8 21 36 10m5-24q27-24 33-6-8 19-33 6','#82996e'))
# Monkey: coiled tail, wide ears, heart-shaped light facial mask.
write('monkey','Opice','#b18c6c',line('M262 306q86 1 60-72-17-37-37-14-15 24 14 28','#a37d5d',14)+ellipse(200,276,62,71,F)+ellipse(200,289,36,47,W)+paws(F)+circle(120,169,34,F)+circle(280,169,34,F)+circle(120,169,21,'#e1b69b')+circle(280,169,21,'#e1b69b')+ellipse(200,174,78,78,F)+path('M135 171q0-50 37-40 17 5 28 23 12-18 28-23 37-10 37 40 1 70-65 70-66 0-65-70',W)+path('M183 99q-6-35 25-29-12 9-9 25 27-24 39-6-26 1-27 17',F)+eyes(200,171,30)+nose(200,197,'#94735b')+smile(200,214)+blush(200,199,48)+ellipse(132,273,17,40,F)+ellipse(268,273,17,40,F))
# Fox: huge triangular ears, angular white cheeks, bushy white-tipped tail.
write('fox','Liška','#cd8d57',path('M249 310q84 6 93-87-27-39-61-8-39 36-32 95',F)+path('M309 259q39-10 33-36-24-35-49-16 18 15 16 52',W)+ellipse(200,284,56,62,F)+path('M173 250q28 23 54 0l-8 68h-38Z',W)+paws('#86664d')+path('M133 158 116 73q41 0 66 53h36q25-53 66-53l-17 85 23 35-50 44-40 13-40-13-50-44Z',F)+path('m135 132-5-40q23 11 36 39m68 0q13-28 36-39l-5 40','#8c624a')+path('M112 193q39-19 88 32 49-51 88-32l-49 43-39 14-39-14Z',W)+eyes(200,171,37,7)+nose(200,218)+line('M200 226q-10 10-20 0m20 0q10 10 20 0')+blush(200,197,49))
# Frog: high-set eyes, broad green body, splayed feet and cream belly.
write('frog','Žába','#99b58a',ellipse(200,279,73,58,F)+ellipse(200,287,49,39,'#e4e4ae')+ellipse(123,301,39,27,F,'transform="rotate(-25 123 301)"')+ellipse(277,301,39,27,F,'transform="rotate(25 277 301)"')+path('M128 317q-52 1-39 22 16-5 25 4 13 1 25-20m132-6q52 1 39 22-16-5-25 4-13 1-25-20',F)+ellipse(200,193,91,62,F)+circle(150,144,38,F)+circle(250,144,38,F)+circle(150,144,26,'#fff5d9')+circle(250,144,26,'#fff5d9')+eyes(200,145,50,11)+blush(200,200,61)+line('M153 203q47 47 94 0','#5f7958',4)+spots([(183,181,3,3),(216,181,3,3)],'#617d58')+ellipse(155,274,13,30,F)+ellipse(245,274,13,30,F))
# Penguin: tapered flippers, white facial bib, orange beak and flat feet.
write('penguin','Tučňák','#778c96',ellipse(156,335,36,13,'#dcb176')+ellipse(244,335,36,13,'#dcb176')+path('M137 222q-57 27-52 77 14 19 62-42m116-35q57 27 52 77-14 19-62-42',F)+path('M123 222q-5-122 77-122t77 122l4 55q0 65-81 65t-81-65Z',F)+path('M148 179q0-52 28-38l24 24 24-24q28-14 28 38l14 88q12 61-66 61t-66-61Z',W)+eyes(200,183,31)+path('m182 209 18-11 18 11-18 20Z','#dcb176')+blush(200,213,50)+path('M185 108q10-26 25-16l-4 15',F))
# Turtle: domed patterned shell, long neck and four flipper-like legs.
write('turtle','Želva','#9ead80',ellipse(129,309,29,19,F,'transform="rotate(25 129 309)"')+ellipse(256,310,29,19,F,'transform="rotate(-25 256 310)"')+path('m111 279-28-13 15 31',F)+ellipse(192,269,87,58,'#819770')+path('M109 279q-9-96 82-99 89 4 88 99Z','#a4b485','#6e8762',4)+path('m168 188-10 34 26 29 39-10 12-41m-126 79 49-57m26 29-4 29m43-39 54 38m-137-44-20-19m118 19 28-20','none','#6e8762',4)+path('M272 285q-12-40 9-62l32 20-7 49',F)+ellipse(303,222,48,40,F)+eyes(307,217,19,6)+blush(307,236,28)+smile(307,240)+path('M106 280q85 18 172 0','none','#657f5c',6))
# Dolphin: swept rostrum, dorsal fin, curved body and forked tail.
write('dolphin','Delfín','#8cb4bf',path('M190 177q-3-58 32-70-4 28 20 48',F)+path('M277 250q16 42 48 52-4 29-42 16-24 30-41 18 16-30 0-55',F)+path('M102 206Q78 141 144 133q101-15 143 111 11 45-20 59-41-9-52-51-52 19-96-4-55 13-57-8-2-14 40-34Z',F)+path('M113 230q90 33 149 58-25 4-47-36-58 10-102-22',W)+path('M191 220q-17 67 25 61 14-21-1-53',F)+eyes(140,181,23,7)+blush(140,207,36)+line('M80 232q48 18 76-5','#5d8896',3)+path('M104 159q31-17 58-7','none','#d4e6e5',6))
# Whale: huge rounded body, split tail, small flippers and a water fountain.
write('whale','Velryba','#91b4c1',path('M270 254q57 11 51-46-34-7-46 16 5-44-27-35-15 31 0 59',F)+path('M84 230q-2-89 94-89 105 0 110 107 1 77-97 79-101 0-107-97',F)+path('M89 264q86 59 192 8-17 53-90 55-73-2-102-63',W)+path('M169 275q-15 53 24 52 25-9 19-40',F)+eyes(149,231,30)+blush(149,254,46)+smile(149,267)+path('M181 128q-24-51-49-36 2 22 34 27m22 8q-3-64 30-64 16 22-17 47','#a5cbd0')+circle(123,113,6,'#a5cbd0')+circle(235,92,5,'#a5cbd0')+line('M104 286q18 15 31 15m-20-8-4 12m19-4-1 10','#d4c9ae',2))
# Octopus: eight individually curved tentacles with suction cups.
tentacles=[('M141 247q-68 6-65 44 2 33 29 27 21-7 2-18 0-12 44-12',102,299),('M139 273q-49 46-22 63 24 16 37-13l18-35',136,323),('M167 282q-34 68 0 66 25-2 28-61',169,329),('M193 285q-14 70 15 63 24-8 15-65',207,332),('M220 282q2 66 32 58 24-12-2-57',244,325),('M244 274q27 73 55 45 17-24-28-52',282,310),('M258 253q76 19 66 49-17 30-40 1 18-5-30-13',309,289),('M144 244q-76-30-79 9 1 29 28 18 10-9-4-11 16-5 41 11',82,253)]
write('octopus','Chobotnice','#c4a1ba',''.join(path(d,F)+circle(x,y,4,'#e8cadb') for d,x,y in tentacles)+path('M125 234q-12-118 75-118t75 118q-3 58-75 58t-75-58',F)+eyes(200,213,34)+blush(200,239,53)+smile(200,246)+ellipse(169,157,16,9,'#e5c8dc','transform="rotate(-26 169 157)"'))
# Crab: articulated legs, raised pincers and stalk eyes.
legs=''.join(line(d,'#c78369',11) for d in ['M135 274 91 269 70 291','M134 293 93 301 84 321','M152 309 121 328 120 341','M265 274 309 269 330 291','M266 293 307 301 316 321','M248 309 279 328 280 341'])
write('crab','Krab','#d7977e',legs+line('M136 260 105 225 93 195','#cc8b72',14)+line('M264 260 295 225 307 195','#cc8b72',14)+path('M94 213q-53 0-53-42 1-22 17-33l22 36 7-47q53 18 39 57-6 21-32 29',F)+path('M306 213q53 0 53-42-1-22-17-33l-22 36-7-47q-53 18-39 57 6 21 32 29',F)+ellipse(200,274,82,51,F)+line('M165 243v-36m70 36v-36','#bc7a62',9)+circle(165,208,18,F)+circle(235,208,18,F)+eyes(200,207,35,7)+blush(200,276,48)+smile(200,279)+ellipse(177,248,19,6,'#ecc4ac'))
# T-Rex: massive jaw, tiny two-fingered arms, sturdy legs and long tail.
write('trex','T-Rex','#9fac87',path('M161 279q-39 26-77-4-17 60 82 49',F)+ellipse(205,268,64,64,F)+ellipse(222,282,37,43,'#dbe0b6')+path('M166 296q-17 15-9 44h37l9-29m32-9q-7 22 4 38h34q1-29-17-48',F)+path('M185 149q-21-59 38-64 76-9 86 54v54q-7 40-89 29l-30 40-23-39 16-37',F)+path('M220 173q47 13 86-4v28q-25 33-91 11', '#dbe0b6')+path('m237 181 5 11 8-9m27-1 7 10 7-13','#fff7df')+eyes(251,139,26,8)+blush(251,166,38)+line('M222 199q33 14 64-5','#6d805e',3)+path('M202 241q29-12 37 2l-11 8m3-9 1 14','none','#8c9e77',12)+spots([(295,156,3,3),(145,292,6,5),(167,271,5,6)],'#7f936d')+line('M165 332v7m12-7v7m69-7v7m12-7v7','#e3e2bc',3))
# Brontosaurus: extremely long curved neck, tiny head, low body and sweeping tail.
write('brontosaurus','Brontosaurus','#a9b8a1',path('M150 284q-82 15-95-34 1 76 104 65',F)+ellipse(186,290,78,41,F)+path('M128 305v38h26l11-34m53-1 5 35h27v-44',F)+path('M231 300q-18-104 1-155 14-49 51-29 18 23-6 63-25 38-4 113',F)+ellipse(269,115,48,34,F)+ellipse(286,132,37,18,'#dbe0c1')+eyes(275,111,21,6)+smile(283,136)+blush(275,129,29)+spots([(237,217,8,12),(248,178,6,9),(169,279,12,8),(196,292,10,9)],'#8d9f84')+line('M136 335v7m12-7v7m84-7v7m12-7v7','#e1dfc0',3))
# Triceratops: scalloped frill, two brow horns, nose horn and stout body.
frill=''.join(circle(x,y,21,'#a6a6be') for x,y in [(203,151),(218,123),(249,110),(279,116),(303,140),(311,171),(295,201),(261,212),(227,199)])
write('triceratops','Triceratops','#b8b2c9',path('M135 281q-59 4-64-34-3 58 69 65',F)+ellipse(175,284,77,48,F)+path('M121 307v35h27l11-35m43 0 3 35h29l7-41',F)+frill+ellipse(257,162,49,47,'#d8c0cb')+path('M219 158q41-27 71 8l28 55q-4 37-61 35-54-3-52-35Z',F)+path('M225 175q-19-40 0-66 4 34 21 58m27 1q12-49 32-50-13 33-8 62M296 220l29-33q3 26-13 45',W)+eyes(259,198,25,7)+blush(259,223,34)+smile(264,237)+spots([(158,271,12,7),(182,287,8,6)],'#a09cb6')+line('m132 333 0 8m12-8v8m73-8v8','#e5dbd8',3))
# Stegosaurus: a row of large dorsal plates, low head and spiked tail.
plates=''.join(path(d,'#d7ad96','#c3977e',2) for d in ['M111 245 112 210 142 224Z','M139 223 152 173 181 211Z','M178 212 203 163 222 219Z','M216 222 246 186 254 239Z','M251 244 276 220 282 265Z'])
write('stegosaurus','Stegosaurus','#a7b9ae',path('M250 293q69-5 83-54 11 67-75 82',F)+path('m309 276 0-30 15 13m-13 27 30-7-15 19',W)+plates+ellipse(192,274,91,52,F)+path('M130 303v39h27l7-34m53 0 9 34h27v-43',F)+path('M125 269q-28-40-55-13-40 52 29 58l46-15',F)+eyes(92,275,19,6)+blush(92,293,26)+smile(94,300)+spots([(172,257,11,8),(197,279,12,8),(224,260,9,7)],'#8fa69a')+line('M141 333v8m10-8v8m83-8v8m10-8v8','#e0e0c6',3))
assert len(list(OUT.glob('*.svg'))) == 30
print('Created 30 original animal SVGs.')
