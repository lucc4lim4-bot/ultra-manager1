"""Clubs for the Copa Sul-Americana and the Mundial de Clubes, added on top of the published era files.

The raw datasets are not needed: clubs that the datasets already carry as external teams ('x:...', with their real
players) become full clubs, everyone else gets a generated squad, exactly like the other filler clubs of build.py.
Existing teams and players keep their ids, so nothing else in the files changes.

    python3 augment_comps.py            # all eras
    python3 augment_comps.py 2026       # one era
"""
import json, random, sys, os
from collections import Counter, defaultdict
from build import fill_team, est_attrs, est_pot, OUT, ERA_REF
from common import TEAMS_BY_KEY, lineup_name, clamp
from nations import NATIONS
from structures import SULA_FILL, OFC_FILL
from extras import STADIUMS, TEAM_LEVEL

# dataset club names (external teams) that are these clubs, per era
SOURCES = {
    2026: {'unionespanola': ['x:Unión Española'], 'bostonriver': ['x:Boston River'], 'cerrolargo': ['x:Cerro Largo'],
           'guarani': ['x:Guaraní'], 'luqueno': ['x:Sportivo Luqueño'], 'nacionalpotosi': ['x:Nacional Potosí'],
           'melgar': ['x:FBC Melgar'], 'cienciano': ['x:Cienciano'], 'idv': ['x:Independiente del Valle', 'x:IDV'],
           'ucatolicaecu': ['x:Universidad Católica del Ecuador'], 'oncecaldas': ['x:Once Caldas'],
           'carabobo': ['x:Carabobo FC'], 'laguaira': ['x:Dep. La Guaira']},
    2021: {'idv': ['x:Independiente del Valle'], 'laguaira': ['x:Deportivo La Guaira FC'], 'melgar': ['x:FBC Melgar'],
           'santafe': ['x:Club Independiente Santa Fe'], 'alwaysready': ['x:Club Always Ready'],
           'huachipato': ['x:CD Huachipato'], 'nacionalpotosi': ['x:Club Atlético Nacional Potosí'],
           'cerrolargo': ['x:Cerro Largo Fútbol Club']},
    2016: {'unionespanola': ['x:Unión Española'], 'huachipato': ['x:CD Huachipato'], 'millonarios': ['x:Millonarios FC'],
           'santafe': ['x:Independiente Santa Fe'], 'oncecaldas': ['x:Once Caldas']},
}
NEIGHBOURS = {'CONMEBOL': ['ARG', 'URU', 'COL', 'PAR', 'BRA'], 'OFC': ['NZL', 'ENG', 'AUS', 'FIJ'], 'UEFA': ['FRA', 'ESP', 'POR']}
PREF_NUM = {'GK': [1, 12, 13, 31, 25, 30], 'RB': [2, 22, 26, 32], 'LB': [3, 16, 33, 28], 'CB': [4, 5, 6, 15, 24, 34, 35],
            'CDM': [5, 6, 8, 16, 18, 36], 'CM': [8, 6, 14, 18, 20, 21, 27, 38], 'CAM': [10, 8, 20, 21, 23, 39],
            'RM': [7, 17, 19, 22], 'LM': [11, 17, 19, 27], 'RW': [7, 11, 17, 19, 47], 'LW': [11, 7, 17, 19, 77],
            'ST': [9, 19, 29, 39, 99]}


def augment(era):
    path = f'{OUT}/era{era}.json'
    d = json.load(open(path, encoding='utf-8'))
    if 'sula' in d['struct']:
        print(f'era {era}: already has the Sul-Americana clubs, nothing to do')
        return
    P = d['pcols']
    ci = {k: i for i, k in enumerate(P)}
    rnd = random.Random(era * 13 + 5)
    ref = ERA_REF[era]
    pools = d['names']
    used = set(p[ci['name']] for p in d['players'])
    by_key = {t[1]: t for t in d['teams']}
    by_team = defaultdict(list)
    for p in d['players']:
        by_team[p[ci['team']]].append(p)
    next_tid = max(t[0] for t in d['teams']) + 1
    next_pid = max(p[0] for p in d['players']) + 1
    pid0 = next_pid
    ids = {}
    for key in SULA_FILL + OFC_FILL:
        info = TEAMS_BY_KEY[key]
        srcs = [by_key[k] for k in SOURCES.get(era, {}).get(key, []) if k in by_key]
        if srcs:
            row = srcs[0]
            for extra in srcs[1:]:  # same club listed twice by the datasets
                for p in by_team.pop(extra[0], []):
                    p[ci['team']] = row[0]
                    by_team[row[0]].append(p)
            if len(srcs) > 1:  # one shirt per number
                taken = set()
                for p in sorted(by_team[row[0]], key=lambda p: -p[ci['ovr']]):
                    if p[ci['num']] in taken:
                        p[ci['num']] = next(n for n in PREF_NUM.get(p[ci['pos']], []) + list(range(2, 100)) if n not in taken)
                    taken.add(p[ci['num']])
        else:
            row = [next_tid, key, '', '', '', '', '', 0, '', 1]
            next_tid += 1
            d['teams'].append(row)
        row[1:9] = [key, info['name'], info['short'], info['country'], info['c1'], info['c2'], 0, STADIUMS.get(key, '')]
        ids[key] = row[0]
        tid = row[0]
        have = by_team.get(tid, [])
        # squad top-up with generated players (same recipe as build.py)
        plist = [dict(pos=[p[ci['pos']]], ovr=p[ci['ovr']], age=p[ci['age']]) for p in have]
        ctry = info['country']
        conf = NATIONS.get(ctry, ('', 'UEFA'))[1]
        nb = [n for n in NEIGHBOURS.get(conf, ['ENG']) if n != ctry]
        nat_mix = [(ctry, 0.82)] + [(n, 0.18 / len(nb)) for n in nb]
        lvl = TEAM_LEVEL.get(era, {}).get(key)
        if not have and lvl is None:
            lvl = 62
        add = fill_team(key, plist, lvl, nat_mix, rnd, pools, used, min_size=24 if not have else 23) if len(have) < 23 else []
        usedn = set(p[ci['num']] for p in have)
        for g in add:
            pos = g['pos'][0]
            num = next(n for n in PREF_NUM.get(pos, []) + list(range(2, 100)) if n not in usedn)
            usedn.add(num)
            a = g.get('a') or est_attrs(g['ovr'], pos, rnd)
            pot = max(g.get('pot') or est_pot(g['ovr'], g['age'], rnd), g['ovr'])
            contract = ref.year + rnd.choice([1, 1, 2, 2, 3, 3, 4, 5])
            row_p = [next_pid, g['name'], g.get('short') or lineup_name(g['name']), tid, pos, '', int(g['age']), int(g['ovr']),
                     int(pot), g['nat'], g.get('foot', 'R'), int(g.get('h') or 180)] + [int(x) for x in a] + [num, contract, 0]
            next_pid += 1
            d['players'].append(row_p)
            by_team[tid].append(row_p)
        # finances: small South American / Oceanian clubs
        o = sorted((p[ci['ovr']] for p in by_team[tid]), reverse=True)[:16]
        avg = sum(o) / len(o)
        row[9] = int(clamp(1 + (1 if avg >= 77 else 0 if avg >= 70 else -1), 1, 6))
    d['struct']['sula'] = [ids[k] for k in SULA_FILL]
    d['struct']['ofc'] = [ids[k] for k in OFC_FILL]
    d['struct']['pid0'] = pid0  # first player id added by this script (old saves import these clubs)
    # national player counts
    cnt = Counter(p[ci['nat']] for p in d['players'])
    for n in d['nations']:
        n[5] = cnt.get(n[0], 0)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
    print(f'era {era}: +{len(SULA_FILL) + len(OFC_FILL)} clubs ({sum(1 for k in ids if SOURCES.get(era, {}).get(k))} from the datasets), '
          f'+{next_pid - pid0} generated players, {len(d["teams"])} teams, {len(d["players"])} players, {os.path.getsize(path) / 1e6:.2f} MB')


if __name__ == '__main__':
    for e in [int(x) for x in sys.argv[1:]] or [2026, 2021, 2016]:
        augment(e)
