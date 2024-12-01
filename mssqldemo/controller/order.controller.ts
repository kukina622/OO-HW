import { lazyInject } from "../di/di-container";
import { auth, authAPI } from "../middleware/auth.middleware";
import CartModel from "../model/cart.model";
import OrderModel from "../model/order.model";
import ProductModel from "../model/product.model";
import BaseController from "./base.controller";
import { Request, Response } from "express";

export default class OrderController extends BaseController {
  @lazyInject("OrderModel")
  private orderModel!: OrderModel;

  @lazyInject("CartModel")
  private cartModel!: CartModel;

  @lazyInject("ProductModel")
  private productModel!: ProductModel;

  initRoutes(): void {
    this.router.get("/history-order", auth, this.historyOrderPage.bind(this));
    this.router.get("/api/orders", authAPI, this.getOrders.bind(this));
    this.router.get("/api/cart", authAPI, this.getCarts.bind(this));
    this.router.get(
      "/api/cart/add/:pId/:count",
      authAPI,
      this.addProductToCart.bind(this)
    );
    this.router.get(
      "/api/cart/delete/:cTime",
      authAPI,
      this.deleteProductFromCart.bind(this)
    );
  }

  private async historyOrderPage(req: Request, res: Response) {
    res.render("member/history-order");
  }

  private async getOrders(req: Request, res: Response) {
    const mId = req.session.user;
    const status = req.query.status as string;
    try {
      if (!mId) throw new Error("Invalid member id");
      const result = await this.orderModel.getOrders(mId, status);
      const orders = result.recordset
        .map((x) => ({
          ...x,
          oDate: x.oDate.toISOString().split("T")[0]
        }))
        .reduce((acc, order) => {
          const { oId, pName, count, unitPrice, price, image, ...rest } = order;

          acc[oId] = acc[oId] || { ...rest, oId, items: [] };
          acc[oId].items = [
            ...acc[oId].items,
            { pName, count, unitPrice, price, image }
          ];

          return acc;
        }, {});
      res.json(Object.values(orders));
    } catch (error) {
      res.json({ error });
    }
  }

  private async getCarts(req: Request, res: Response) {
    const mId = req.session.user;
    try {
      if (!mId) throw new Error("Invalid member id");
      const result = await this.cartModel.getCartByMember(mId);
      if (result.recordset.length == 0) {
        res.json({ cart: [], total: 0 });
        return;
      }

      const total = result.recordset.reduce((acc, row) => acc + row.price, 0);
      res.json({ cart: result.recordset, total: total });
    } catch (err) {
      console.log(err);
    }
  }

  private async addProductToCart(req: Request, res: Response) {
    const { pId, count } = req.params;
    const mId = req.session.user as string;
    const cTime = new Date();
    const _count = parseInt(count, 10);
    try {
      const c = await this.productModel.getAvailableProductByPid(pId);

      if (c.recordset.length == 0) {
        res.json({ error: "商品不存在" });
        return;
      }

      const product = c.recordset[0];
      const unitPrice = product.unitPrice;
      const price = _count * unitPrice;

      await this.cartModel.createCart(
        pId,
        _count,
        mId,
        cTime,
        unitPrice,
        price
      );

      res.json({ result: "ok", count: count });
    } catch (err) {
      res.json({ error: err });
    }
  }

  private async deleteProductFromCart(req: Request, res: Response) {
    const { cTime } = req.params;
    const mId = req.session.user as string;
    try {
      const result = await this.cartModel.deleteCartByCTime(mId, cTime);
      if (result.rowsAffected[0] > 0) {
        res.json({ result: "ok" });
        return;
      }
      res.json({ error: "刪除失敗" });
    } catch (err) {
      res.json({ error: err });
    }
  }
}
