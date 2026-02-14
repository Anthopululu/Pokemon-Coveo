module.exports = {
  apps: [
    {
      name: "pokemon-coveo",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/pokemon-coveo-challenge",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
