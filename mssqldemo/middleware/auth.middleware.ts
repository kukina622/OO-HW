import { NextFunction, Request, RequestHandler, Response } from "express";

const DEBUG = false;
export const auth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (DEBUG) {
    next();
  } else {
    // check for user credential...
    if (req.session.user || req.session.rId) {
      console.log("authenticated", req.url);
      res.locals.name = req.session.name;
      res.locals.email = req.session.user || req.session.rId || "";
      next();
    } else {
      console.log("not authenticated");
      return res.redirect("/login");
    }
  }
};

export const authAPI: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (DEBUG) {
    next();
  } else {
    // check for user credential...
    if (req.session.user || req.session.rId) {
      console.log("authenticated", req.url);
      next();
    } else {
      console.log("not authenticated");
      res.json({ error: "not authenticated" });
    }
  }
};

export const authManager: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (DEBUG) {
    next();
  } else {
    // check for user credential...
    if (req.session.rId) {
      console.log("manager authenticated", req.url);
      next();
    } else {
      console.log("not authenticated");
      return res.redirect("/login");
    }
  }
};
