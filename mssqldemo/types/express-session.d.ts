import "express-session";

declare module "express-session" {
  interface SessionData {
    rId: string;
    user: string;
    name: string;
    region: any;
  }
}