import json, math, datetime
import pandas as pd
from collections import Counter, defaultdict
from common import *

RAW = '/home/claude/data_raw'

def age_at(dob, ref):
    try:
        d = datetime.date.fromisoformat(str(dob)[:10])
    except Exception:
        return None
    a = ref.year - d.year - ((ref.month, ref.day) < (d.month, d.day))
    return a

def sofifa_attrs(r, is_gk):
    if is_gk:
        g = lambda k: iround(r.get(k), 50)
        return [g('goalkeeping_diving'), g('goalkeeping_handling'), g('goalkeeping_kicking'),
                g('goalkeeping_reflexes'), iround(r.get('goalkeeping_speed'), 50) or 50, g('goalkeeping_positioning')]
    g = lambda k: iround(r.get(k), 50)
    return [g('pace'), g('shooting'), g('passing'), g('dribbling'), g('defending'), g('physic')]

def league_country_map(df, league_col, nat_col):
    """Country for each league = most common nationality among its players."""
    m = {}
    for lg, sub in df.groupby(league_col):
        c = Counter(nat_code(x) for x in sub[nat_col])
        c.pop(None, None)
        if c:
            m[lg] = c.most_common(1)[0][0]
    return m

# ------------------------------------------------------------------ FC 26 (sofifa complete, men)
def load_fc26(ref_date):
    df = pd.read_csv(f'{RAW}/fc26hub/repo/data/players.csv', low_memory=False)
    lc = league_country_map(df, 'league_id', 'nationality_name')
    out = {}
    for r in df.to_dict('records'):
        pos = map_positions(r['player_positions'])
        if not pos:
            continue
        is_gk = pos[0] == 'GK'
        name, short = expand_name(r['short_name'], r['long_name'])
        age = age_at(r['dob'], ref_date) or iround(r['age'], 25)
        out[int(r['player_id'])] = dict(
            src='fc26', sid=int(r['player_id']), name=name, short=lineup_name(name), longname=r['long_name'],
            club=r['club_name'] if isinstance(r['club_name'], str) else None,
            ctry=lc.get(r['league_id']), nat=nat_code(r['nationality_name']), pos=pos, age=age,
            ovr=iround(r['overall'], 50), pot=iround(r['potential'], 50),
            foot='L' if str(r['preferred_foot']).startswith('L') else 'R', h=iround(r['height_cm'], 180),
            a=sofifa_attrs(r, is_gk), num=iround(r['club_jersey_number']),
            contract=iround(r['club_contract_valid_until_year']),
            loan=r['club_loaned_from'] if isinstance(r['club_loaned_from'], str) else None,
            value=iround(r['value_eur']), wage=iround(r['wage_eur']))
    return out

# ------------------------------------------------------------------ FIFA 22 (sofifa complete, men)
def load_fifa22(ref_date):
    df = pd.read_csv(f'{RAW}/fifa22/repo/players_22.csv', low_memory=False)
    lc = league_country_map(df, 'league_name', 'nationality_name')
    out = {}
    for r in df.to_dict('records'):
        pos = map_positions(r['player_positions'])
        if not pos:
            continue
        is_gk = pos[0] == 'GK'
        name, short = expand_name(r['short_name'], r['long_name'])
        age = age_at(r['dob'], ref_date) or iround(r['age'], 25)
        out[int(r['sofifa_id'])] = dict(
            src='f22', sid=int(r['sofifa_id']), name=name, short=lineup_name(name), longname=r['long_name'],
            club=r['club_name'] if isinstance(r['club_name'], str) else None,
            ctry=lc.get(r['league_name']), nat=nat_code(r['nationality_name']), pos=pos, age=age,
            ovr=iround(r['overall'], 50), pot=iround(r['potential'], 50),
            foot='L' if str(r['preferred_foot']).startswith('L') else 'R', h=iround(r['height_cm'], 180),
            a=sofifa_attrs(r, is_gk), num=iround(r['club_jersey_number']),
            contract=iround(r['club_contract_valid_until']),
            loan=r['club_loaned_from'] if isinstance(r['club_loaned_from'], str) else None,
            value=iround(r['value_eur']), wage=iround(r['wage_eur']))
    return out

# ------------------------------------------------------------------ FIFA 17 (fifaindex top 10.5k)
def load_fifa17(ref_date):
    df = pd.read_csv(f'{RAW}/fifamodel/repo/stats/player_stats_2017.csv', low_memory=False)
    # country per club = majority nationality
    cc = {}
    for club, sub in df.groupby('club'):
        c = Counter(nat_code(x) for x in sub['nationality'])
        c.pop(None, None)
        if c:
            cc[club] = c.most_common(1)[0][0]
    out = {}
    g = lambda r, k: num(r.get(k), 50) or 50
    for r in df.to_dict('records'):
        pos = map_positions(r['preferred_positions'])
        if not pos:
            continue
        is_gk = pos[0] == 'GK'
        if is_gk:
            a = [g(r, 'gk_diving'), g(r, 'gk_handling'), g(r, 'gk_kicking'), g(r, 'gk_reflexes'),
                 (g(r, 'acceleration') + g(r, 'sprint_speed')) / 2, g(r, 'gk_positioning')]
        else:
            pac = 0.45 * g(r, 'acceleration') + 0.55 * g(r, 'sprint_speed')
            sho = (0.45 * g(r, 'finishing') + 0.2 * g(r, 'shot_power') + 0.2 * g(r, 'long_shots') +
                   0.05 * g(r, 'volleys') + 0.05 * g(r, 'penalties') + 0.05 * g(r, 'att_position'))
            pas = (0.35 * g(r, 'short_pass') + 0.2 * g(r, 'vision') + 0.2 * g(r, 'crossing') +
                   0.15 * g(r, 'long_pass') + 0.05 * g(r, 'curve') + 0.05 * g(r, 'free_kick_accuracy'))
            dri = (0.5 * g(r, 'dribbling') + 0.35 * g(r, 'ball_control') + 0.1 * g(r, 'agility') +
                   0.05 * g(r, 'balance'))
            dfn = (0.3 * g(r, 'marking') + 0.3 * g(r, 'stand_tackle') + 0.1 * g(r, 'slide_tackle') +
                   0.2 * g(r, 'interceptions') + 0.1 * g(r, 'heading'))
            phy = (0.5 * g(r, 'strength') + 0.25 * g(r, 'stamina') + 0.2 * g(r, 'aggression') +
                   0.05 * g(r, 'jumping'))
            a = [pac, sho, pas, dri, dfn, phy]
        a = [int(round(x)) for x in a]
        age = age_at(r['birthdate'], ref_date) or iround(r['age'], 25)
        club = r['club'] if isinstance(r['club'], str) else None
        if club == 'Free Agents':
            club = None
        name = str(r['name']).strip()
        rating = iround(r['rating'], 50)
        out[int(r['player_id'])] = dict(
            src='f17', sid=int(r['player_id']), name=name, short=lineup_name(name), longname=name,
            club=club, ctry=cc.get(r['club']), nat=nat_code(r['nationality']), pos=pos, age=age,
            ovr=rating, pot=None, foot='L' if str(r['preferred_foot']).startswith('L') else 'R',
            h=iround(r['height'], 180), a=a, num=iround(r['club_kit_number']), contract=iround(r['contract_length']),
            loan=r['loaned_from'] if isinstance(r['loaned_from'], str) and r['loaned_from'] != 'NA' else None,
            value=iround(r['value']), wage=iround(r['wage']))
    return out

# ------------------------------------------------------------------ FC 27 (FIFPlay snapshot, mixed gender)
def load_fifplay27():
    df = pd.read_csv(f'{RAW}/fc27/repo/fc27-players-2026-10-11.csv', encoding='utf-8-sig', low_memory=False)
    out = {}
    for r in df.to_dict('records'):
        pos = map_positions(' '.join(str(r.get(k)) for k in ['position', 'position_alt', 'position_alt_2',
                                                             'position_alt_3'] if isinstance(r.get(k), str)))
        if not pos:
            continue
        if r['club_name'] in ('ICON', 'Hero'):
            continue
        is_gk = pos[0] == 'GK'
        if is_gk:
            g = lambda k: iround(r.get(k), 50)
            a = [g('gk_diving'), g('gk_handling'), g('gk_kicking'), g('gk_reflexes'), 50, g('gk_positioning')]
        else:
            a = [iround(r.get(k), None) for k in ['pac', 'sho', 'pas', 'dri', 'def', 'phy']]
            if any(x is None for x in a):
                a = None
        common = r['common_name'] if isinstance(r['common_name'], str) else None
        first = r['first_name'] if isinstance(r['first_name'], str) else ''
        last = r['last_name'] if isinstance(r['last_name'], str) else ''
        name = common or f"{first} {last}".strip()  # some rows have no last name ('Viery'), never print 'nan'
        out[int(r['base_id'])] = dict(
            src='fp27', sid=int(r['base_id']), name=name, club=r['club_name'], nat=nat_code(r['nation_name']),
            pos=pos, ovr=iround(r['rating'], 50), pot=iround(r['potential']), a=a, h=iround(r['height']),
            foot='L' if str(r['foot']).startswith('L') else 'R')
    return out

# ------------------------------------------------------------------ FutTactical FC27 (FC27 merged w/ summer 2026 moves)
def load_futtactical():
    rows = json.load(open(f'{RAW}/futtactical/repo/public/data/fc27.json'))
    out = []
    for r in rows:
        lg, club, short, long, posstr, ovr, pot, val, wage, age, contract, rel, nat, ver = r[:14]
        prev = r[14] if len(r) > 14 else ''
        pos = map_positions(posstr)
        if not pos:
            continue
        name, _ = expand_name(short, long)
        out.append(dict(src='ft27', league=lg, club=club or None, name=name, short=lineup_name(name), longname=long,
                        pos=pos, ovr=int(ovr), pot=int(pot), value=val, wage=wage, age=int(age),
                        contract=int(contract) if contract else None, nat=nat_code(nat), prev=prev or None))
    return out
