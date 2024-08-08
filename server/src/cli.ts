import { Server, VERSION } from '@krmx/server';
import chalk from 'chalk';

export const cli = (server: Server) => {
  // eslint-disable-next-line no-process-env
  if ([undefined, '0', 'false'].includes(process.env.KRMX_SERVER_CLI)) { return; }

  const now = () => new Date().toLocaleTimeString();

  let drawing: ReturnType<typeof setTimeout> | undefined;
  let listenPort = 0;
  let runningSince = Date.now();
  const joinedAt: { [k: string]: string } = {};
  const linkedAt: { [k: string]: string } = {};
  const messages: { [k: string]: { count: number, last: { at: string, type: string } } } = {};
  const redrawScreen = () => {
    const _ = () => {
      // Clear screen
      process.stdout.write('\x1Bc');

      // Draw header
      console.info(chalk.underline('Krmx Server ', chalk.bold(VERSION)));
      const isListening = server.getStatus() === 'listening';
      const statusChalk = isListening ? chalk.bgGreenBright : chalk.bgRed;
      console.info(statusChalk.black(server.getStatus().toUpperCase()), isListening ? `on :${listenPort}` : '');
      if (isListening) {
        console.info('Uptime', chalk.greenBright(Math.floor((Date.now() - runningSince) / 60_000)), 'minutes');
      }
      console.info('');

      // Draw users
      const users = server.getUsers();
      if (users.length > 0) {
        const longestUsername = users.reduce((acc, user) => Math.max(acc, user.username.length), 8);
        console.log(
          '  ',
          chalk.underline('Username') + ''.padEnd(longestUsername - 8),
          chalk.underline('Joined At'),
          chalk.underline('(Un)linked At'),
          chalk.underline('Messages'),
        );
        for (const user of users) {
          const usernamePadded = user.username.padEnd(longestUsername);
          const userChalk = user.isLinked ? chalk.green : chalk.gray;
          const linkedEmoji = user.isLinked ? '🟢' : '🔴';
          console.info(
            linkedEmoji,
            userChalk(usernamePadded),
            joinedAt[user.username],
            ` ${linkedAt[user.username]}     `,
            messages[user.username].count,
            `total (last '${messages[user.username].last.type}' at ${messages[user.username].last.at})`,
          );
        }
        console.info('');
        console.log(chalk.gray(`Total: ${users.filter(u => u.isLinked).length} / ${users.length} user${users.length === 1 ? '' : 's'}`));
      } else {
        console.info(chalk.white('No users connected'));
      }
      console.info('');

      // Draw footer
      console.info('Krmx at', chalk.blue('https://simonkarman.github.io/krmx'));
      console.info('Starter at', chalk.blue('https://github.com/simonkarman/krmx-starter'));
    };
    if (drawing) { clearTimeout(drawing); }
    drawing = setTimeout(_, 10);
  };

  // Redraw every time something changes (except messages)
  redrawScreen();
  server.all(() => redrawScreen());

  // Keep track of some data
  server.on('listen', (port) => {
    listenPort = port;
    runningSince = Date.now();
  });
  server.on('join', (username) => {
    messages[username] = { count: 0, last: { at: now(), type: 'none' } };
    joinedAt[username] = now();
  });
  server.on('link', (username) => {
    linkedAt[username] = now();
  });
  server.on('unlink', (username) => {
    linkedAt[username] = now();
  });
  server.on('leave', (username) => {
    delete joinedAt[username];
    delete linkedAt[username];
    delete messages[username];
  });
  server.on('message', (username, message) => {
    messages[username] = { count: messages[username].count + 1, last: { at: now(), type: message?.type } };
  });
};
