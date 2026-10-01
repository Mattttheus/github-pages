/* Calcula as análises fora da thread da interface e envia uma a uma. */
importScripts('engine.js');
self.onmessage = (e) => {
  const V = self.VESA, sim = V.simulate(new Date(e.data.t));
  for (const ex of V.EXCHANGES) self.postMessage({ kind: 'ex', id: ex.id, a: V.analyze(sim.series[ex.id]) });
  for (const s of V.STOCKS) self.postMessage({ kind: 'stk', id: s.ticker, a: V.analyze(sim.stockSeries[s.ticker]) });
  self.postMessage({ kind: 'done' });
};
