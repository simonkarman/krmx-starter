import { z, ZodError } from 'zod';
import { EventSource } from '../../src';

const createTestEventSource = () => {
  const eventSource = new EventSource({ data: 0 });
  const inc = eventSource.when('inc', z.number(), (state, dispatcher, payload) => {
    state.data += dispatcher.length;
    state.data *= payload;
  });
  const eventSourceInstance = eventSource.spawn({ optimisticSeconds: 10 });
  const mockSubscription = jest.fn();
  eventSourceInstance.onChange(mockSubscription);
  const mockOptimisticSubscription = jest.fn();
  eventSourceInstance.onOptimisticChange(mockOptimisticSubscription);
  return { eventSource, eventSourceInstance, mockSubscription, mockOptimisticSubscription, inc };
};

describe('EventSource', () => {
  it('should support basic functionality of when, onChange, and dispatch', () => {
    const { eventSourceInstance, mockSubscription, inc } = createTestEventSource();
    expect(eventSourceInstance.dispatch('root', inc(2))).toBe(true);
    expect(mockSubscription).toHaveBeenCalledWith({ data: 8 });
    expect(eventSourceInstance.dispatch('another', inc(3))).toBe(true);
    expect(mockSubscription).toHaveBeenCalledWith({ data: 45 });
  });
  it('should work with the example from the documentation', () => {
    const source = new EventSource({ counter: 0 });
    const increment = source.when('increment', z.number(), (state, dispatcher, payload) => {
      if (dispatcher === 'admin') {
        state.counter += payload;
      }
    });

    const instance = source.spawn({ optimisticSeconds: 10 });
    const mock = jest.fn();
    instance.onChange(mock);
    instance.dispatch('admin', increment(3));
    expect(mock).toHaveBeenCalledWith({ counter: 3 });
  });
  it('should not allow to rebind the same event type twice', () => {
    const { eventSource } = createTestEventSource();
    expect(() => eventSource.when('inc', z.string(), (state) => {
      state.data = 0;
    })).toThrow('event type inc is already in use');
  });
  it('should allow using a z.undefined() schema as the payload schema, and constructing an instance of it without providing an argument', () => {
    const eventSource = new EventSource({ data: 0 });
    const u = eventSource.when('undefined', z.undefined(), (state, dispatcher) => {
      state.data += dispatcher.length;
    });
    expect(u()).toEqual({ type: 'undefined' });
    expect(u()).toEqual({ type: 'undefined', payload: undefined });
  });
  it('should allow using a z.object() schema as the payload schema', () => {
    const eventSource = new EventSource({ data: 0 });
    const obj = eventSource.when('object', z.object({
      hello: z.string(),
      world: z.object({ name: z.string(), age: z.number() }),
    }), (state, _, payload) => {
      state.data = payload.world.age;
    });
    const exampleObject = () => ({ hello: 'hey', world: { name: 'simon', age: 30 } });
    expect(obj(exampleObject())).toEqual({
      type: 'object',
      payload: exampleObject(),
    });
    const eventSourceInstance = eventSource.spawn({ optimisticSeconds: 10 });
    expect(eventSourceInstance.dispatch('root', { type: 'object', payload: {} })).toBeInstanceOf(ZodError);
    expect(eventSourceInstance.dispatch('root', { type: 'object', payload: exampleObject() })).toBe(true);
  });
  it('should return false on dispatching an event with an unknown type', () => {
    const { eventSourceInstance, mockSubscription } = createTestEventSource();
    expect(eventSourceInstance.dispatch('root', { type: 'this-does-not-exist', payload: 'irrelevant' })).toBe(false);
    expect(mockSubscription).not.toHaveBeenCalled();
  });
  it('should return the zod error when dispatching an event with a schema mismatch', () => {
    const { eventSourceInstance, mockSubscription } = createTestEventSource();
    expect(eventSourceInstance.dispatch('root', { type: 'inc', payload: 'not-a-number' })).toBeInstanceOf(ZodError);
    expect(mockSubscription).not.toHaveBeenCalled();
  });
  it('should allow a handler to return a new state object instead of manipulating the existing state', () => {
    const eventSource = new EventSource({ reset: false });
    const reset = eventSource.when('reset', z.undefined(), () => ({ reset: true }));
    const eventSourceInstance = eventSource.spawn({ optimisticSeconds: 10 });
    const mock = jest.fn();
    eventSourceInstance.onChange(mock);
    eventSourceInstance.dispatch('root', reset());
    expect(mock).toHaveBeenCalledWith({ reset: true });
  });
  it('should gracefully handle error thrown in any handler as if the state was not changed', () => {
    const eventSource = new EventSource({ data: 0 });
    const increment = eventSource.when('increment', z.number(), (state, _, payload) => {
      state.data += payload;
    });
    const errorIfFive = eventSource.when('errorIfFive', z.undefined(), (state) => {
      state.data += 1; // test that even changing the state before an error does not result in a change
      if (state.data === 6) {
        throw new Error('data was 5!');
      }
    });
    const eventSourceInstance = eventSource.spawn({ optimisticSeconds: 10 });
    const mock = jest.fn();
    const optimisticMock = jest.fn();
    eventSourceInstance.onChange(mock);
    eventSourceInstance.onOptimisticChange(optimisticMock);
    eventSourceInstance.dispatch('root', increment(2));
    eventSourceInstance.dispatch('root', errorIfFive(), true); // test an initially succeeded optimistic event can fail later
    eventSourceInstance.dispatch('root', increment(3));
    eventSourceInstance.dispatch('root', errorIfFive()); // test a non-optimistic event can fail
    eventSourceInstance.dispatch('root', errorIfFive(), true); // test an optimistic event can fail, and be resolved later
    eventSourceInstance.dispatch('root', increment(2));
    eventSourceInstance.dispatch('root', errorIfFive());
    expect(mock.mock.calls).toStrictEqual([
      [ { data: 2 } ],
      [ { data: 5 } ],
      [ { data: 5 } ],
      [ { data: 7 } ],
      [ { data: 8 } ],
    ]);
    expect(optimisticMock.mock.calls).toStrictEqual([
      [ { data: 2 } ],
      [ { data: 3 } ],
      [ { data: 5 } ],
      [ { data: 5 } ],
      [ { data: 5 } ],
      [ { data: 8 } ],
      [ { data: 8 } ],
    ]);
  });
  it('should allow an event to be dispatched optimistically, only triggering an optimistic update', () => {
    const { eventSourceInstance, mockSubscription, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(3), true);
    expect(mockSubscription).not.toHaveBeenCalled();
    expect(mockOptimisticSubscription).toHaveBeenCalledWith({ data: 12 });
  });
  it('should allow multiple optimistically dispatched events to stack', () => {
    const { eventSourceInstance, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(3), true);
    eventSourceInstance.dispatch('person', inc(5), true);
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(2);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(2, { data: 90 });
  });
  it('should reapply optimistically dispatched events after one of the events has been verified', () => {
    const { eventSourceInstance, mockSubscription, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(3), true);
    eventSourceInstance.dispatch('person', inc(5), true);
    eventSourceInstance.dispatch('person', inc(5), false);
    expect(mockSubscription).toHaveBeenCalledTimes(1);
    expect(mockSubscription).toHaveBeenCalledWith({ data: 30 });
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(3);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(3, { data: 102 });
  });
  it('should prune all expired optimistically dispatched events', () => {
    const { eventSourceInstance, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(4), true);
    eventSourceInstance.props.optimisticSeconds = -1; // immediate expiry for next optimistic events
    eventSourceInstance.dispatch('person-a', inc(6), true);
    eventSourceInstance.dispatch('person-b', inc(7), true);
    eventSourceInstance.dispatch('person', inc(5));
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(4);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(4, { data: 136 });
  });
  it('should allow to flush all optimistic state', () => {
    const { eventSourceInstance, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(4), true);
    eventSourceInstance.flushOptimisticState();
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(2);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(2, { data: 0 });
  });
  it('should allow to manually flush all expired optimistic state', () => {
    const { eventSourceInstance, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.props.optimisticSeconds = -1; // immediate expiry for next optimistic events
    eventSourceInstance.dispatch('admin', inc(2), true);
    eventSourceInstance.props.optimisticSeconds = 10;
    eventSourceInstance.dispatch('root', inc(6), true);
    eventSourceInstance.props.optimisticSeconds = -1; // immediate expiry for next optimistic events
    eventSourceInstance.dispatch('admin', inc(3), true);
    eventSourceInstance.flushExpiredOptimisticState();
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(4);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(4, { data: 24 });
  });
  it('should verify only one event if multiple exact copies of the same event are optimistic', () => {
    const { eventSourceInstance, mockOptimisticSubscription, inc } = createTestEventSource();
    eventSourceInstance.dispatch('person-a', inc(4), true);
    eventSourceInstance.dispatch('person-a', inc(4), true);
    eventSourceInstance.dispatch('person-a', inc(4));
    expect(mockOptimisticSubscription).toHaveBeenCalledTimes(3);
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(3, { data: 160 });
  });
  it('should not broadcast to optimistic subscriptions when nothing was flushed', () => {
    const { eventSourceInstance, mockOptimisticSubscription } = createTestEventSource();
    eventSourceInstance.flushExpiredOptimisticState();
    eventSourceInstance.flushOptimisticState();
    expect(mockOptimisticSubscription).not.toHaveBeenCalled();
  });
  it('should not change initial state during usage', () => {
    const { eventSource, eventSourceInstance, inc } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(3));
    eventSourceInstance.dispatch('admin', inc(4), true);
    expect(eventSource.initialState).toStrictEqual({ data: 0 });
    expect(eventSourceInstance.initialState).toStrictEqual({ data: 0 });
  });
  it('should be able to reset to the initial state', () => {
    const { eventSourceInstance, inc, mockSubscription, mockOptimisticSubscription } = createTestEventSource();
    eventSourceInstance.dispatch('root', inc(3));
    eventSourceInstance.dispatch('admin', inc(4), true);
    eventSourceInstance.reset();
    expect(mockSubscription).toHaveBeenNthCalledWith(2, { data: 0 });
    expect(mockOptimisticSubscription).toHaveBeenNthCalledWith(3, { data: 0 });
  });
});
