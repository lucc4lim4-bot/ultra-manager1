import json
from collections import defaultdict
from common import TEAMS_BY_KEY

# extra everyday names (Portuguese display names vs. names people use for image files)
EXTRA_ALIASES = {
    'bayern': ['Bayern Munich', 'Bayern Munchen'], 'inter': ['Inter Milan', 'Internazionale'], 'milan': ['AC Milan'],
    'atletimadrid': ['Atletico Madrid', 'Atlético de Madrid'], 'atleticomadrid': ['Atletico Madrid'], 'manutd': ['Man United'],
    'mancity': ['Man City'], 'tottenham': ['Spurs'], 'psg': ['Paris Saint Germain'], 'dortmund': ['BVB', 'Borussia Dortmund'],
}
def aliases_for(key, name):
    t = TEAMS_BY_KEY.get(key)
    al = list(t['aliases']) if t else []
    al += EXTRA_ALIASES.get(key, [])
    return [a for a in dict.fromkeys(al) if a and a != name]

d = json.load(open('/home/claude/game/data/era2026.json'))
by = defaultdict(list)
for p in d['players']:
    by[p[3]].append(p[7])
out = []
for t in d['teams']:
    tid, key, name, short, country, c1, c2, ext = t[:8]
    if ext: continue
    o = sorted(by[tid], reverse=True)[:14]
    r = round(sum(o) / len(o), 1) if o else 60
    out.append([key, name, short, country, c1, c2, r, aliases_for(key, name)])
# teams that only exist in older eras (e.g. 2016 swaps)
for era in (2021, 2016):
    e = json.load(open(f'/home/claude/game/data/era{era}.json'))
    keys = {x[0] for x in out}
    by2 = defaultdict(list)
    for p in e['players']: by2[p[3]].append(p[7])
    for t in e['teams']:
        if t[7] or t[1] in keys: continue
        o = sorted(by2[t[0]], reverse=True)[:14]
        r = round(sum(o) / len(o), 1) if o else 60
        out.append([t[1], t[2], t[3], t[4], t[5], t[6], r, aliases_for(t[1], t[2])])
out.sort(key=lambda x: -x[6])
json.dump(out, open('/home/claude/game/data/store.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), out[:3], out[-2:])
