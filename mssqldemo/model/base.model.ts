import sql from "mssql";

export default abstract class BaseModel {
  config: sql.config;
  constructor(config: sql.config) {
    this.config = config;
  }

  async getPool() {
    return sql.connect(this.config);
  }
}
