#!/usr/bin/env python3
"""Concatenate game sources into dist/app.js (browser) and dist/engine_test.js (node)."""
import glob, os, sys, re, shutil
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

engine_files = sorted(glob.glob(os.path.join(SRC, '[0-9][0-9]_*.js')))
ui_files = sorted(glob.glob(os.path.join(SRC, 'ui', '*.js')))
engine = '\n'.join(read(p) for p in engine_files)
ui = '\n'.join(read(p) for p in ui_files)

# node test bundle
with open(os.path.join(DIST, 'engine_test.js'), 'w', encoding='utf-8') as f:
    f.write(engine.replace("'use strict';", '', 1))
    f.write('\nmodule.exports = { get S() { return S; }, set DATA(v) { DATA = v; }, createWorld, startCareer, advanceDay, userMatchToday, simulateMatch, sortTable, topScorers, RNG, teamRating, dayOf, fmtDate, ymd, initialOffers, teamMatches, playerValue, fastForward, closeSeasonEnd, saveGame, serializeState, adoptState, futcoinsFor, WALLET, compOf, champOf, holderOf, createClubWorldCup, importNewClubs, importNewLeagues, uefaCandidates, compIsMinor, leagueRanking, leagueRankingSA, teamName, teamIdByKey, cA, executeTransfer, seasonEndDay, squadOf, effRating, formBonus, midSeasonDevelopment, raiseWageBudget, lowerWageBudget, wageBill, startPosChange, posFit, posChangeOvr, posChangeDays };\n')

# node bundle for the playable 2D match (headless AI-vs-AI calibration)
stub = """const document = { addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, body: { style: {} } };
const window = { addEventListener() {}, scrollTo() {} };
"""
g2d_ui = '\n'.join(read(os.path.join(SRC, 'ui', n)) for n in ['00_core.js', '10_match.js', '12_game2d.js'])
with open(os.path.join(DIST, 'g2d_test.js'), 'w', encoding='utf-8') as f:
    f.write(stub + engine.replace("'use strict';", '', 1) + '\n' + g2d_ui)
    f.write('\nmodule.exports = { get S() { return S; }, set DATA(v) { DATA = v; }, createWorld, startCareer, advanceDay, simulateMatch, startMatchState, initialOffers, Game2D, teamName, finishRegulation, applyMatchResult, FORMATIONS };\n')

# browser bundle
app = "(function(){\n'use strict';\n" + engine.replace("'use strict';", '', 1) + '\n' + ui + '\n})();\n'
with open(os.path.join(DIST, 'app.js'), 'w', encoding='utf-8') as f:
    f.write(app)

# html shell
html = read(os.path.join(SRC, 'index.html')) if os.path.exists(os.path.join(SRC, 'index.html')) else ''
if html:
    css = read(os.path.join(SRC, 'style.css')) if os.path.exists(os.path.join(SRC, 'style.css')) else ''
    html = html.replace('/*__CSS__*/', css)
    with open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(html)
# data
os.makedirs(os.path.join(DIST, 'data'), exist_ok=True)
for p in glob.glob(os.path.join(ROOT, 'data', '*.json')):
    shutil.copy(p, os.path.join(DIST, 'data', os.path.basename(p)))
print('built', len(engine_files), 'engine files,', len(ui_files), 'ui files; app.js', len(app) // 1024, 'KB')
