import sys, datetime, difflib
from collections import Counter, defaultdict
from common import *
from loaders import *
from structures import ULTRA, ULTRA_SWAP, NORMAL, UCL_FILL, UEL_FILL, LIBER_FILL, SULA_FILL, OFC_FILL

BRAZIL_KNOWLEDGE = {'palmeiras', 'flamengo', 'corinthians', 'saopaulo', 'santos', 'cruzeiro', 'fluminense', 'atleticomg',
                    'botafogo', 'vasco', 'gremio', 'internacional', 'athletico', 'bahia', 'fortaleza', 'ceara', 'sport',
                    'vitoria', 'goias', 'coritiba', 'chapecoense', 'bragantino', 'cuiaba', 'juventude', 'americamg',
                    'atleticogo', 'mirassol', 'remo', 'santacruz', 'figueirense', 'pontepreta', 'avai', 'criciuma',
                    'joinville', 'csa', 'vilanova', 'novorizontino'}

def era_teams(era):
    keys = []
    swap = ULTRA_SWAP.get(era, {})
    for d in ULTRA['div']:
        keys += [swap.get(k, k) for k in d]
    keys += [swap.get(k, k) for k in ULTRA['bank']]
    for lg in NORMAL[era]:
        keys += lg['teams'] + lg['bank']
    keys += UCL_FILL + UEL_FILL + LIBER_FILL + SULA_FILL + OFC_FILL
    seen = []
    for k in keys:
        if k not in seen:
            seen.append(k)
    return seen

def run(era):
    if era == 2026:
        base = load_fc26(datetime.date(2026, 7, 1))
        players = list(base.values())
        extra = load_futtactical()
        fp = load_fifplay27()
    elif era == 2021:
        players = list(load_fifa22(datetime.date(2021, 7, 1)).values()); extra = []; fp = {}
    else:
        players = list(load_fifa17(datetime.date(2016, 7, 1)).values()); extra = []; fp = {}
    clubs = Counter((p['club'], p.get('ctry')) for p in players if p['club'])
    for e in extra:
        if e['club']:
            clubs[(e['club'], None)] += 1
    for p in fp.values():
        if isinstance(p['club'], str):
            clubs[(p['club'], None)] += 1
    mapped = defaultdict(int)
    for (c, ct), n in clubs.items():
        k = match_team(c, ct)
        if k:
            mapped[k] += n
    allnames = sorted(set(c for (c, ct) in clubs if isinstance(c, str)))
    missing = []
    for k in era_teams(era):
        if k in BRAZIL_KNOWLEDGE:
            continue
        if mapped.get(k, 0) == 0:
            t = TEAMS_BY_KEY[k]
            sugg = difflib.get_close_matches(t['name'], allnames, n=4, cutoff=0.5)
            sugg += [n for n in allnames if norm_key(t['name']) and norm_key(t['name']) in norm_key(n)][:4]
            missing.append((k, t['name'], sugg))
    print(f"== {era}: {len(missing)} unmatched")
    for m in missing:
        print("  ", m[0], '|', m[1], '->', '; '.join(dict.fromkeys(m[2])))

if __name__ == '__main__':
    for e in map(int, sys.argv[1:]):
        run(e)
