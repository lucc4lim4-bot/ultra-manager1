import re, unicodedata, math, random, json
from nations import NATIONS, nat_code
from teams_table import TEAMS

def strip_accents(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

STOP = {"fc", "cf", "sc", "ac", "afc", "club", "de", "del", "da", "do", "the", "cd", "ca", "sd", "ud", "rc", "rcd",
        "ssc", "as", "us", "ss", "fk", "sk", "if", "bk", "kv", "krc", "kaa", "rsc", "sl", "ogc", "losc", "tsg", "vfl",
        "vfb", "sv", "1.", "1", "04", "05", "07", "96", "98", "1899", "1846", "1848", "1893", "1907", "calcio", "futebol",
        "football", "futbol", "clube", "e", "y", "and", "&"}

def norm(s):
    s = strip_accents(str(s)).lower()
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    return " ".join(s.split())

def norm_key(s):
    toks = [t for t in norm(s).replace("'", "").split() if t not in STOP]
    return " ".join(toks)

# ---------------------------------------------------------------- teams table
def load_teams():
    teams = {}
    for line in TEAMS.strip().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('|')
        key, name, short, ctry, c1, c2 = parts[:6]
        aliases = [a.strip() for a in (parts[6] if len(parts) > 6 else '').split(';') if a.strip()]
        teams[key] = dict(key=key, name=name, short=short, country=ctry, c1=c1, c2=c2, aliases=aliases)
    return teams

TEAMS_BY_KEY = load_teams()

def build_alias_index():
    idx = {}
    for key, t in TEAMS_BY_KEY.items():
        names = set(t['aliases'])
        for n in names:
            idx.setdefault(norm(n), []).append(key)
    return idx

ALIAS_IDX = build_alias_index()

def match_team(club_name, country=None):
    """Return canonical team key for a dataset club name, or None."""
    if club_name is None or (isinstance(club_name, float)):
        return None
    n = norm(club_name)
    cands = ALIAS_IDX.get(n, [])
    if len(cands) > 1 and country:
        f = [c for c in cands if TEAMS_BY_KEY[c]['country'] == country]
        if f:
            cands = f
    if cands:
        return cands[0]
    return None

# ---------------------------------------------------------------- positions
POS_MAP = {"GK": "GK", "RB": "RB", "RWB": "RB", "LB": "LB", "LWB": "LB", "CB": "CB", "RCB": "CB", "LCB": "CB",
           "CDM": "CDM", "RDM": "CDM", "LDM": "CDM", "CM": "CM", "RCM": "CM", "LCM": "CM", "CAM": "CAM",
           "RAM": "CAM", "LAM": "CAM", "RM": "RM", "LM": "LM", "RW": "RW", "LW": "LW", "ST": "ST", "CF": "ST",
           "RS": "ST", "LS": "ST", "RF": "ST", "LF": "ST", "SW": "CB"}

def map_positions(s):
    if s is None or (isinstance(s, float) and math.isnan(s)):
        return []
    toks = re.split(r"[,/ ]+", str(s))
    out = []
    for t in toks:
        t = t.strip().upper()
        if not t:
            continue
        p = POS_MAP.get(t)
        if p and p not in out:
            out.append(p)
    return out

# ---------------------------------------------------------------- names
def expand_name(short, long):
    """'K. Mbappé' + 'Kylian Mbappé Lottin' -> 'Kylian Mbappé'."""
    short = (short or '').strip()
    long = (long or '').strip()
    if long and len(short.replace('.', '').strip()) <= 1:  # single-name players come with a bare initial ('V' + 'Viery')
        return long, long
    m = re.match(r"^([A-ZÀ-Ý])\.\s+(.+)$", short)
    if m and long:
        ini, rest = m.group(1), m.group(2)
        for tok in long.split():
            if strip_accents(tok)[:1].upper() == strip_accents(ini).upper():
                return tok + " " + rest, rest
        return short, rest
    return short or long, short or long

def lineup_name(display):
    """Short name for shirts/lineups."""
    parts = display.split()
    if len(parts) <= 1:
        return display
    particles = {"de", "da", "do", "dos", "das", "van", "von", "der", "den", "di", "del", "la", "le", "el", "dal",
                 "ter", "ten", "mac", "mc", "al", "bin", "ben", "st.", "ibn"}
    # keep known compound/suffix forms
    if parts[-1] in ("Jr.", "Jr", "Júnior", "Junior", "Neto", "Filho", "II") and len(parts) >= 2:
        if len(parts) == 2:
            return display
        return " ".join(parts[-2:])
    out = [parts[-1]]
    i = len(parts) - 2
    while i >= 1 and parts[i].lower() in particles:
        out.insert(0, parts[i])
        i -= 1
    return " ".join(out)

def clamp(v, a, b):
    return max(a, min(b, v))

def num(v, default=None):
    try:
        if v is None:
            return default
        f = float(v)
        if math.isnan(f):
            return default
        return f
    except Exception:
        return default

def iround(v, default=None):
    f = num(v, None)
    return default if f is None else int(round(f))
