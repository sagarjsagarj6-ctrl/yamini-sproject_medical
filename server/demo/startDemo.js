import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  throw new Error('The presentation demo cannot run in production.');
}

process.env.DEMO_MODE = 'true';
const { startServer } = await import('../server.js');
startServer().catch((error) => {
  console.error('MEDICO demo failed to start:', error.message);
  process.exitCode = 1;
});
