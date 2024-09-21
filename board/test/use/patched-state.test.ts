import { Random } from '../../src';
import { PatchedState } from '../../src/use/patched-state';
import { z } from 'zod';

describe('Patched State', () => {
  it('should work with the example from the documentation', () => {
    // Define example patched state
    type LotState = { r: Random, lastLotId: number, lots: { id: string, owner: string, value: number }[], cash: { [username: string]: number } };
    type LotView = { owner: 'you' | 'someone-else', value: number | '?' }[];
    const lotState = new PatchedState<LotState, LotView>(
      { r: new Random('seed'), lastLotId: 34000, lots: [], cash: {} },
      (state: LotState, username) => state.lots.map(lot => ({
        owner: lot.owner === username ? 'you' : 'someone-else',
        value: lot.value,
      })),
    );
    const drawLot = lotState.when('draw', z.undefined(), (state: LotState, dispatcher: string) => {
      state.lastLotId += 1;

      // Fake an expensive operation, with a while loop waiting 1 second
      const start = Date.now();
      while (Date.now() - start < 1000) { /* do nothing */
      }

      state.lots.push({ id: `l-${state.lastLotId}`, owner: dispatcher, value: state.r.range(1, 9) });
    }, (view: LotView) => {
      view.push({ owner: 'you', value: '?' });
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

    // Start example server
    const serverInstance = lotState.spawnServer();
    serverInstance.dispatch('simon', drawLot());
    serverInstance.dispatch('lisa', drawLot());

    // After some initial messages, start an example client
    const clientInstance = lotState.spawnClient();
    clientInstance.set(serverInstance.view('lisa')); // this happens through Krmx
    serverInstance.onChange((getDeltaFor, optimisticId) => {
      ['lisa'].forEach(user => {
        const delta = getDeltaFor(user);
        if (delta === false) {
          return;
        }
        // should we only send optimistic id for the user that sent it?
        clientInstance.apply(delta, optimisticId); // this happens through Krmx
      });
    });
    let latestView: LotView | undefined = undefined;
    clientInstance.onChange((view) => {
      console.info('view updated', view);
      latestView = view; // this would update external store in react
    });

    // Send some more messages and validate the views
    serverInstance.dispatch('simon', drawLot());
    const clientEvent = drawLot();
    const optId = clientInstance.optimistic('lisa', clientEvent);
    serverInstance.dispatch('lisa', drawLot());
    serverInstance.dispatch('lisa', clientEvent, typeof optId === 'string' ? optId : undefined); // this happens through Krmx
    serverInstance.dispatch('simon', drawLot());
    serverInstance.dispatch('lisa', cashOut('l-34003'));
    console.info({
      description: 'validate that the server state of simon and the latest view of client simon are structurally identical',
      server: serverInstance.view('simon'),
      client: latestView,
    });
  });
});
