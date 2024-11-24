export default {
  user: "sa",
  password: "bdi89uwe31gdi121uy@7!#!@",
  database: "project",
  server: "localhost",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};
