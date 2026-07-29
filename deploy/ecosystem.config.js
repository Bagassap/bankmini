module.exports = {
  apps: [
    {
      name: 'bankmini-api',
      cwd: __dirname + '/../backend',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'bankmini-web',
      cwd: __dirname + '/../frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
