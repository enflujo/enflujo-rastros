module.exports = {
  apps: [
    {
      name: 'Rastros',
      script: './servidor/index.js',
      env: {
        NODE_ENV: 'produccion',
        PUERTO: 4009,
      },
    },
  ],
};
