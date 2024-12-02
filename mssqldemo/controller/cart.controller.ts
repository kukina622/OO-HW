import { lazyInject } from "../di/di-container";
import { auth, authAPI } from "../middleware/auth.middleware";
import CartModel from "../model/cart.model";
import MemberModel from "../model/member.model";
import OrderModel from "../model/order.model";
import ProductModel from "../model/product.model";
import BaseController from "./base.controller";
import { Request, Response } from "express";

export default class CartController extends BaseController {
  @lazyInject("CartModel")
  private cartModel!: CartModel;

  @lazyInject("ProductModel")
  private productModel!: ProductModel;

  @lazyInject("MemberModel")
  private memberModel!: MemberModel;

  @lazyInject("OrderModel")
  private orderModel!: OrderModel;

  initRoutes(): void {
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
    this.router.get("/checkout", auth, this.checkout.bind(this));
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

  private async checkout(req: Request, res: Response) {
    const mId = req.session.user as string;
    try {
      const cart = await this.cartModel.getCartByMember(mId);
      if (cart.recordset.length == 0) {
        throw new Error("Cart is empty");
      }
      const {
        recordset: [member]
      } = await this.memberModel.getMemberByEmail(mId);

      const address = member.mAddress;

      const { oId, totalPrice } = await this.orderModel.checkout(mId);
      res.render("checkout", {
        data: cart.recordset.map((x) => ({
          ...x,
          mAddress: address
        })),
        oId,
        total: totalPrice
      });
    } catch (error) {
      const p = await this.productModel.getAvailableProducts();
      res.render("product", {
        data: p.recordset,
        message: "結帳失敗",
        errorType: "checkoutError"
      });
    }
  }
}
