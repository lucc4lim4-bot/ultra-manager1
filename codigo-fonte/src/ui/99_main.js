/* ===================== boot ===================== */
window.addEventListener('error', (e) => { console.error(e.error || e.message); });
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
(async function boot() {
  UI.screen = 'loading';
  UI.loadMsg = 'Carregando…';
  UI.loadP = 0.2;
  render();
  try { await loadWallet(); } catch (e) { console.error(e); }
  await loadCustomCrests();
  UI.loadP = 0.5;
  try { SAVES = await listSaves(); } catch (e) { SAVES = []; }
  UI.loadP = 0.8;
  try { await loadStore(); } catch (e) { console.error(e); }
  UI.screen = 'start';
  render();
})();
// test hook: the browser tests open the page with ?debug=1 to move the calendar on directly
try { if (/[?&]debug=1\b/.test(location.search)) window.__um = { snub: (pid) => ({ msg: loanSnub(S.players[pid], S.teams[S.user.team]), ps: stars(teamRating(S.players[pid].t)), ds: stars(teamRating(S.user.team)) }), tac: { presets: () => tacticPresets(), live: (st, k, o) => liveTactic(st, k, o), autoRenew: (p, t, y) => autoRenewUser(p, t, y), trophy: (k, s) => trophySVG(k, s), squad: (id) => squadOf(id), ymd, seasonEndYear, open: (id) => openPlayer(id) }, get S() { return S; }, fastForward, render, UI, dayOf, importNewClubs, askPens, startMatchState, plWeek: () => plWeek(), fans: { week: () => fanWeek(), after: (m) => fanAfterMatch(m), init: () => fanInit(), orgs: (id) => fanOrgsOf(id), send: (i, o) => { const L = o ? FAN_ORG_EVENTS : FAN_EVENTS; const e = L[i % L.length]; const ev = o ? e.build(fanOrgsOf(S.user.team)[0] || 'Organizada') : e.build(); if (ev) fanSend(Object.assign({ id: e.id }, ev)); return !!ev; }, counts: () => [FAN_EVENTS.length, FAN_ORG_EVENTS.length] }, tr: { sign: (pid, fee, swap) => { S.tr.window = 1; return userSign(S.players[pid], fee, 1000, 3, false, swap); }, swapTotal: (a) => swapTotal(a), swapValue: (id) => swapValue(S.players[id]), offers: () => { for (let i = 0; i < 400; i++) aiOffersForUser(); return S.tr.offers.filter((o) => o.swap).length; }, respond: (id, a) => respondOffer(id, a), resp: (pid, fee) => clubResponse(S.players[pid], fee, false) }, sp: { logo: (b, s, w) => brandLogo(b, s, w), month: () => sponsMonth(), after: (m) => sponsAfterMatch(m), bonus: (id) => sponsRatingBonus(id), perk: () => sponsPerk(), count: () => SP_BRANDS.length } }; } catch (e) { /* no location outside the browser */ }
