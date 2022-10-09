# 線上點餐系統

* [系統使用說明](https://youtu.be/lZyRW3SYav4)

## 簡介

將餐廳的服務擴展到線上，提供使用者線上點餐，同時也提供餐廳業者後台管理的功能。

## 系統功能說明

1. 使用者可以瀏覽並搜尋餐廳
2. 使用者可以在線上進行點餐，並追蹤訂單進度
3. 使用者可以查看歷史訂單，也可修改會員資料
4. 餐廳業者可線上接單
5. 餐廳業者可管理菜單和營業狀態

## 資料需求說明

會員挑選餐廳，瀏覽餐廳菜單，把餐點放入購物車，最後結帳，產生訂單。總共需要了五個實體，下方將詳細介紹:
1.	會員 Member
    * mEmail
        * 會員電子郵件，會員唯一識別號
    * mPassword
        * 會員登入密碼
    * birthday
        * 會員生日
    * mRegion
        * 會員居住地區
    * mName
        * 會員名稱

2.	餐廳 Restaurant
    * rId
        * 餐廳編號，餐廳唯一識別號
    * rName
        * 餐廳名稱
    * rRegion
        * 餐廳所在地區
    * phone
        * 連絡電話
    * email
        * 餐廳電子郵件，同時作為登入帳號
    * password
        * 餐廳業者登入密碼
    * address
        * 餐廳地址，以縣市劃分
    * rIsAvailable
        * 餐廳營業狀態，有營業中（1）、未營業（0）、停止營業（-1）

3.	訂單 Order
    * oId
        * 訂單編號，訂單唯一識別號
    * oDate
        * 訂單產生日期
    * total
        * 總價
    * done
        * 完成與否
    * mId
        * 下單會員，參考Member的mEmail
    * rId
        * 訂單所屬餐廳，參考Restaurant的rId

4. 餐點 Product
    * pId	
        * 餐點編號，餐點唯一識別號
    * pCount
        * 餐點剩餘數量，分為已刪除（-2）、隱藏（-1）、 缺貨(0）、有貨（>0）
    * unitPrice
        * 單價
    * pName
        * 餐點名稱
    * rId
        * 餐點所屬餐廳，參考Restaurant的rId

    5.	購物車 Cart
    * mId
        * 購物車所屬會員，參考Membe的mEmail
    * cTime
        * 購物車產生時間
    * count
        * 購買數量
    * unitPrice
        * 商品單價
    * price
        * 購物車小計（單價*數量）
    * oId
        * 購物車所屬訂單，參考Order的oId（若購物車未完成結帳，此屬性為NULL）
    * pId
        * 購物車對應的餐點，參考 Product的pId

## 實體關係圖

<img src=".\result_pic\ER.jpeg"/>

說明: 
* 一位會員(Member)可下多筆訂單(Order)，一筆訂單只能且一定屬於一位會員。
* 一筆訂單可含有多個購物車(Cart)，一個購物車在結帳前不屬於任何訂單，結帳後屬於一筆訂單。一筆訂單只能且一定對應一家餐廳。
* 一個購物車只能且一定有一個餐點(Product)，一個餐點可屬於多個購物車。
* 一家餐廳(Restaurant)可提供多個餐點，一個餐點只能且一定屬於一家餐廳。

## 關聯綱目

<img src=".\result_pic\RS.jpeg"/>

## 資料庫圖表

<img src=".\result_pic\table_graph.jpeg"/>

