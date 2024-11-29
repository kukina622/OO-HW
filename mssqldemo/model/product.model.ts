import BaseModel from "./base.model";

export default class ProductModel extends BaseModel {
  async getAvailableProducts() {
    const pool = await this.getPool();
    return pool
      .request()
      .query("SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0");
  }

  async getProductByQuery(q?: string) {
    const pool = await this.getPool();

    let query = "";
    let request = pool.request();
    if (q) {
      request.input("q", q);
      query =
        "SELECT * FROM Product WHERE pName LIKE '%' + @q + '%' AND (pCount IS NULL OR pCount >= 0)";
    } else {
      query = "SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0";
    }

    return request.query(query);
  }
}
