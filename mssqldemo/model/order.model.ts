import { injectable } from "inversify";
import BaseModel from "./base.model";
import sql from "mssql";
import { randomUUID } from "crypto";

type Status = "Pending" | "Preparing" | "Shipped" | "Completed" | "Cancelled";

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

  async getOrdersWithoutCartByRid(rId: string) {
    const pool = await this.getPool();

    return pool.request().input("rId", sql.Char, rId).query(`
      SELECT * FROM [Order]
      INNER JOIN Member ON [Order].mId = Member.mEmail
      WHERE [Order].rId = @rId
    `);
  }

  async getOrderByOid(oId: string) {
    const pool = await this.getPool();
    let request = pool.request().input("oId", sql.VarChar, oId);

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
      WHERE [Order].oId = @oId
    `;

    return request.query(query);
  }

  async checkout(mId: string): Promise<{
    oId: string;
    totalPrice: number;
  }> {
    const pool = await this.getPool();
    const oId = randomUUID();
    const tx = await pool.transaction().begin();

    const carts = await tx.request().input("mId", sql.VarChar, mId).query(`
        SELECT 
          Cart.mId, 
          Cart.cTime, 
          Cart.count, 
          Cart.unitPrice, 
          Cart.price,
          Product.pCount,
          Product.rId,
          Product.pId
        FROM Cart 
        INNER JOIN Product ON Cart.pId = Product.pId
        WHERE Cart.mId = @mId AND Cart.oId IS NULL
      `);

    if (carts.recordset.length === 0) {
      await tx.rollback();
      return Promise.reject("Cart is empty");
    }

    let totalPrice = 0;
    for (let index = 0; index < carts.recordset.length; index++) {
      const cart = carts.recordset[index];
      // if (cart.pCount !== null && cart.count > cart.pCount) {
      //   await tx.rollback();
      //   return Promise.reject("Not enough product");
      // }

      const result = await tx
        .request()
        .input("count", sql.Int, cart.count)
        .input("pId", sql.VarChar, cart.pId).query(`
          UPDATE Product SET pCount = pCount - @count WHERE pId = @pId
        `);

      if (result.rowsAffected[0] !== 1) {
        await tx.rollback();
        return Promise.reject("Update product failed");
      }

      totalPrice += cart.price;
    }

    await tx
      .request()
      .input("oId", sql.Char, oId)
      .input("oDate", sql.Date, new Date())
      .input("total", sql.Int, totalPrice)
      .input("mId", sql.VarChar, mId)
      .input("rId", sql.Char, carts.recordset[0].rId).query(`
        INSERT INTO [Order] (oId, oDate, total, mId, rId, status) 
        VALUES(@oId, @oDate, @total, @mId, @rId, 'Pending')
      `);

    const cartUpdate = await tx
      .request()
      .input("oId", sql.VarChar, oId)
      .input("mId", sql.VarChar, mId).query(`
        UPDATE Cart SET oId = @oId WHERE mId = @mId AND oId IS NULL
      `);

    if (cartUpdate.rowsAffected[0] === 0) {
      await tx.rollback();
      return Promise.reject("Update cart failed");
    }

    await tx.commit();

    return { oId, totalPrice };
  }

  async updateOrderStatus(oId: string, status: Status) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("oId", oId)
      .input("status", status)
      .query(`UPDATE [Order] SET status = @status WHERE oId = @oId`);
  }
}
