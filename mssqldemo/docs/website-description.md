
# Website Description

> `[rId]` 為HTTP GET請求時所需要提供的參數  
> `[q?]` 為Optional參數

## User

| Endpoint         | Description        | Table              | Memo                         |
| ---------------- | ------------------ | ------------------ | ---------------------------- |
| `/`              | 餐廳表格           | Restaurant         |                              |
| `/login`         | 會員登入           | Member, Restaurant | Restaurant為管理員登入所使用 |
| `/logout`        | 會員登出           | n/A                |                              |
| `/register`      | 會員註冊           | Member             | 僅提供一般使用者註冊         |
| `/member`        | 會員資訊、訂單記錄 | Member, Order      | `NOT IMPLEMENTED YET`        |
| `/product/[rId]` | 餐廳菜單           | Product            |                              |
| `/checkout`      | 結帳               | Cart, Order        | `NOT IMPLEMENTED YET`        |

## API Service

| Endpoint                        | Description              | Table         | Memo                                 |
| ------------------------------- | ------------------------ | ------------- | ------------------------------------ |
| `/api/email_validation/[email]` | 檢查Member Email是否存在 | Member        | 使用於`/resigter`                    |
| `/api/switch_region/[r]`        | 切換Member查詢餐廳地區   | Member        | `NOT IMPLEMENTED YET`                |
| `/api/restaurant/[q?]`          | 搜尋餐廳                 | Restaurant    | `q == ''` 時表取得所有區域內餐廳     |
| `/api/product/[rId]/[q?]`       | 搜尋指定餐廳的菜單       | Product       | `q == ''` 時表取得指定餐廳的所有菜單 |
| `/api/cart`                     | 取得會員購物車           | Cart, Product | `mEmail`來自session, 購物車oId為null |
| `/api/cart/add/[pid]/[count]`   | 新增商品至購物車         | Product, Cart | `mEmail`來自session                  |
| `/api/cart/delete/[cTime]`      | 刪除會員購物車指定商品   | Cart          | `mEmail`來自session                  |

## Manager

| Endpoint                        | Description              | Table   | Memo                                    |
| ------------------------------- | ------------------------ | ------- | --------------------------------------- |
| `/manager`                      | 管理員首頁，顯示餐廳菜單 | Product |                                         |
| `/manager/product/add`          | 新增菜單                 | Product | `rId`來自session                        |
| `/manager/product/edit/[pId]`   | 編輯菜單                 | Product | `rId`來自session, `NOT IMPLEMENTED YET` |
| `/manager/product/delete/[pId]` | 刪除菜單                 | Product | `rId`來自session                        |

