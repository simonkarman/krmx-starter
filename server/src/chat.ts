import { Server } from '@krmx/server';
import { capitalize, enumerate } from 'board';

export const chat = (server: Server, customCommands: {[command: string]: (
  username: string,
  args: string[],
  sendServerMessage: (text: string, isExclusive?: boolean) => void
) => void } = {}) => {

  // Keep track of banned users
  let banList: string[] = [];
  server.on('authenticate', (username, isNewUser, reject) => {
    if (server.getUsers().length > 4 && isNewUser) {
      reject('server is full');
    }
    if (banList.includes(username)) {
      reject('you are banned from this server');
    }
  });

  // Keep track of chat history
  let chatHistory: { username: string, text: string, exclusiveDelivery?: string }[] = [];
  const sendMessage = (username: string, text: string, exclusiveDelivery?: string) => {
    const chatMessage = { type: 'chat/messaged', payload: { username, text } };
    if (exclusiveDelivery) {
      server.send(exclusiveDelivery, chatMessage);
    } else {
      server.broadcast(chatMessage);
    }
    chatHistory = [...chatHistory, { ...chatMessage.payload, exclusiveDelivery }].slice(-100);
  };

  // Send chat history to a user that links
  server.on('link', (username) => {
    const historyPayload = chatHistory.filter(c => c.exclusiveDelivery === undefined || c.exclusiveDelivery === username);
    server.send(username, { type: 'chat/history', payload: historyPayload });
  });

  // Send messages on join and leave of users
  server.on('join', (username) => {
    if (chatHistory.length > 0) {
      sendMessage('<server>', `${capitalize(username)} has joined the server!`);
    }
  });
  server.on('leave', (username) => {
    if (chatHistory.length > 0) {
      sendMessage('<server>', `${capitalize(username)} has left the server.`);
    }
    // Clear chat history if no users are connected
    if (server.getUsers().length === 0) {
      chatHistory = [];
    }
  });

  // Handle chat messages
  server.on('message', (username, message) => {
    if (!(message.type === 'chat/message' && 'payload' in message && typeof message.payload === 'string')) {
      return;
    }

    if (!message.payload.startsWith('/')) {
      // Handle chat messages
      sendMessage(username, message.payload);
      return;
    }

    // Handle commands
    let handled = false;
    const [command, ...args] = message.payload.slice(1).toLowerCase().split(' ');

    // Kick
    if (command === 'kick' && args.length === 1 && server.getUsers().some(u => u.username === args[0])) {
      sendMessage('<server>', `${capitalize(args[0])} was kicked by ${capitalize(username)}`);
      server.kick(args[0]);
      handled = true;
    }

    // Ban
    else if (command === 'ban' && args.length === 1) {
      sendMessage('<server>', `${capitalize(args[0])} was banned by ${capitalize(username)}`);
      banList.push(args[0]);
      if (server.getUsers().some(u => u.username === args[0])) {
        server.kick(args[0]);
      }
      handled = true;
    }

    // Unban
    else if (command === 'unban' && args.length === 1 && banList.includes(args[0])) {
      sendMessage('<server>', `${capitalize(args[0])} was unbanned by ${capitalize(username)}`);
      banList = banList.filter(u => u !== args[0]);
      handled = true;
    }

    // Ban List
    else if (command === 'banlist') {
      if (banList.length === 0) {
        sendMessage('<server>', 'No users are banned.', username);
      } else {
        sendMessage('<server>', `Banned users: ${enumerate(banList.map(capitalize))}`, username);
      }
      handled = true;
    }

    // Custom command
    else if (command in customCommands) {
      customCommands[command](username, args, (text, isExclusive) => sendMessage('<server>', text, isExclusive ? username : undefined));
      handled = true;
    }

    if (!handled) {
      sendMessage(
        '<server>',
        `Unknown command. Try ${
          Object
            .keys(customCommands)
            .map(c => `/${c}`)
            .join(', ')
        }, /kick, /ban, /unban or /banlist`,
        username,
      );
    }
  });
};
