module.exports = {
  apps : [{
    name   : "survey",
    script : "./app.mjs",
    env_production: {
      NODE_ENV: "production"
   },
   env_development: {
      NODE_ENV: "development"
   }
  }]
}
