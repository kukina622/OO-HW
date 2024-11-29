import { lazyInject } from "../di/di-container";
import { auth, authAPI } from "../middleware/auth.middleware";
import ProductModel from "../model/product.model";
import BaseController from "./base.controller";
import express, { Router, Request, Response } from "express";

export default class ProductController extends BaseController {
  @lazyInject("MemberModel")
  private productModel!: ProductModel;

  initRoutes(): void {
    this.router.get("/product", auth, this.productPage.bind(this));
    this.router.get("/api/product/:q?", authAPI, this.searchProduct.bind(this));
  }

  private async productPage(req: Request, res: Response) {
    const products = await this.productModel.getAvailableProducts();
    res.render("product", { data: products.recordset });
  }

  private async searchProduct(req: Request, res: Response) {
    const q = req.params.q;
    const products = await this.productModel.getProductByQuery(q);
    res.json(products.recordset);
  }
}
