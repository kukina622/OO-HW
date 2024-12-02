import express from "express";
import BaseController from "./base.controller";
import { authManager } from "../middleware/auth.middleware";
import { lazyInject } from "../di/di-container";
import ProductModel from "../model/product.model";
import OrderModel from "../model/order.model";
import { randomUUID } from "crypto";
import { Request, Response } from "express";

export default class ManagerController extends BaseController {
  @lazyInject("ProductModel")
  private productModel!: ProductModel;

  @lazyInject("OrderModel")
  private orderModel!: OrderModel;

  initRoutes(): void {
    const router = express.Router();
    router.use(authManager);
    router.get("/manager", this.managerPage.bind(this));
    router.get("/manager/order", this.managerOrderPage.bind(this));
    router.get("/manager/product/add", this.addProductPage.bind(this));
    router.post("/manager/product/add", this.addProduct.bind(this));
    router.get("/manager/product/edit/:pId", this.editProductPage.bind(this));

    router.post("/manager/product/edit", this.editProduct.bind(this));
    router.get("/manager/product/delete/:pId", this.deleteProduct.bind(this));
    router.get(
      "/api/manager/order/detail/:oId",
      this.getOrderDetail.bind(this)
    );

    router.get("/api/manager/product", this.getProductsByQuery.bind(this));

    router.get(
      "/api/manager/order/complete/:oId",
      this.completeOrder.bind(this)
    );

    router.get("/api/manager/order/cancel/:oId", this.cancelOrder.bind(this));

    this.router.use(router);
  }

  private async managerPage(req: Request, res: Response) {
    const { rId } = req.session;
    try {
      const products = await this.productModel.getAvailableProductByRid(
        rId as string
      );
      res.render("manager", { data: products.recordset, rId: rId });
    } catch (err) {
      res.send("ERROR: " + err);
    }
  }

  private async managerOrderPage(req: Request, res: Response) {
    const rId = req.session.rId as string;

    try {
      const result = await this.orderModel.getOrdersWithoutCartByRid(rId);
      const data = result.recordset.map((x) => ({
        ...x,
        oDate: x.oDate.toISOString().split("T")[0]
      }));

      res.render("manager/order", { data, rId });
    } catch (err) {
      res.send("ERROR: " + err);
    }
  }

  private addProductPage(req: Request, res: Response) {
    res.render("manager/product/add", { data: {}, invaild: {} });
  }

  private async addProduct(req: Request, res: Response) {
    const { rId } = req.session;
    const { unitPrice, count, name } = req.body;
    const _count = count == "" ? null : count;

    const image = req.files?.image;
    let filename = null;

    if (image && !Array.isArray(image)) {
      const ext = image.name.split(".").pop();
      filename = `${randomUUID()}.${ext}`;
      const uploadPath = `${__dirname}/../upload/${filename}`;
      image.mv(uploadPath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    try {
      const result = await this.productModel.createProduct(
        rId as string,
        _count,
        unitPrice,
        name,
        filename
      );

      if (result.rowsAffected[0] > 0) {
        res.redirect("/manager");
        return;
      }
      res.render("manager/product/add", { data: req.body, invaild: {} });
    } catch (err) {
      res.send("ERROR: " + err);
    }
  }

  private async editProductPage(req: Request, res: Response) {
    try {
      const pId = req.params.pId;
      const result = await this.productModel.getProductByPid(pId);
      res.render("manager/product/edit", { data: result.recordset[0] });
    } catch (err) {
      res.json({ result: err });
    }
  }

  private async editProduct(req: Request, res: Response) {
    const rId = req.session.rId as string;
    const { unitPrice, count, name, pId } = req.body;
    const _count = count == "" ? null : count;

    const image = req?.files?.image;
    let filename = req.body.prevImage || null;

    if (image && !Array.isArray(image)) {
      const ext = image.name.split(".").pop();
      filename = `${pId}.${ext}`;
      const uploadPath = `${__dirname}/../upload/${filename}`;
      image.mv(uploadPath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    try {
      const result = await this.productModel.updateProduct(
        pId,
        rId,
        _count,
        unitPrice,
        name,
        filename
      );

      if (result.rowsAffected[0] <= 0) {
        res.json({ result: "No data updated" });
        return;
      }

      res.redirect("/manager");
    } catch (err) {
      res.json({ result: err });
    }
  }

  private async deleteProduct(req: Request, res: Response) {
    const pId = req.params.pId;
    const rId = req.session.rId;

    try {
      if (!pId || !rId) throw new Error("Invalid product or restaurant");

      const result = await this.productModel.deleteProduct(pId, rId);

      if (result.rowsAffected[0] <= 0) {
        res.json({ result: "No data updated" });
        return;
      }
      res.redirect("/manager");
    } catch (err) {
      res.send("Error" + err);
    }
  }

  private async getOrderDetail(req: Request, res: Response) {
    const oId = req.params.oId;
    try {
      const result = await this.orderModel.getOrderByOid(oId);
      res.json(result.recordset);
    } catch (err) {
      res.json({ error: err });
    }
  }

  private async completeOrder(req: Request, res: Response) {
    const oId = req.params.oId;
    try {
      const result = await this.orderModel.updateOrderStatus(oId, "Completed");

      res.json({
        result: result.rowsAffected[0] > 0 ? "ok" : "error"
      });
    } catch (err) {
      res.json({ error: err });
    }
  }

  private async cancelOrder(req: Request, res: Response) {
    const oId = req.params.oId;
    try {
      const result = await this.orderModel.updateOrderStatus(oId, "Cancelled");

      res.json({
        result: result.rowsAffected[0] > 0 ? "ok" : "error"
      });
    } catch (err) {
      res.json({ error: err });
    }
  }

  private async getProductsByQuery(req: Request, res: Response) {
    try {
      const q = req.query.q as string;
      const rId = req.query.rId as string;
      const result = await this.productModel.getProductByQuery(q, rId);
      res.json(result.recordset);
    } catch (err) {
      res.json({ error: err });
    }
  }
}
