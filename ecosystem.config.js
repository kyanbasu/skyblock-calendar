// run simply with
// pm2 start ecosystem.config.js
module.exports = {
    apps : [{
      name   : "skyblock-calendar",
      script : "./calendar.js",
      watch : ['calendar.js'],
      watch_delay : 1000,
      log_file : "./calendar.log",
    }]
}