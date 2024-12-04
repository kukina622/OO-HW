import express, { Router, Request, Response } from "express";
import BaseController from "./base.controller";
import MemberModel from "../model/member.model";
import { auth } from "../middleware/auth.middleware";
import { lazyInject } from "../di/di-container";

export default class MemberController extends BaseController {
  @lazyInject("MemberModel")
  private memberModel!: MemberModel;

  initRoutes(): void {
    this.router.get("/", this.index.bind(this));

    this.router.get("/login", this.loginPage.bind(this));
    this.router.post("/login", this.login.bind(this));
    this.router.get("/logout", auth, this.logout.bind(this));
    this.router.get("/register", this.registerPage.bind(this));
    this.router.post("/api/register", this.register.bind(this));
    this.router.get("/member", auth, this.memberPage.bind(this));
    this.router.get("/member/edit", auth, this.memberEditPage.bind(this));
    this.router.get(
      "/api/email-validation/:email",
      this.emailValidation.bind(this)
    );
    this.router.post("/api/member/edit", auth, this.editMember.bind(this));
    this.router.post(
      "/api/member/password/edit",
      auth,
      this.editPassword.bind(this)
    );
  }

  private index(req: Request, res: Response) {
    res.redirect("/login");
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
      req.session.user = username;
      req.session.name = result.recordset[0].mName;
      res.redirect("/product");
      return;
    }

    const manager = await this.memberModel.loginByManager(username, password);
    if (manager.recordset.length > 0) {
      req.session.rId = manager.recordset[0].rId;
      req.session.name = manager.recordset[0].rName;
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
        res.json({ result: "account-existed" });
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
        req.session.name = body.name;
        res.redirect("/product");
        return;
      }

      res.json({ result: "error" });
    } catch (error) {
      res.status(400).json({ error: error });
    }
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
        throw new Error("Member not found");
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

  private async emailValidation(req: Request, res: Response) {
    const re =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const { email } = req.params;
    if (!email.toLowerCase().match(re)) {
      res.json({ result: "invalid-email" });
      return;
    }
    
    const members = await this.memberModel.getMemberByEmail(email);
    if (members.recordset.length > 0) {
      res.json({ result: "account-existed" });
      return;
    }
    res.json({ result: "ok" });
    return;
  }

  private async editMember(req: Request, res: Response) {
    try {
      const mId = req.session.user;
      const { name, address, birthday } = req.body;
      if (!mId) {
        res.redirect("/login");
        return;
      }

      const result = await this.memberModel.updateMemberByEmail(
        mId,
        name,
        address,
        birthday
      );

      if (result.rowsAffected[0] > 0) {
        res.json({ result: "ok" });
        req.session.reload(() => {
          req.session.name = name;
          req.session.save();
        });
        return;
      }
      throw new Error("更新失敗");
    } catch (error) {
      res.status(400).json({ error: error });
    }
  }

  private async editPassword(req: Request, res: Response) {
    const mId = req.session.user as string;
    const { password, newPassword } = req.body;
    try {
      const member = await this.memberModel.loginByUser(mId, password);

      if (member.recordset.length === 0) {
        throw new Error("密碼錯誤");
      }

      const result = await this.memberModel.updateMemberPasswordByEmail(
        mId,
        newPassword
      );

      if (result.rowsAffected[0] > 0) {
        res.json({ result: "ok" });
        return;
      }

      throw new Error("更新失敗");
    } catch (error) {
      res.status(400).json({ error: error });
    }
  }
}
