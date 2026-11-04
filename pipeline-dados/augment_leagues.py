"""Leagues of the Conference League countries and of the Copa Sul-Americana countries, added on top of the published
era files (see leagues_extra.py for the club lists of each era).

Clubs the datasets already carry as external teams ('x:...', with their real players) become full clubs (duplicates of
the same club are merged), everyone else gets a generated squad. Existing teams and players keep their ids.

    python3 augment_leagues.py            # all eras
    python3 augment_leagues.py 2026       # one era
"""
import json, random, sys, os
from collections import Counter, defaultdict
from build import fill_team, est_attrs, est_pot, OUT, ERA_REF
from common import TEAMS_BY_KEY, lineup_name, clamp, match_team
from nations import NATIONS
from augment_comps import PREF_NUM
import leagues_extra as L

# clubs whose real players were split between the club and an external team of the same club (2026 data)
CORE_MERGE = {2026: {'nacionaluru': ['x:Nacional'], 'barcelonasc': ['x:Barcelona de Guayaquil'],
                     'ferencvaros': ['x:Ferencvárosi Torna Club'], 'millonarios': ['x:Millonarios'],
                     'santafe': ['x:Indep. Santa Fe']}}


def merge_pools(d):
    pools = d['names']
    for nat, (f, l) in L.POOLS_EXTRA.items():
        f, l = f.split(), l.split()
        cur = pools.get(nat) or {'f': [], 'l': [], 'm': []}
        if len(cur['f']) < 45 or len(cur['l']) < 45:
            cur['f'] = list(dict.fromkeys(cur['f'] + f))
            cur['l'] = list(dict.fromkeys(cur['l'] + l))
            cur.setdefault('m', [])
            pools[nat] = cur


def augment(era):
    path = f'{OUT}/era{era}.json'
    d = json.load(open(path, encoding='utf-8'))
    if 'lg2' in d['struct']:
        print(f'era {era}: already has the new leagues, nothing to do')
        return
    P = d['pcols']
    ci = {k: i for i, k in enumerate(P)}
    rnd = random.Random(era * 31 + 7)
    ref = ERA_REF[era]
    merge_pools(d)
    pools = d['names']
    used = set(p[ci['name']] for p in d['players'])
    by_key = {t[1]: t for t in d['teams']}
    by_id = {t[0]: t for t in d['teams']}
    by_team = defaultdict(list)
    for p in d['players']:
        by_team[p[ci['team']]].append(p)
    # external teams by the club they are
    ext_of = defaultdict(list)
    for t in d['teams']:
        if t[7] and str(t[1]).startswith('x:'):
            k = match_team(t[1][2:])
            if k:
                ext_of[k].append(t)
    next_tid = max(t[0] for t in d['teams']) + 1
    next_pid = max(p[0] for p in d['players']) + 1
    pid1 = next_pid
    stadiums = L.stadiums()
    removed = set()
    trimmed = set()
    conv = {}
    leagues = []
    n_conv = n_gen = 0

    def renumber(tid):
        taken = set()
        for p in sorted(by_team[tid], key=lambda p: -p[ci['ovr']]):
            if p[ci['num']] in taken or not p[ci['num']]:
                p[ci['num']] = next(n for n in PREF_NUM.get(p[ci['pos']], []) + list(range(2, 100)) if n not in taken)
            taken.add(p[ci['num']])

    def merge_into(row, extras):
        for extra in extras:
            for p in by_team.pop(extra[0], []):
                p[ci['team']] = row[0]
                by_team[row[0]].append(p)
            removed.add(extra[0])
        if extras:
            renumber(row[0])

    for lgd in L.normal_extra(era):
        code = lgd['id']
        ids = []
        for key in lgd['teams']:
            info = TEAMS_BY_KEY[key]
            if key in by_key and not by_key[key][7]:  # a club the game already had
                ids.append(by_key[key][0])
                continue
            srcs = sorted(ext_of.get(key, []), key=lambda t: -len(by_team.get(t[0], [])))
            if srcs:
                row = srcs[0]
                merge_into(row, srcs[1:])
                conv[row[0]] = [t[0] for t in srcs]
                n_conv += 1
            else:
                row = [next_tid, key, '', '', '', '', '', 0, '', 1]
                next_tid += 1
                d['teams'].append(row)
                by_id[row[0]] = row
                n_gen += 1
            row[1:9] = [key, info['name'], info['short'], info['country'], info['c1'], info['c2'], 0, stadiums.get(key, '')]
            by_key[key] = row
            tid = row[0]
            ids.append(tid)
            have = by_team.get(tid, [])
            plist = [dict(pos=[p[ci['pos']]], ovr=p[ci['ovr']], age=p[ci['age']]) for p in have]
            ctry = info['country']
            home, nb = L.NAT_MIX.get(ctry, (0.82, ['FRA', 'ESP', 'POR']))
            nb = [n for n in nb if n != ctry and n in NATIONS]
            nat_mix = [(ctry, home)] + [(n, (1 - home) / len(nb)) for n in nb]
            if ctry == 'LIE':  # Vaduz plays in Switzerland
                nat_mix = [('SUI', 0.45), ('LIE', 0.25), ('AUT', 0.2), ('GER', 0.1)]
            lvl = L.BASE[code] + L.BONUS.get(key, 0)
            if len(have) >= 11:
                top = sorted((p[ci['ovr']] for p in have), reverse=True)[:11]
                lvl = max(lvl, sum(top) / 11 - 1)
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
            o = sorted((p[ci['ovr']] for p in by_team[tid]), reverse=True)[:16]
            avg = sum(o) / len(o)
            row[9] = 1 if avg < 64 else 2 if avg < 70 else 3 if avg < 75 else 4 if avg < 79 else 5
        lgd = dict(lgd)
        lgd['teams'] = ids
        leagues.append(lgd)
    # clubs of the game whose real players were partly kept as an external team
    for key, names in CORE_MERGE.get(era, {}).items():
        row = by_key.get(key)
        extras = [by_key[n] for n in names if n in by_key]
        if not row or not extras:
            continue
        merge_into(row, extras)
        sq = sorted(by_team[row[0]], key=lambda p: p[ci['ovr']] + (6 if p[ci['age']] <= 21 else 0), reverse=True)
        for p in sq[32:]:  # keep the squad at a sane size
            trimmed.add(p[0])
        by_team[row[0]] = sq[:32]
    # leftovers: external teams with no player left
    for t in d['teams']:
        if t[7] and str(t[1]).startswith('x:') and not by_team.get(t[0]):
            removed.add(t[0])
    d['teams'] = [t for t in d['teams'] if t[0] not in removed]
    d['players'] = [p for p in d['players'] if p[0] not in trimmed]
    d['struct']['normal'] = d['struct']['normal'] + leagues
    d['struct']['lg2'] = {'pid1': pid1, 'conv': {str(k): v for k, v in conv.items()}, 'leagues': [l['id'] for l in leagues]}
    cnt = Counter(p[ci['nat']] for p in d['players'])
    for n in d['nations']:
        n[5] = cnt.get(n[0], 0)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
    print(f'era {era}: {len(leagues)} leagues, {sum(len(l["teams"]) for l in leagues)} clubs ({n_conv} from the datasets, '
          f'{n_gen} generated), +{next_pid - pid1} generated players, {len(removed)} external teams merged/removed, '
          f'{len(d["teams"])} teams, {len(d["players"])} players, {os.path.getsize(path) / 1e6:.2f} MB')


if __name__ == '__main__':
    for e in [int(x) for x in sys.argv[1:]] or [2026, 2021, 2016]:
        augment(e)
