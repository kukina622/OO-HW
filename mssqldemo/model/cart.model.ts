import { injectable } from "inversify";
import BaseModel from "./base.model";
import sql from "mssql";

@injectable()
export default class CartModel extends BaseModel {
  async getCartByMember(mId: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("mId", sql.VarChar, mId)
      .query(
        "SELECT * FROM Cart, Product WHERE mId = @mId AND oId IS NULL AND Cart.pId = Product.pId"
      );
  }

  async createCart(
    pId: string,
    count: number,
    mId: string,
    cTime: Date,
    unitPrice: number,
    price: number
  ) {
    const pool = await this.getPool();

    return pool
      .request()
      .input("pId", sql.Char, pId)
      .input("count", sql.Int, count)
      .input("mId", sql.VarChar, mId)
      .input("cTime", sql.DateTime, cTime)
      .input("unitPrice", sql.Int, unitPrice)
      .input("price", sql.Int, price)
      .query(
        "INSERT INTO Cart(mId,cTime,count,unitPrice,price,pId) VALUES(@mId,@cTime,@count,@unitPrice,@price,@pId)"
      );
  }

  async deleteCartByCTime(mId: string, cTime: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("mId", sql.VarChar, mId)
      .input("cTime", sql.DateTime, cTime)
      .query(`DELETE Cart WHERE mId = @mId AND cTime = @cTime`);
  }
}
