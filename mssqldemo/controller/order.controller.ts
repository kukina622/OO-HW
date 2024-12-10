import { lazyInject } from "../di/di-container";
import { auth, authAPI } from "../middleware/auth.middleware";
import OrderModel from "../model/order.model";
import BaseController from "./base.controller";
import { Request, Response } from "express";

export default class OrderController extends BaseController {
  @lazyInject("OrderModel")
  private orderModel!: OrderModel;

  initRoutes(): void {
    this.router.get("/history-order", auth, this.historyOrderPage.bind(this));
    this.router.get("/api/orders", authAPI, this.getOrders.bind(this));
    this.router.get(
      "/api/order/cancel/:oId",
      authAPI,
      this.memberCancelOrder.bind(this)
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
      res.json({ error: (error as any).message });
    }
  }

  private async memberCancelOrder(req: Request, res: Response) {
    const oId = req.params.oId;
    const mId = req.session.user as string;
    try {
      const order = await this.orderModel.getOrderByOid(oId);

      if (order.recordset.length === 0) {
        res.json({ result: "error", error: "Order not found" });
        return;
      }

      if (order.recordset[0].mId !== mId) {
        res.json({ result: "error", error: "Permission denied" });
        return;
      }

      const status = order.recordset[0].status;
      console.log(status);

      if (status !== "Pending" && status !== "Preparing") {
        res.json({ result: "error", error: "Invalid status" });
        return;
      }

      const result = await this.orderModel.updateOrderStatus(oId, "Cancelled");
      res.json({
        result: result.rowsAffected[0] > 0 ? "ok" : "error"
      });
    } catch (err) {
      res.json({ result: "error", error: err });
    }
  }
}
