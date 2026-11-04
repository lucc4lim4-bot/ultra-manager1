/* ===================== calendar (real dates) ===================== */
// FIFA international windows (Saturday of the break) for European season starting in year y
function fifaWeekendsEU(y) {
  const sats = [];
  const sat = (m, d, yy) => onOrAfter(dayOf(yy, m, d), 6);
  sats.push(sat(9, 3, y), sat(10, 8, y), sat(11, 12, y), sat(3, 21, y + 1));
  return sats;
}
function isWCYear(y) { return y % 4 === 2; }

// European league matchdays (season y/y+1)
function euLeagueDates(y, rounds, opts = {}) {
  let start = onOrAfter(dayOf(y, 8, opts.startDay || 15), 6);
  if (isWCYear(y)) start = onOrAfter(dayOf(y, 8, 21), 6);
  const end = onOrBefore(dayOf(y + 1, 5, 25), 6);
  const blocked = new Set(fifaWeekendsEU(y));
  const sats = [];
  for (let d = start; d <= end; d += 7) if (!blocked.has(d)) sats.push(d);
  // midweek rounds in UEFA-free weeks
  const mid = [dayOf(y, 12, 30), dayOf(y, 12, 3), dayOf(y + 1, 4, 22), dayOf(y + 1, 1, 14), dayOf(y + 1, 2, 4),
    dayOf(y, 10, 29), dayOf(y + 1, 3, 4), dayOf(y + 1, 5, 6), dayOf(y, 9, 30), dayOf(y + 1, 2, 25),
    dayOf(y, 11, 26), dayOf(y + 1, 1, 28), dayOf(y, 10, 22), dayOf(y + 1, 4, 8), dayOf(y + 1, 3, 18)]
    .map((d) => onOrAfter(d, 3));
  let dates = sats.slice();
  let i = 0;
  while (dates.length < rounds && i < mid.length) { if (!dates.includes(mid[i])) dates.push(mid[i]); i++; }
  dates.sort((a, b) => a - b);
  if (dates.length < rounds) { // huge leagues (zoeira): add Wednesdays everywhere
    for (let d = onOrAfter(start, 3); d < end && dates.length < rounds; d += 7) if (!dates.includes(d)) dates.push(d);
    dates.sort((a, b) => a - b);
    for (let d = onOrAfter(start, 2); d < end && dates.length < rounds; d += 7) if (!dates.includes(d)) dates.push(d);
    dates.sort((a, b) => a - b);
  }
  if (dates.length > rounds) {
    // drop surplus weekends evenly, keeping first and last
    while (dates.length > rounds) {
      const idx = 1 + Math.floor((dates.length - 2) * ((dates.length - rounds) % 2 ? 0.37 : 0.73));
      dates.splice(idx, 1);
    }
  }
  return dates;
}

// South American calendar-year league
// European leagues played in the calendar year (spring to autumn)
const SPRING_LEAGUES = new Set(['NOR', 'SWE', 'FIN', 'LTU', 'LVA', 'KAZ', 'GEO']);
function saLeagueDates(y, rounds, country) {
  let start = onOrAfter(dayOf(y, 2, 1), 6);
  let end = onOrBefore(dayOf(y, 12, 6), 0) - 1;
  const pause = isWCYear(y) ? [dayOf(y, 6, 6), dayOf(y, 7, 22)] : [dayOf(y, 6, 9), dayOf(y, 6, 12)];
  if (country === 'BRA') start = y === 2026 ? onOrAfter(dayOf(y, 1, 28), 3) : onOrAfter(dayOf(y, 4, 10), 6);
  else if (SPRING_LEAGUES.has(country)) { start = onOrAfter(dayOf(y, 3, 28), 6); end = onOrBefore(dayOf(y, 11, 29), 0) - 1; }
  const sats = [];
  for (let d = onOrAfter(start, 6); d <= end; d += 7) if (!(d >= pause[0] && d <= pause[1])) sats.push(d);
  // Brazilian midweek rounds (Wednesday)
  const weds = [];
  for (let d = onOrAfter(start + 2, 3); d <= end; d += 7) if (!(d >= pause[0] && d <= pause[1])) weds.push(d);
  let dates = sats.slice();
  // spread wednesdays evenly
  const need = Math.max(0, rounds - dates.length);
  if (need > 0) {
    const step = weds.length / need;
    for (let k = 0; k < need && k * step < weds.length; k++) dates.push(weds[Math.floor(k * step + step / 2)] || weds[k]);
  }
  dates = uniq(dates).sort((a, b) => a - b);
  while (dates.length > rounds) dates.splice(Math.floor(dates.length / 2), 1);
  let extra = end;
  while (dates.length < rounds) { extra += 3; dates.push(extra); }
  return dates;
}

// UEFA club competitions: [tuesday-of-week] days for each matchday
function uefaDates(y) {
  const tue = (m, d, yy = y) => onOrAfter(dayOf(yy, m, d), 2);
  return {
    qual: [tue(7, 21), tue(7, 28), tue(8, 4), tue(8, 18), tue(8, 25)],
    league: [tue(9, 16), tue(9, 30), tue(10, 21), tue(11, 4), tue(11, 25), tue(12, 9), tue(1, 20, y + 1), tue(1, 27, y + 1)],
    playoff: [tue(2, 17, y + 1), tue(2, 24, y + 1)],
    r16: [tue(3, 10, y + 1), tue(3, 17, y + 1)],
    qf: [tue(4, 7, y + 1), tue(4, 14, y + 1)],
    sf: [tue(4, 28, y + 1), tue(5, 5, y + 1)],
    final: onOrAfter(dayOf(y + 1, 5, 29), 6),
    finalUEL: onOrAfter(dayOf(y + 1, 5, 19), 3),
    // Conference League: 6 Thursdays from October to mid-December, final on a late-May Wednesday
    ueclLeague: [tue(9, 30) + 2, tue(10, 21) + 2, tue(11, 4) + 2, tue(11, 25) + 2, tue(12, 9) + 2, tue(12, 9) + 9],
    finalUECL: onOrAfter(dayOf(y + 1, 5, 26), 3),
  };
}
// domestic cup rounds (wednesdays in UEFA-free weeks), final on a late-May Saturday
function euCupDates(y, nRounds) {
  const wed = (m, d, yy = y) => onOrAfter(dayOf(yy, m, d), 3);
  const base = [wed(8, 26), wed(9, 23), wed(10, 28), wed(12, 2), wed(1, 14, y + 1), wed(2, 4, y + 1), wed(3, 4, y + 1), wed(4, 22, y + 1)];
  const final = onOrAfter(dayOf(y + 1, 5, 23), 6) + 7;
  const rounds = base.slice(base.length - (nRounds - 1));
  return { rounds, final };
}
function saCupDates(y, nRounds) {
  const wed = (m, d) => onOrAfter(dayOf(y, m, d), 3);
  const base = [wed(2, 18), wed(3, 11), wed(4, 22), wed(5, 13), wed(7, 29), wed(8, 26), wed(9, 16), wed(10, 14)];
  const rounds = base.slice(Math.max(0, base.length - nRounds));
  return { rounds, legGap: 7 };
}
function libertadoresDates(y) {
  const tue = (m, d) => onOrAfter(dayOf(y, m, d), 2);
  return {
    groups: [tue(4, 7), tue(4, 21), tue(5, 5), tue(5, 12), tue(5, 19), tue(5, 26)],
    r16: [tue(8, 11), tue(8, 18)], qf: [tue(9, 15), tue(9, 22)], sf: [tue(10, 20), tue(10, 27)],
    final: onOrAfter(dayOf(y, 11, 25), 6),
  };
}

// Copa Sul-Americana: groups in the Libertadores weeks, play-offs in July, single final a week before the Libertadores one
function sulaDates(y) {
  const tue = (m, d) => onOrAfter(dayOf(y, m, d), 2);
  return {
    groups: [tue(4, 7), tue(4, 21), tue(5, 5), tue(5, 12), tue(5, 19), tue(5, 26)],
    po: tue(7, 14), r16: tue(8, 11) + 1, qf: tue(9, 15) + 1, sf: tue(10, 20) + 1,
    final: onOrAfter(dayOf(y, 11, 18), 6),
  };
}
// Mundial de Clubes in December (FIFA's yearly format): first round, Afro-Asian-Pacific cup, Derby of the Americas,
// Challenger cup and the final against the European champion, all at a neutral venue
function cwcDates(y) {
  const final = onOrAfter(dayOf(y, 12, 15), 3);
  return { r1: final - 11, aap: final - 8, derby: final - 7, chal: final - 4, final };
}

// kick-off times
function kickoffTime(zone, day, idx) {
  const w = weekday(day);
  if (zone === 'SA') {
    if (w === 3) return ['19:00', '21:30', '20:00'][idx % 3];
    if (w === 6) return ['16:00', '18:30', '21:00', '17:00'][idx % 4];
    return ['11:00', '16:00', '18:30', '20:30'][idx % 4];
  }
  if (zone === 'UEFA') return idx % 6 === 0 ? '18:45' : '21:00';
  if (zone === 'INTL') return ['16:00', '19:00', '21:00', '13:00'][idx % 4];
  if (w === 3 || w === 2) return ['19:30', '20:00', '20:45'][idx % 3];
  if (w === 6) return ['12:30', '15:00', '15:00', '17:30', '20:00'][idx % 5];
  if (w === 0) return ['14:00', '16:30', '19:00'][idx % 3];
  return ['20:00', '20:45'][idx % 2];
}
// spread a weekend round over Fri..Mon
function spreadDay(base, idx, total, zone) {
  const w = weekday(base);
  if (w !== 6) return base; // midweek: same day (one day earlier for half)
  const r = idx / Math.max(1, total);
  if (zone === 'SA') return r < 0.45 ? base : base + 1;
  if (r < 0.06) return base - 1;
  if (r < 0.62) return base;
  if (r < 0.95) return base + 1;
  return base + 2;
}
