import { Message } from '@krmx/base';
import { Server } from '@krmx/server';
import { EventSource, EventSourceEvent, EventSourceInstanceProps } from 'board';

/**
 * Add support to this server to run a give event source.
 *  Keeps track of an event source, with a history, validation, and a way to send messages to the event source. Each client
 *  builds the same history, and can send messages to the event source. The event source lives on the server that validates
 *  messages and broadcasts them to clients for the clients to replay. Clients optimistically update their state, and then
 *  update it with the server's response. This is a more complex system, but allows for more complex interactions.
 *
 * @param server The server to support event sourcing on.
 * @param domain The domain of the event source. Used as a prefix in the messages send, for example: 'my-domain/increment'
 * @param eventSource The event source to support.
 * @param props Used to configure the event source instance.
 *
 * @returns An object with methods to turn off and to subscribe and dispatch events.
 */
export const useEventSource = (server: Server, domain: string, eventSource: EventSource<unknown>, props: EventSourceInstanceProps) => {
  const instance = eventSource.spawn(props);
  const history: EventSourceEvent[] = [];

  const handleEvent = (dispatcher: string, event: Message) => {
    const result = instance.dispatch(dispatcher, event);
    if (result !== true) {
      return;
    }
    const esEvent: EventSourceEvent = {
      type: 'es/event',
      payload: { domain, dispatcher: dispatcher, event },
    };
    history.push(esEvent);
    server.broadcast<EventSourceEvent>(esEvent);
  };

  const offMessage = server.on('message', (username, message) => {
    if (!message.type.startsWith(domain + '/')) {
      return;
    }
    handleEvent(username, { ...message, type: message.type.slice(domain.length + 1) });
  });

  const offLink = server.on('link', (username) => {
    history.forEach(event => server.send(username, event));
  });

  return {
    off: () => {
      offMessage();
      offLink();
    },
    handleEvent,
  };
};
