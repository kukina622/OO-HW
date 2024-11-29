import sql from "mssql";
import config from "../config";

export default abstract class BaseModel {
  async getPool() {
    return sql.connect(config);
  }
}
