// run simply with
// pm2 start ecosystem.config.js
module.exports = {
    apps : [{
      name   : "skyblock-calendar",
      script : "./calendar.js",
      log_file : "./calendar.log",
    }]
}