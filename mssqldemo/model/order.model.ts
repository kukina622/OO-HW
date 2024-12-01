import { injectable } from "inversify";
import BaseModel from "./base.model";
import sql from "mssql";

@injectable()
export default class OrderModel extends BaseModel {
  async getOrders(mId: string, status?: string) {
    const pool = await this.getPool();
    let request = pool.request().input("mId", sql.VarChar, mId);

    let query = `
      SELECT 
        [Order].*,
        [Cart].count,
        [Cart].unitPrice,
        [Cart].price,
        Product.pName,
        Product.image
      FROM [Order]
      INNER JOIN Cart ON [Order].oId = [Cart].oId
      LEFT JOIN Product ON [Cart].pId = Product.pId
      WHERE [Order].mId = @mId
    `;

    if (status !== "ALL" && status) {
      request.input("status", sql.NVarChar, status);
      query += " AND [Order].status = @status";
    }

    return request.query(query);
  }
}
