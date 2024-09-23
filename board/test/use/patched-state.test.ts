import { Random, PatchedState } from '../../src';
import { z } from 'zod';

describe('Patched State', () => {
  it('should work with the documentation example', () => {
    const state = new PatchedState(
      // the initial state of the system
      { items: [{ owner: 'simon', value: 3 }, { owner: 'lisa', value: 4 }] },
      // the view mapper function
      (state, username) => ({
        yourItems: state.items.filter(item => item.owner === username),
        totalValue: state.items.reduce((sum, item) => sum + item.value, 0),
      }),
    );
    const inc = state.when(
      'increment',
      // payload schema
      z.number().int().min(1).max(5),
      // handler (ran server side only)
      (state, dispatcher, payload) => {
        state.items.forEach(item => {
          if (item.owner === dispatcher) {
            item.value += payload;
          }
        });
      },
      // optimistic handler (ran client side only)
      (view, _, payload) => {
        view.yourItems.forEach(item => {
          item.value += payload;
          view.totalValue += payload;
        });
      });

    // Spawn a server
    const server = state.spawnServer();

    // Spawn a client
    const client = state.spawnClient();
    client.set(server.view('simon'));
    server.subscribe((getDeltaFor, optimisticId) => {
      const delta = getDeltaFor('simon');
      if (delta === false) {
        optimisticId && client.releaseOptimistic(optimisticId);
        return;
      }
      client.apply(delta, optimisticId);
    });
    const event = inc(2);
    const optimisticId = client.optimistic('simon', event);
    if (typeof optimisticId === 'string') {
      server.dispatch('simon', event, optimisticId);
    }

    // Expect
    expect(server.view('simon')).toStrictEqual(client.view());
  });
  it('should work with a complex example including optimistic state', () => {
    // Define patched state
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

    // After some initial messages, start an example client for lisa
    const clientInstance = lotState.spawnClient();
    serverInstance.subscribe((getDeltaFor, optimisticId) => {
      const delta = getDeltaFor('lisa');
      if (delta === false) {
        optimisticId && clientInstance.releaseOptimistic(optimisticId);
        return;
      }
      try {
        clientInstance.apply(delta, optimisticId); // this happens through Krmx
      } catch (err) {
        console.error('error applying delta', err);
      }
    });
    let latestView: LotView = undefined as unknown as LotView;
    clientInstance.subscribe((view) => {
      latestView = view; // this would update external store in react
    });
    clientInstance.set(serverInstance.view('lisa')); // this happens through Krmx

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
    expect(latestView).toStrictEqual(serverInstance.view('lisa'));
    expect(latestView).toStrictEqual(clientInstance.view());
  });
  it('should not allow applying or optimistic when set is not called', () => {
    const state = new PatchedState({ value: 0 }, (state) => state);
    const inc = state.when('inc', z.undefined(), (state) => { state.value += 1; });
    const client = state.spawnClient();
    expect(() => client.apply({})).toThrow();
    expect(() => client.optimistic('simon', inc())).toThrow();
    expect(client.view()).toBeUndefined();
  });
  it('should mark optimistic updates as executed even if the view is not updated', () => {
    const state = new PatchedState(
      { value: 0, view: 1 },
      (state) => state.view,
    );
    // inc only changes the value, which is not part of the view, while it does change the view optimistically
    // this is to test that the optimistic update is marked as executed even if the view for that client does not show a delta
    const inc = state.when('inc', z.undefined(), (state) => { state.value += 1; }, (view) => view + 1);

    const server = state.spawnServer();
    const client = state.spawnClient();

    client.set(server.view('simon')); // send from server to client through Krmx
    server.subscribe((getDeltaFor, optimisticId) => {
      const delta = getDeltaFor('simon');
      if (delta === false) {
        optimisticId && client.releaseOptimistic(optimisticId); // send from server to client through Krmx
        return;
      }
      client.apply(delta, optimisticId); // send from server to client through Krmx
    });
    const event = inc();
    const optimisticId = client.optimistic('simon', event);
    if (typeof optimisticId === 'string') {
      server.dispatch('client', event, optimisticId); // event and optimistic id send from client to server through Krmx
    }

    expect(server.view('simon')).toStrictEqual(client.view());
  });
  // test optimistic for event with no optimistic handler
  // make errors thrown in server handler available to the user
  // make errors thrown in optimistic handler available to the user
  // validate if there are any other places where errors are completely ignored and inaccessible to the user
  // allow a server handler to already commit any made changes during the handler, that if the handler throws an error, the those prior changes are
  //   not rolled back
  // TODO: think about how to handle informing the clients about the mistakes they made (errors thrown by the server handlers)
  // TODO: add support for unsubscribe and use this in client and server implentations
});
