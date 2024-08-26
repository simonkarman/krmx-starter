import { Server } from '@krmx/server';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const chat = (server: Server, customCommands: {[command: string]: (
  username: string,
  args: string[],
  sendServerMessage: (text: string) => void
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
  let chatHistory: { username: string, text: string }[] = [];
  const sendMessage = (username: string, text: string) => {
    const chatMessage = { username, text };
    server.broadcast({ type: 'chat/messaged', payload: chatMessage });
    chatHistory = [...chatHistory, chatMessage].slice(-100);
  };

  // Send chat history to new users
  server.on('link', (username) => {
    server.send(username, { type: 'chat/history', payload: chatHistory });
  });

  // Send messages on join and leave of users
  server.on('join', (username) => {
    sendMessage('<server>', `${capitalize(username)} has joined the server!`);
  });
  server.on('leave', (username) => {
    sendMessage('<server>', `${capitalize(username)} left the server.`);
  });

  // Handle chat messages
  server.on('message', (username, message) => {
    if (message.type === 'chat/message' && 'payload' in message && typeof message.payload === 'string') {
      let handled = false;
      if (message.payload.startsWith('/')) {
        const [command, ...args] = message.payload.slice(1).split(' ');

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
            sendMessage('<server>', 'No users are banned.');
          } else {
            sendMessage('<server>', `Banned users: ${banList.join(', ')}`);
          }
          handled = true;
        }

        // Custom command
        else if (command in customCommands) {
          customCommands[command](username, args, (text) => sendMessage('<server>', text));
          handled = true;
        }
      }

      if (!handled) {
        sendMessage(username, message.payload);
      }
    }
  });
};
