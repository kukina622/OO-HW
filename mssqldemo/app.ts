import express from "express";
import session from "express-session";
import fileUpload from "express-fileupload";
import BaseController from "./controller/base.controller";
import MemberController from "./controller/member.controller";
import ProductController from "./controller/product.controller";
import OrderController from "./controller/order.controller";
import "./di/di-container";

const appInit = async () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(
    session({
      secret: "test-cert",
      saveUninitialized: false,
      resave: true
    })
  );
  app.use(fileUpload());
  app.use("/public", express.static(__dirname + "/public"));
  app.use("/upload", express.static(__dirname + "/upload"));

  app.set("views", "./view");
  app.set("view engine", "ejs");

  const controllers: BaseController[] = [
    new MemberController(app),
    new ProductController(app),
    new OrderController(app)
  ];

  controllers.forEach((controller) => {
    controller.initRoutes();
  });

  return app;
};

export default appInit;
