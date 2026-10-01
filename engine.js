/* VESA · motor quantitativo
   Funções puras: gap, probabilidade base (Beta-Binomial + Wilson), volatilidade
   (Garman-Klass, EWMA), regressão logística, walk-forward, sinais e gestão de risco.
   Os dados são SIMULADOS (semente diária) até uma API real ser conectada. */
(function (root) {
  'use strict';

  // ---------- Bolsas ----------
  // [id, nome, índice, cidade, lat, lon, fuso, abre, fecha, almoço, moeda, região, β-dólar, vol diária, dias úteis]
  const RAW = [
    ['NYSE', 'NYSE', 'S&P 500', 'Nova York', 40.71, -74.01, 'America/New_York', '09:30', '16:00', null, 'USD', 'AME', 0.0, 0.010],
    ['NASDAQ', 'Nasdaq', 'Nasdaq Composite', 'Nova York', 40.76, -73.98, 'America/New_York', '09:30', '16:00', null, 'USD', 'AME', 0.0, 0.013],
    ['TSX', 'TSX', 'S&P/TSX', 'Toronto', 43.65, -79.38, 'America/Toronto', '09:30', '16:00', null, 'CAD', 'AME', -0.3, 0.009],
    ['BMV', 'BMV', 'IPC México', 'Cidade do México', 19.43, -99.13, 'America/Mexico_City', '08:30', '15:00', null, 'MXN', 'AME', -0.6, 0.010],
    ['B3', 'B3', 'Ibovespa', 'São Paulo', -23.55, -46.63, 'America/Sao_Paulo', '10:00', '17:00', null, 'BRL', 'AME', -0.8, 0.012],
    ['BCS', 'Bolsa de Santiago', 'IPSA', 'Santiago', -33.45, -70.67, 'America/Santiago', '09:30', '16:00', null, 'CLP', 'AME', -0.5, 0.009],
    ['BYMA', 'BYMA', 'Merval', 'Buenos Aires', -34.60, -58.38, 'America/Argentina/Buenos_Aires', '11:00', '17:00', null, 'ARS', 'AME', -0.7, 0.022],
    ['LSE', 'LSE', 'FTSE 100', 'Londres', 51.51, -0.13, 'Europe/London', '08:00', '16:30', null, 'GBP', 'EMEA', 0.3, 0.008],
    ['EPA', 'Euronext Paris', 'CAC 40', 'Paris', 48.86, 2.35, 'Europe/Paris', '09:00', '17:30', null, 'EUR', 'EMEA', 0.1, 0.010],
    ['AMS', 'Euronext Amsterdam', 'AEX', 'Amsterdã', 52.37, 4.90, 'Europe/Amsterdam', '09:00', '17:30', null, 'EUR', 'EMEA', 0.1, 0.010],
    ['XETRA', 'Xetra', 'DAX', 'Frankfurt', 50.11, 8.68, 'Europe/Berlin', '09:00', '17:30', null, 'EUR', 'EMEA', 0.1, 0.011],
    ['SIX', 'SIX', 'SMI', 'Zurique', 47.37, 8.54, 'Europe/Zurich', '09:00', '17:30', null, 'CHF', 'EMEA', 0.2, 0.008],
    ['BIT', 'Borsa Italiana', 'FTSE MIB', 'Milão', 45.46, 9.19, 'Europe/Rome', '09:00', '17:30', null, 'EUR', 'EMEA', 0.0, 0.012],
    ['BME', 'BME', 'IBEX 35', 'Madri', 40.42, -3.70, 'Europe/Madrid', '09:00', '17:30', null, 'EUR', 'EMEA', 0.0, 0.011],
    ['OMX', 'Nasdaq Estocolmo', 'OMXS30', 'Estocolmo', 59.33, 18.07, 'Europe/Stockholm', '09:00', '17:30', null, 'SEK', 'EMEA', -0.2, 0.011],
    ['BIST', 'Borsa Istanbul', 'BIST 100', 'Istambul', 41.01, 28.98, 'Europe/Istanbul', '10:00', '18:00', null, 'TRY', 'EMEA', -0.6, 0.017],
    ['JSE', 'JSE', 'Top 40', 'Joanesburgo', -26.20, 28.05, 'Africa/Johannesburg', '09:00', '17:00', null, 'ZAR', 'EMEA', -0.7, 0.012],
    ['TADAWUL', 'Tadawul', 'TASI', 'Riad', 24.71, 46.68, 'Asia/Riyadh', '10:00', '15:00', null, 'SAR', 'EMEA', 0.0, 0.009, [0, 1, 2, 3, 4]],
    ['TASE', 'TASE', 'TA-35', 'Tel Aviv', 32.08, 34.78, 'Asia/Jerusalem', '10:00', '17:25', null, 'ILS', 'EMEA', -0.3, 0.010],
    ['NSE', 'NSE Índia', 'Nifty 50', 'Mumbai', 19.08, 72.88, 'Asia/Kolkata', '09:15', '15:30', null, 'INR', 'APAC', -0.5, 0.009],
    ['SSE', 'Bolsa de Xangai', 'SSE Composite', 'Xangai', 31.23, 121.47, 'Asia/Shanghai', '09:30', '15:00', ['11:30', '13:00'], 'CNY', 'APAC', -0.2, 0.011],
    ['SZSE', 'Bolsa de Shenzhen', 'SZSE Component', 'Shenzhen', 22.54, 114.06, 'Asia/Shanghai', '09:30', '15:00', ['11:30', '13:00'], 'CNY', 'APAC', -0.2, 0.014],
    ['HKEX', 'HKEX', 'Hang Seng', 'Hong Kong', 22.28, 114.16, 'Asia/Hong_Kong', '09:30', '16:00', ['12:00', '13:00'], 'HKD', 'APAC', -0.3, 0.013],
    ['JPX', 'JPX Tóquio', 'Nikkei 225', 'Tóquio', 35.68, 139.69, 'Asia/Tokyo', '09:00', '15:30', ['11:30', '12:30'], 'JPY', 'APAC', 0.4, 0.012],
    ['KRX', 'KRX', 'KOSPI', 'Seul', 37.57, 126.98, 'Asia/Seoul', '09:00', '15:30', null, 'KRW', 'APAC', -0.6, 0.011],
    ['TWSE', 'TWSE', 'TAIEX', 'Taipé', 25.03, 121.56, 'Asia/Taipei', '09:00', '13:30', null, 'TWD', 'APAC', -0.5, 0.011],
    ['ASX', 'ASX', 'S&P/ASX 200', 'Sydney', -33.87, 151.21, 'Australia/Sydney', '10:00', '16:00', null, 'AUD', 'APAC', -0.4, 0.008],
  ];
  const EXCHANGES = RAW.map(r => ({
    id: r[0], name: r[1], index: r[2], city: r[3], lat: r[4], lon: r[5], tz: r[6],
    open: r[7], close: r[8], lunch: r[9], ccy: r[10], region: r[11], usdBeta: r[12], vol: r[13],
    days: r[14] || [1, 2, 3, 4, 5],
  }));
  const REGION_NAME = { APAC: 'Ásia-Pacífico', EMEA: 'Europa · Oriente Médio · África', AME: 'Américas' };

  // Ações acompanhadas (ticker, nome, bolsa, setor, preço inicial)
  const STOCKS = [
    ['PETR4', 'Petrobras PN', 'B3', 'Energia', 37], ['VALE3', 'Vale ON', 'B3', 'Mineração', 58], ['ITUB4', 'Itaú Unibanco PN', 'B3', 'Bancos', 36],
    ['BBDC4', 'Bradesco PN', 'B3', 'Bancos', 15], ['WEGE3', 'WEG ON', 'B3', 'Indústria', 44], ['ABEV3', 'Ambev ON', 'B3', 'Consumo', 13],
    ['BBAS3', 'Banco do Brasil ON', 'B3', 'Bancos', 23], ['SUZB3', 'Suzano ON', 'B3', 'Papel e celulose', 54], ['RENT3', 'Localiza ON', 'B3', 'Serviços', 44],
    ['EMBR3', 'Embraer ON', 'B3', 'Indústria', 75], ['PRIO3', 'PRIO ON', 'B3', 'Energia', 42], ['ELET3', 'Eletrobras ON', 'B3', 'Utilidades', 46],
    ['AAPL', 'Apple', 'NASDAQ', 'Tecnologia', 240], ['MSFT', 'Microsoft', 'NASDAQ', 'Tecnologia', 500], ['NVDA', 'Nvidia', 'NASDAQ', 'Semicondutores', 180],
    ['AMZN', 'Amazon', 'NASDAQ', 'Consumo', 225], ['GOOGL', 'Alphabet', 'NASDAQ', 'Tecnologia', 240], ['META', 'Meta', 'NASDAQ', 'Tecnologia', 740],
    ['JPM', 'JPMorgan', 'NYSE', 'Bancos', 300], ['XOM', 'ExxonMobil', 'NYSE', 'Energia', 112], ['KO', 'Coca-Cola', 'NYSE', 'Consumo', 68],
    ['SHEL', 'Shell', 'LSE', 'Energia', 27], ['AZN', 'AstraZeneca', 'LSE', 'Saúde', 115], ['HSBA', 'HSBC', 'LSE', 'Bancos', 9.5],
    ['MC', 'LVMH', 'EPA', 'Consumo', 520], ['TTE', 'TotalEnergies', 'EPA', 'Energia', 54], ['ASML', 'ASML', 'AMS', 'Semicondutores', 680],
    ['SAP', 'SAP', 'XETRA', 'Tecnologia', 240], ['SIE', 'Siemens', 'XETRA', 'Indústria', 225], ['NESN', 'Nestlé', 'SIX', 'Consumo', 80],
    ['SAN', 'Banco Santander', 'BME', 'Bancos', 8.4], ['ENI', 'Eni', 'BIT', 'Energia', 15], ['7203', 'Toyota', 'JPX', 'Automóveis', 2800],
    ['6758', 'Sony', 'JPX', 'Tecnologia', 3900], ['005930', 'Samsung Electronics', 'KRX', 'Semicondutores', 72000], ['2330', 'TSMC', 'TWSE', 'Semicondutores', 1150],
    ['0700', 'Tencent', 'HKEX', 'Tecnologia', 600], ['9988', 'Alibaba', 'HKEX', 'Consumo', 150], ['RELIANCE', 'Reliance', 'NSE', 'Energia', 1400],
    ['BHP', 'BHP', 'ASX', 'Mineração', 42], ['2222', 'Saudi Aramco', 'TADAWUL', 'Energia', 25], ['NPN', 'Naspers', 'JSE', 'Tecnologia', 5600],
  ].map(s => ({ ticker: s[0], name: s[1], ex: s[2], sector: s[3], p0: s[4] }));

  // ---------- Aleatório com semente ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

  // ---------- Estatística ----------
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const std = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  function erf(x) { // Abramowitz-Stegun 7.1.26
    const s = Math.sign(x); x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
  function PhiInv(p) { // Acklam
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  function corr(x, y) {
    const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxy / Math.sqrt(sxx * syy);
  }

  // 3. Probabilidade base: Beta-Binomial (prior uniforme) + IC de Wilson 95%
  function baseProb(k, n) { return (k + 1) / (n + 2); }
  function wilson(p, n, z = 1.96) {
    const den = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
    return [(c - h) / den, (c + h) / den];
  }

  // 5. Volatilidade
  function garmanKlass(b) { return 0.5 * Math.log(b.h / b.l) ** 2 - (2 * Math.LN2 - 1) * Math.log(b.c / b.o) ** 2; }
  function ewmaVol(rets, lambda = 0.94) {
    let v = rets.slice(0, 20).reduce((s, r) => s + r * r, 0) / 20;
    for (let i = 20; i < rets.length; i++) v = lambda * v + (1 - lambda) * rets[i] ** 2;
    return Math.sqrt(v);
  }
  function atr(bars, n = 14) {
    const tr = [];
    for (let i = bars.length - n; i < bars.length; i++) {
      const b = bars[i], pc = bars[i - 1].c;
      tr.push(Math.max(b.h - b.l, Math.abs(b.h - pc), Math.abs(b.l - pc)));
    }
    return mean(tr);
  }
  // end = índice exclusivo (padrão: array inteiro), evita copiar a série a cada dia
  function rsi(closes, n = 14, end = closes.length) {
    let g = 0, l = 0;
    for (let i = end - n; i < end; i++) { const d = closes[i] - closes[i - 1]; if (d > 0) g += d; else l -= d; }
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }
  const sma = (a, n) => mean(a.slice(a.length - n));
  function zscore(closes, n = 20, end = closes.length) {
    let m = 0; for (let i = end - n; i < end; i++) m += closes[i]; m /= n;
    let v = 0; for (let i = end - n; i < end; i++) v += (closes[i] - m) ** 2;
    return (closes[end - 1] - m) / Math.sqrt(v / (n - 1));
  }

  // 6. Probabilidade de tocar um preço X no dia (movimento browniano, sem drift)
  function touchProb(open, x, sigma) { return Math.min(1, 2 * (1 - Phi(Math.abs(Math.log(x / open)) / sigma))); }

  // Probabilidade de atingir o alvo (+a) antes do stop (−b), com drift implícito em p
  function hitFirst(p, a, b, sigma) {
    const mu = sigma * PhiInv(Math.min(0.99, Math.max(0.01, p)));
    if (Math.abs(mu) < 1e-9) return b / (a + b);
    const k = 2 * mu / (sigma * sigma);
    return (1 - Math.exp(k * b)) / (Math.exp(-k * a) - Math.exp(k * b));
  }

  // 4. Regressão logística, variáveis padronizadas
  const FEATURES = ['Gap do dia', 'Dólar no overnight', 'Região anterior', 'Z-score 20d', 'RSI(14)', 'Segunda-feira', 'Sexta-feira'];
  function standardize(X) {
    const m = X[0].map((_, j) => mean(X.map(r => r[j])));
    const s = X[0].map((_, j) => std(X.map(r => r[j])) || 1);
    return { m, s };
  }
  // Newton-Raphson (IRLS) com penalização L2: converge em poucas iterações
  function fitLogit(X, y, iters = 8, l2 = 1) {
    const sc = standardize(X), d = X[0].length + 1, n = X.length;
    const Z = X.map(r => [1, ...r.map((v, j) => (v - sc.m[j]) / sc.s[j])]);
    let w = new Array(d).fill(0);
    for (let it = 0; it < iters; it++) {
      const g = new Array(d).fill(0), H = Array.from({ length: d }, () => new Array(d).fill(0));
      for (let i = 0; i < n; i++) {
        const zi = Z[i]; let z = 0; for (let j = 0; j < d; j++) z += w[j] * zi[j];
        const p = 1 / (1 + Math.exp(-z)), e = p - y[i], v = p * (1 - p);
        for (let j = 0; j < d; j++) { g[j] += e * zi[j]; for (let k = 0; k <= j; k++) H[j][k] += v * zi[j] * zi[k]; }
      }
      for (let j = 1; j < d; j++) { g[j] += l2 * w[j]; H[j][j] += l2; }
      for (let j = 0; j < d; j++) for (let k = j + 1; k < d; k++) H[j][k] = H[k][j];
      const step = solve(H, g);
      w = w.map((v, j) => v - step[j]);
    }
    return { w, sc };
  }
  function solve(A, b) { // eliminação de Gauss com pivotamento
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
    return x;
  }
  function predictLogit(model, x) {
    let z = model.w[0];
    for (let j = 0; j < x.length; j++) z += model.w[j + 1] * (x[j] - model.sc.m[j]) / model.sc.s[j];
    return 1 / (1 + Math.exp(-z));
  }

  // ---------- Simulação de mercado ----------
  // Pregões úteis (seg–sex) até hoje; o último dia tem abertura conhecida e fechamento a prever.
  function tradingDays(today, n) {
    const out = []; const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    while (out.length < n) { const w = d.getUTCDay(); if (w > 0 && w < 6) out.unshift(new Date(d)); d.setUTCDate(d.getUTCDate() - 1); }
    return out;
  }

  function simulate(today = new Date(), N = 520) {
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const rng = mulberry32(seed);
    const dates = tradingDays(today, N);
    // Fatores: dólar global e cadeia regional Ásia → Europa → Américas
    const usd = [], fac = { APAC: [], EMEA: [], AME: [] };
    let prevAme = 0;
    for (let t = 0; t < N; t++) {
      usd.push(0.004 * gauss(rng));
      const apac = 0.35 * prevAme + 0.007 * gauss(rng);
      const emea = 0.30 * apac + 0.007 * gauss(rng);
      const ame = 0.25 * emea + 0.008 * gauss(rng);
      fac.APAC.push(apac); fac.EMEA.push(emea); fac.AME.push(ame); prevAme = ame;
    }
    const lead = (region, t) => region === 'APAC' ? (t ? fac.AME[t - 1] : 0) : region === 'EMEA' ? fac.APAC[t] : fac.EMEA[t];
    const levels = { NYSE: 6600, NASDAQ: 22400, TSX: 29500, BMV: 61000, B3: 145000, BCS: 9000, BYMA: 2100000, LSE: 9300, EPA: 7900, AMS: 940, XETRA: 23800, SIX: 12200, BIT: 42500, BME: 15200, OMX: 2650, BIST: 10800, JSE: 98000, TADAWUL: 11300, TASE: 3100, NSE: 24800, SSE: 3800, SZSE: 12900, HKEX: 26500, JPX: 44500, KRX: 3400, TWSE: 25500, ASX: 8800 };

    const series = {};
    for (const ex of EXCHANGES) series[ex.id] = makeSeries(ex.vol, ex.usdBeta, ex.region, levels[ex.id], mulberry32(seed ^ hashStr(ex.id)), null);
    const stockSeries = {};
    for (const s of STOCKS) {
      const ex = EXCHANGES.find(e => e.id === s.ex);
      stockSeries[s.ticker] = makeSeries(ex.vol * 1.6, ex.usdBeta * 0.8, ex.region, s.p0, mulberry32(seed ^ hashStr(s.ticker)), series[ex.id]);
    }

    function makeSeries(vol, usdBeta, region, p0, r, parent) {
      const bars = [], closes = []; let c = p0 * Math.exp(0.02 * gauss(r)); let drift = 0;
      for (let t = 0; t < N; t++) {
        const L = lead(region, t), u = usd[t];
        const z = closes.length > 20 ? zscore(closes) : 0;
        if (t % 60 === 0) drift = 0.0006 * gauss(r); // regimes de tendência
        const gap = 0.5 * L + 0.4 * usdBeta * u + 0.25 * vol * gauss(r);
        const parentR = parent ? Math.log(parent[t].c / parent[t].o) : 0;
        const intr = drift + 0.25 * L - 0.2 * gap + usdBeta * u - 0.0018 * z * (vol / 0.01)
          + (region === 'AME' ? fac.AME[t] : region === 'EMEA' ? fac.EMEA[t] : fac.APAC[t]) * 0.6
          + (parent ? 0.9 * parentR + 0.8 * vol * gauss(r) : 0.75 * vol * gauss(r));
        const o = c * Math.exp(gap), cl = o * Math.exp(intr);
        const h = Math.max(o, cl) * Math.exp(Math.abs(0.35 * vol * gauss(r)));
        const l = Math.min(o, cl) * Math.exp(-Math.abs(0.35 * vol * gauss(r)));
        bars.push({ o, h, l, c: cl, lead: L, usd: u, date: dates[t] });
        closes.push(cl); c = cl;
      }
      return bars;
    }

    // USD/BRL e DXY derivados do fator dólar
    let brl = 5.38 * Math.exp(0.03 * gauss(rng)), dxy = 98.2 * Math.exp(0.02 * gauss(rng));
    const usdbrl = [], dxys = [];
    for (let t = 0; t < N; t++) {
      const o = brl; brl *= Math.exp(1.4 * usd[t] + 0.004 * gauss(rng));
      usdbrl.push({ o, c: brl, h: Math.max(o, brl) * (1 + 0.002 * Math.abs(gauss(rng))), l: Math.min(o, brl) * (1 - 0.002 * Math.abs(gauss(rng))) });
      dxy *= Math.exp(usd[t] * 0.9); dxys.push(dxy);
    }
    return { dates, usd, fac, series, stockSeries, usdbrl, dxys, seed };
  }

  // ---------- Análise de um ativo ----------
  // Variáveis do dia t (todas conhecidas na abertura de t)
  function featuresAt(bars, closes, t) {
    const g = Math.log(bars[t].o / bars[t - 1].c);
    const dow = bars[t].date.getUTCDay();
    return [g, bars[t].usd, bars[t].lead, zscore(closes, 20, t), rsi(closes, 14, t) / 100, dow === 1 ? 1 : 0, dow === 5 ? 1 : 0];
  }

  function analyze(bars, opts = {}) {
    const W = 250, T = bars.length - 1; // T = hoje (abertura conhecida)
    const start = 30;
    const X = [], y = [], allCloses = bars.map(b => b.c);
    for (let t = start; t <= T; t++) { X.push(featuresAt(bars, allCloses, t)); y.push(bars[t].c > bars[t].o ? 1 : 0); }
    const idx = t => t - start;
    const today = bars[T], prev = bars[T - 1];

    // Base
    const win = y.slice(idx(T - W), idx(T));
    const k = win.reduce((s, v) => s + v, 0);
    const pBase = baseProb(k, W);
    const ciBase = wilson(pBase, W);

    // Modelo de hoje (treino nos últimos 250 pregões)
    const model = fitLogit(X.slice(idx(T - W), idx(T)), win);
    const xToday = X[idx(T)];
    const pCond = predictLogit(model, xToday);
    const ciCond = wilson(pCond, W);

    // Walk-forward: treina 250, testa 20, avança 20
    let bModel = 0, bBase = 0, hits = 0, n = 0; const oos = [];
    if (!opts.skipBacktest) {
      for (let s = idx(start + W); s + 20 <= idx(T); s += 20) {
        const tr = fitLogit(X.slice(s - W, s), y.slice(s - W, s), 5);
        const pb = baseProb(y.slice(s - W, s).reduce((a, b) => a + b, 0), W);
        for (let i = s; i < s + 20; i++) {
          const p = predictLogit(tr, X[i]);
          bModel += (p - y[i]) ** 2; bBase += (pb - y[i]) ** 2; hits += (p > 0.5) === (y[i] === 1) ? 1 : 0; n++;
          oos.push([p, y[i]]);
        }
      }
    }

    // Volatilidade
    const rets = bars.slice(1, T).map((b, i) => Math.log(b.c / bars[i].c));
    const gk = Math.sqrt(mean(bars.slice(T - 20, T).map(garmanKlass)));
    const ew = ewmaVol(rets);
    const sigma = (gk + ew) / 2;
    const closes = bars.slice(0, T).map(b => b.c);
    const gaps = bars.slice(T - W, T).map((b, i) => Math.log(b.o / bars[T - W + i - 1].c));

    return {
      today, prev, pBase, ciBase, pCond, ciCond, k, W,
      weights: model.w.slice(1), features: xToday,
      contrib: xToday.map((v, j) => model.w[j + 1] * (v - model.sc.m[j]) / model.sc.s[j]),
      brierModel: n ? bModel / n : null, brierBase: n ? bBase / n : null, hitRate: n ? hits / n : null, nTest: n, oos,
      edge: n ? bBase / n - bModel / n : 0,
      gap: Math.log(today.o / prev.c), sigma, gk, ewma: ew,
      range68: [today.o * Math.exp(-sigma), today.o * Math.exp(sigma)],
      range95: [today.o * Math.exp(-1.96 * sigma), today.o * Math.exp(1.96 * sigma)],
      atr: atr(bars.slice(0, T)), rsi: rsi(closes), z: zscore(closes),
      ma50: sma(closes, 50), ma200: sma(closes, 200), gaps,
      gapStats: { mean: mean(gaps), std: std(gaps), up: gaps.filter(g => g > 0).length / gaps.length },
    };
  }

  // ---------- Sinais e risco ----------
  const COST = 0.001; // corretagem + spread, ida e volta
  // cfg: capital, maxRisk (fração do capital), stopMult (× ATR), rr (alvo ÷ stop), pMin
  function signal(a, cfg = {}) {
    const { capital = 100000, maxRisk = 0.02, stopMult = 1.5, rr = 2 / 1.5, pMin = 0.58 } = cfg;
    const price = a.today.o, atrP = a.atr / price;
    const stopD = stopMult * atrP, tgtD = stopD * rr;
    const sideOf = (dir) => {
      const p = dir === 'buy' ? a.pCond : 1 - a.pCond;
      const ci = dir === 'buy' ? a.ciCond : [1 - a.ciCond[1], 1 - a.ciCond[0]];
      const pw = hitFirst(p, tgtD, stopD, a.sigma);
      const E = pw * tgtD - (1 - pw) * stopD - COST;
      const b = tgtD / stopD;
      const kelly = (pw * b - (1 - pw)) / b;
      const risk = Math.max(0, Math.min(kelly / 4, maxRisk));
      const crit = dir === 'buy'
        ? { prob: p >= pMin, ci: ci[0] > 0.5, z: a.z <= -1.5, trend: a.ma50 > a.ma200 }
        : { prob: p >= pMin, ci: ci[0] > 0.5, z: a.z >= 1.5, trend: a.ma50 < a.ma200 };
      crit.edge = E > 0 && (a.edge > 0);
      const all = Object.values(crit).every(Boolean);
      const stop = dir === 'buy' ? price * (1 - stopD) : price * (1 + stopD);
      const target = dir === 'buy' ? price * (1 + tgtD) : price * (1 - tgtD);
      const qty = risk > 0 ? Math.floor(capital * risk / (price * stopD)) : 0;
      return { dir, p, ci, pw, E, kelly, risk, crit, all, stop, target, qty, price, stopD, tgtD, rr };
    };
    return { buy: sideOf('buy'), sell: sideOf('sell') };
  }

  function reason(a, s) {
    const parts = [];
    if (s.dir === 'buy') {
      if (a.z <= -1.5) parts.push('preço esticado abaixo da média de 20 dias');
      if (a.ma50 > a.ma200) parts.push('tendência de alta (MM50 > MM200)');
      if (a.gap < -0.003) parts.push('gap de baixa tende a ser parcialmente recuperado');
    } else {
      if (a.z >= 1.5) parts.push('preço esticado acima da média de 20 dias');
      if (a.ma50 < a.ma200) parts.push('tendência de baixa (MM50 < MM200)');
      if (a.gap > 0.003) parts.push('gap de alta tende a ser parcialmente devolvido');
    }
    const w = a.contrib.map((v, i) => [Math.abs(v), i]).sort((x, y) => y[0] - x[0])[0];
    parts.push('maior peso hoje: ' + FEATURES[w[1]].toLowerCase());
    return parts.join('; ');
  }

  // ---------- Relógio das bolsas ----------
  function localParts(date, tz) {
    const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { wd, min: +p.hour * 60 + +p.minute };
  }
  const toMin = s => +s.slice(0, 2) * 60 + +s.slice(3);
  function sessionState(ex, date = new Date()) {
    const { wd, min } = localParts(date, ex.tz);
    const o = toMin(ex.open), c = toMin(ex.close);
    const tradingDay = ex.days.includes(wd);
    let state = 'fechada';
    if (tradingDay && min >= o && min < c) {
      state = 'aberta';
      if (ex.lunch && min >= toMin(ex.lunch[0]) && min < toMin(ex.lunch[1])) state = 'almoço';
    } else if (tradingDay && min >= o - 60 && min < o) state = 'pré-abertura';
    // minutos até a próxima abertura / fechamento
    let toOpen = null, toClose = null;
    if (state === 'aberta' || state === 'almoço') toClose = c - min;
    for (let d = 0; d < 8 && toOpen === null; d++) {
      const w = (wd + d) % 7;
      if (!ex.days.includes(w)) continue;
      const m = d * 1440 + o - min;
      if (m > 0) toOpen = m;
    }
    return { state, toOpen, toClose, localMin: min, wd };
  }

  const api = { EXCHANGES, STOCKS, REGION_NAME, FEATURES, COST, simulate, analyze, signal, reason, sessionState, localParts, touchProb, hitFirst, wilson, baseProb, Phi, PhiInv, corr, mean, std, garmanKlass };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VESA = api;
})(typeof window !== 'undefined' ? window : globalThis);
