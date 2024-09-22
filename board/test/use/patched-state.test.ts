import { Random } from '../../src';
import { PatchedState } from '../../src/use/patched-state';
import { z } from 'zod';

describe('Patched State', () => {
  it('should work with the example from the documentation', () => {
    // Define example patched state
    type LotState = { r: Random, lastLotId: number, lots: { id: string, owner: string, value: number }[], cash: { [username: string]: number } };
    type LotView = { lots: { owner: 'you' | 'someone-else', value: number | '?' }[], cash: { [username: string]: number } };
    const lotState = new PatchedState<LotState, LotView>(
      { r: new Random(Date.now().toString()), lastLotId: 34000, lots: [], cash: {} },
      (state: LotState, username) => ({
        lots: state.lots.map(lot => ({
          owner: lot.owner === username ? 'you' : 'someone-else',
          value: lot.value,
        })),
        cash: state.cash,
      }),
    );
    const drawLot = lotState.when('draw', z.undefined(), (state: LotState, dispatcher: string) => {
      state.lastLotId += 1;
      state.lots.push({ id: `l-${state.lastLotId}`, owner: dispatcher, value: state.r.rangeInt(1, 9) });
    }, (view: LotView) => {
      view.lots.push({ owner: 'you', value: '?' });
    });
    const cashOut = lotState.when('cash-out', z.string(), (state: LotState, dispatcher: string, lotId: string) => {
      const lotIndex = state.lots.findIndex(lot => lot.id === lotId);
      if (lotIndex === -1) {
        throw new Error('a lot with that id does not exist');
      }
      const lot = state.lots[lotIndex];
      const cash = state.lots.filter(lot => lot.owner === dispatcher).reduce((sum, lot) => sum + lot.value, 0) * lot.value;
      state.lots = state.lots.filter(lot => lot.owner !== dispatcher || lot.id === lotId);
      state.cash[dispatcher] = (state.cash[dispatcher] || 0) + cash;
    });
    const noop = lotState.when('noop', z.undefined(), () => { /* do nothing */ });

    // Start example server
    const serverInstance = lotState.spawnServer();
    serverInstance.dispatch('simon', drawLot());
    serverInstance.dispatch('lisa', drawLot());

    // After some initial messages, start an example client
    const clientInstance = lotState.spawnClient();
    serverInstance.onChange((getDeltaFor, optimisticId) => {
      ['lisa'].forEach(user => {
        const delta = getDeltaFor(user);
        if (delta === false) {
          return;
        }
        // should we only send optimistic id for the user that sent it?
        try {
          clientInstance.apply(delta, optimisticId); // this happens through Krmx
        } catch (err) {
          console.error('error applying delta', err);
        }
      });
    });
    let latestView: LotView = undefined as unknown as LotView;
    clientInstance.onChange((view) => {
      latestView = view; // this would update external store in react
    });
    clientInstance.set(structuredClone(serverInstance.view('lisa'))); // this happens through Krmx

    // Send some more messages and validate the views
    serverInstance.dispatch('simon', drawLot());
    serverInstance.dispatch('simon', noop());
    const clientEvent = drawLot();
    const optId = clientInstance.optimistic('lisa', clientEvent);
    expect(latestView.lots.filter(l => l.owner === 'you' && l.value === '?').length).toBe(1);
    serverInstance.dispatch('lisa', drawLot());
    serverInstance.dispatch('lisa', clientEvent, typeof optId === 'string' ? optId : undefined); // this happens through Krmx
    serverInstance.dispatch('lisa', noop());
    serverInstance.dispatch('simon', drawLot());
    serverInstance.dispatch('lisa', cashOut('l-34003'));
    expect(structuredClone(latestView)).toStrictEqual(structuredClone(serverInstance.view('lisa')));
  });
});
