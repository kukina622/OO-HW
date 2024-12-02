import { injectable } from "inversify";
import BaseModel from "./base.model";
import sql from "mssql";
import { randomUUID } from "crypto";

@injectable()
export default class ProductModel extends BaseModel {
  async getAvailableProducts() {
    const pool = await this.getPool();
    return pool
      .request()
      .query("SELECT * FROM Product WHERE pCount IS NULL OR pCount >= 0");
  }

  async getAvailableProductByPid(pId: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("pId", sql.Char, pId)
      .query(
        "SELECT * FROM Product WHERE pId = @pId AND (pCount >= 0 OR pCount IS NULL)"
      );
  }

  async getAvailableProductByRid(rId: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("rId", sql.Char, rId)
      .query(
        "SELECT * FROM Product WHERE rId = @rId AND (pCount >= 0 OR pCount IS NULL)"
      );
  }

  async getProductByPid(pId: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("pId", sql.Char, pId)
      .query("SELECT * FROM Product WHERE pId = @pId");
  }

  async getProductByQuery(q?: string, rId?: string) {
    const pool = await this.getPool();

    let query = "SELECT * FROM Product WHERE (pCount IS NULL OR pCount >= 0) ";
    let request = pool.request();
    if (q) {
      request.input("q", q);
      query += " AND pName LIKE '%' + @q + '%'";
    }

    if (rId) {
      request.input("rId", rId);
      query += " AND rId = @rId";
    }
    return request.query(query);
  }

  async getProductByCategory(category: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("category", sql.VarChar, category)
      .query("SELECT * FROM Product WHERE Category = @category");
  }

  async createProduct(
    rId: string,
    count: number,
    unitPrice: string,
    name: string,
    filename?: string | null
  ) {
    const pool = await this.getPool();
    const pId = randomUUID();
    return pool
      .request()
      .input("pId", sql.Char, pId)
      .input("count", sql.Int, count)
      .input("unitPrice", sql.VarChar, unitPrice)
      .input("name", sql.NVarChar, name)
      .input("rId", sql.Char, rId)
      .input("image", sql.Text, filename)
      .query(
        "INSERT INTO Product(pId, pCount, unitPrice, pName, rId, image) " +
          "VALUES(@pId, @count, @unitPrice, @name, @rId, @image)"
      );
  }

  async updateProduct(
    pId: string,
    rId: string,
    count: number,
    unitPrice: string,
    name: string,
    filename?: string | null
  ) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("pId", sql.Char, pId)
      .input("count", sql.Int, count)
      .input("unitPrice", sql.VarChar, unitPrice)
      .input("name", sql.NVarChar, name)
      .input("rId", sql.Char, rId)
      .input("image", sql.Text, filename)
      .query(
        "UPDATE Product SET pCount=@count, unitPrice=@unitPrice, pName=@name, image=@image WHERE pId=@pId AND rId=@rId"
      );
  }

  async deleteProduct(pId: string, rId: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("pId", sql.Char, pId)
      .input("rId", sql.Char, rId)
      .query("UPDATE Product SET pCount = -2 WHERE pId = @pId AND rId = @rId");
  }
}
