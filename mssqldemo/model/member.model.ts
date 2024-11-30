import sql from "mssql";
import BaseModel from "./base.model";
import { injectable } from "inversify";
import "reflect-metadata";

@injectable()
export default class MemberModel extends BaseModel {
  async loginByUser(username: string, password: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("username", sql.VarChar, username)
      .input("password", sql.VarChar, password)
      .query(
        "select * from Member where mEmail = @username and mPassword = @password"
      );
  }

  async loginByManager(username: string, password: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("email", sql.VarChar, username)
      .input("password", sql.VarChar, password)
      .query(
        "SELECT rId FROM Manager WHERE mEmail = @email AND mPassword = @password"
      );
  }

  async getMemberByEmail(email: string) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("email", sql.VarChar, email)
      .query("select * from Member where mEmail = @email");
  }

  async createMember(
    email: string,
    password: string,
    name: string,
    address: string,
    birthday: string | null
  ) {
    const pool = await this.getPool();
    birthday = birthday == "" ? null : birthday;

    return pool
      .request()
      .input("mEmail", sql.VarChar, email)
      .input("mPassword", sql.VarChar, password)
      .input("birthday", sql.Date, birthday)
      .input("mName", sql.NVarChar, name)
      .input("mAddress", sql.VarChar, address) //加住址
      .query(
        "INSERT INTO Member(mEmail, mPassword, birthday, mName, mAddress)" +
          " VALUES(@mEmail, @mPassword, @birthday, @mName, @mAddress);"
      );
  }

  async updateMemberByEmail(
    mId: string,
    name: string,
    address: string,
    birthday: string
  ) {
    const pool = await this.getPool();
    return pool
      .request()
      .input("mId", sql.VarChar, mId)
      .input("birthday", sql.Date, birthday)
      .input("mAddress", sql.VarChar, address)
      .input("mName", sql.VarChar, name)
      .query(
        `UPDATE Member SET mName = @mName, mAddress = @mAddress, birthday = @birthday WHERE mEmail = @mId`
      );
  }

  async updateMemberPasswordByEmail(mId: string, newPassword: string) {
    const pool = await this.getPool();

    return pool
      .request()
      .input("mId", sql.VarChar, mId)
      .input("password", sql.VarChar, newPassword)
      .query(`UPDATE Member SET mPassword = @password WHERE mEmail = @mId`);
  }
}
