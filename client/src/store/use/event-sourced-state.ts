
// useEventSourcedState
//  Keeps track of an event source, with a history, validation, and a way to send messages to the event source. Each client
//  builds the same history, and can send messages to the event source. The event source lives on the server that validates
//  messages and broadcasts them to clients for the clients to replay. Clients optimistically update their state, and then
//  update it with the server's response. This is a more complex system, but allows for more complex interactions.

// TODO: Coming soon!
