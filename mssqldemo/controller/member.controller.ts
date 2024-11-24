import express, { Router, Request, Response } from "express";
import BaseController from "./base.controller";
import MemberModel from "../model/member.model";
import { auth } from "../middleware/auth.middleware";

export default class MemberController extends BaseController {
  private memberModel: MemberModel;

  constructor(router: Router, memberModel: MemberModel) {
    super(router);
    this.memberModel = memberModel;
  }

  initRoutes(): void {
    this.router.get("/login", this.loginPage);
    this.router.post("/login", this.login);
    this.router.get("/logout", auth, this.logout);
    this.router.get("/register", this.registerPage);
    this.router.post("/register", this.register);
    this.router.get("/member", auth, this.memberPage);
    this.router.get("/member/edit", auth, this.memberEditPage);
  }

  private loginPage(req: Request, res: Response) {
    if (req.session.user) {
      res.redirect("/product");
      return;
    }
    if (req.session.rId) {
      res.redirect("/manager");
      return;
    }
    res.render("login");
  }

  private async login(req: Request, res: Response) {
    const username: string = req.body.email;
    const password: string = req.body.password;
    const result = await this.memberModel.loginByUser(username, password);
    if (result.recordset.length > 0) {
      req.session.user = result.recordset[0];
      res.redirect("/product");
      return;
    }

    const manager = await this.memberModel.loginByManager(username, password);
    if (manager.recordset.length > 0) {
      req.session.rId = manager.recordset[0].rId;
      res.redirect("/manager");
      return;
    }

    res.render("login", { loginSuccess: false });
  }

  private logout(req: Request, res: Response) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  }

  private registerPage(req: Request, res: Response) {
    res.render("register", { data: {}, invaild: {} });
  }

  private async register(req: Request, res: Response) {
    try {
      const body = req.body;
      const members = await this.memberModel.getMemberByEmail(body.email);
      if (members.recordset.length > 0) {
        res.render("register", {
          region: "",
          data: body,
          invaild: { email: "email" }
        });
        return;
      }
      const birthday = body.birthday == "" ? null : body.birthday;
      const newMember = await this.memberModel.createMember(
        body.email,
        body.password,
        body.name,
        body.address,
        birthday
      );

      if (newMember.rowsAffected[0] > 0) {
        req.session.user = body.email;
        req.session.region = body.region;

        res.redirect("/product");
        return;
      }

      res.render("register", { region: "", data: body, invaild: {} });
    } catch (error) {}
  }

  private async memberPage(req: Request, res: Response) {
    res.render("member/member");
  }

  private async memberEditPage(req: Request, res: Response) {
    const email = req.session.user;
    try {
      if (!email) {
        res.redirect("/login");
        return;
      }
      const result = await this.memberModel.getMemberByEmail(email);
      if (result.recordset.length === 0) {
        res.redirect("/login");
        return;
      }
      const member = result.recordset[0];
      res.render("member/edit", {
        data: {
          ...member,
          birthday: member?.birthday?.toISOString().split("T")[0]
        }
      });
    } catch (error) {}
  }
}
