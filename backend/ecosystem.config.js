module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "npm",
      args: "run start",
      cwd: "/home/ubuntu/akar-event-management-system/backend",
      interpreter: "node",

      post_start: ["git pull origin main", "npm i", "npm run build"],

      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000,
      watch: false,

      out_file: "buildLogs/out.log",
      error_file: "buildLogs/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
