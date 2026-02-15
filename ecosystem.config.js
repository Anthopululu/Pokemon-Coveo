module.exports = {
  apps: [
    {
      name: "pokemon-coveo",
      script: "npm",
      args: "start",
      cwd: "/home/ec2-user/pokemon-coveo-challenge",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
