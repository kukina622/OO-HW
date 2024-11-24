import { Router } from "express";

export default abstract class BaseController {
  protected router: Router;
  constructor(router: Router) {
    this.router = router;
  }

  abstract initRoutes(): void;
}
