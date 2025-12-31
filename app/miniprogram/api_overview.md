# 智能社区平台小程序后端API功能总览

## 1. 用户认证与管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/send-sms-code` | POST | 发送手机验证码 | 登录页 (pages/login/login.ts) |
| `/sms-login` | POST | 手机验证码登录 | 登录页 (pages/login/login.ts) |
| `/verify-code` | POST | 验证注册验证码 | 登录页 (pages/login/login.ts) |
| `/wechat-login` | POST | 微信授权登录 | 登录页 (pages/login/login.ts) |
| `/users/profile` | GET | 获取用户信息 | 多个页面 |
| `/users/profile` | PUT | 更新用户信息 | 个人资料编辑页 (pages/profile/edit/edit.ts) |

## 2. 社区信息管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/property/community/info` | GET | 获取社区基本信息 | 身份码页 (pages/qrcode/qrcode.ts) |

## 3. 首页功能模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/property/announcements` | GET | 获取社区通知公告 | 首页 (pages/index/index.ts) |
| `/system/config` | GET | 获取系统配置(如客服电话) | 首页 (pages/index/index.ts) |
| `/property/community/weather` | GET | 获取社区天气信息 | 首页 (pages/index/index.ts) |

## 4. 服务功能模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `http://139.224.17.154:8000/api/merchant/profiles/` | GET | 获取商户列表(街角好店) | 服务页 (pages/services/services.ts) |
| `/property/announcements` | GET | 获取物业公告列表 | 公告页 (pages/services/announcements/announcements.ts) |
| `/property/announcements/{id}` | GET | 获取公告详情 | 公告详情页 (pages/services/announcement-detail/announcement-detail.ts) |
| `/property/housekeeping/` | GET | 获取家政服务列表 | 家政服务页 (pages/services/housekeeping/housekeeping.ts) |
| `/property/housekeeping/order` | POST | 提交家政服务订单 | 家政服务页 (pages/services/housekeeping/housekeeping.ts) |
| `/property/visitor/` | POST | 生成访客码 | 访客管理页 (pages/services/visitor/visitor.ts) |
| `/property/visitor/list` | GET | 获取访客记录 | 访客管理页 (pages/services/visitor/visitor.ts) |

## 5. 物业功能模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/property/bills` | GET | 获取物业账单 | 缴费页 (pages/payment/payment.ts) |
| `/property/bills/{id}/pay` | POST | 支付物业账单 | 缴费页 (pages/payment/payment.ts) |
| `/property/bills/{id}/receipt` | GET | 获取账单收据 | 收据页 (pages/payment/receipt.ts) |
| `/property/repair/` | GET | 获取报修记录 | 报修进度页 (pages/repair-progress/repair-progress.ts) |
| `/property/repair/` | POST | 提交报修申请 | 报修页 (pages/repair/repair.ts) |
| `/property/repair/{id}` | GET | 获取报修详情 | 报修进度页 (pages/repair-progress/repair-progress.ts) |
| `/property/repair/{id}/update` | PUT | 更新报修状态 | 报修页 (pages/repair/repair.ts) |

## 6. 房屋管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/property/house/my-houses` | GET | 获取用户绑定房屋 | 身份码页 (pages/qrcode/qrcode.ts)、房屋信息页 (pages/house/info/info.ts) |
| `/property/house/bind` | POST | 绑定房屋 | 房屋绑定页 (pages/house/binding/binding.ts) |
| `/property/house/verify` | POST | 验证房屋信息 | 房屋绑定页 (pages/house/binding/binding.ts) |
| `/property/house/list` | GET | 获取可绑定房屋列表 | 房屋绑定页 (pages/house/binding/binding.ts) |

## 7. 社区互动模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/market-items/` | GET | 获取二手市场物品列表 | 社区页 (pages/community/community.ts) |
| `/market-items/{id}` | GET | 获取二手物品详情 | 市场详情页 (pages/community/market-detail/market-detail.ts) |
| `/market-items/` | POST | 发布二手物品 | 社区页 (pages/community/community.ts) |
| `/market-items/{id}/update` | PUT | 更新二手物品 | 市场详情页 (pages/community/market-detail/market-detail.ts) |
| `/help-posts/` | GET | 获取求助帖列表 | 社区页 (pages/community/community.ts) |
| `/help-posts/{id}` | GET | 获取求助帖详情 | 求助详情页 (pages/community/help-detail/help-detail.ts) |
| `/help-posts/` | POST | 发布求助帖 | 求助发布页 (pages/community/help-publish/help-publish.ts) |
| `/activities/` | GET | 获取社区活动列表 | 社区页 (pages/community/community.ts) |
| `/activities/{id}` | GET | 获取活动详情 | 活动详情页 (pages/community/event-detail/event-detail.ts) |
| `/activities/{id}/register` | POST | 报名社区活动 | 活动详情页 (pages/community/event-detail/event-detail.ts) |
| `/activities/{id}/unregister` | POST | 取消活动报名 | 活动详情页 (pages/community/event-detail/event-detail.ts) |

## 8. 停车场管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/parking/info` | GET | 获取停车场信息 | 停车信息页 (pages/parking/info/info.ts) |
| `/parking/bind` | POST | 绑定车辆信息 | 车辆绑定页 (pages/parking/binding/binding.ts) |
| `/parking/verify` | POST | 验证车辆信息 | 车辆绑定页 (pages/parking/binding/binding.ts) |
| `/parking/fee` | GET | 获取停车费用 | 停车首页 (pages/parking/index/index.ts) |

## 9. 商户市场模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/merchant/categories/` | GET | 获取商户分类 | 市场页 (pages/market/market.ts) |
| `/merchant/products/` | GET | 获取商品列表 | 市场页 (pages/market/market.ts) |
| `/merchant/profiles/` | GET | 获取商户列表 | 市场页 (pages/market/market.ts) |
| `/merchant/products/{id}` | GET | 获取商品详情 | 商品详情页 (pages/shop/product/product.ts) |
| `/merchant/profiles/{id}` | GET | 获取商户详情 | 商户详情页 (pages/shop/detail/detail.ts) |

## 10. 消息管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/messages/chat` | GET | 获取聊天记录 | 聊天页 (pages/message/chat/chat.ts) |
| `/messages/send` | POST | 发送消息 | 聊天页 (pages/message/chat/chat.ts) |

## 11. 优惠券管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/coupons/market/` | GET | 获取优惠券市场 | 优惠券市场页 (pages/coupon/market/market.ts) |
| `/coupons/user/` | GET | 获取用户优惠券 | 我的优惠券页 (pages/coupon/list/list.ts) |
| `/coupons/{id}/claim` | POST | 领取优惠券 | 优惠券市场页 (pages/coupon/market/market.ts) |

## 12. 订单管理模块

| API端点 | 请求方法 | 功能描述 | 对应页面 |
|---------|---------|---------|---------|
| `/orders/` | GET | 获取用户订单列表 | 订单页 (pages/profile/orders/orders.ts) |
| `/orders/{id}` | GET | 获取订单详情 | 订单页 (pages/profile/orders/orders.ts) |
| `/orders/` | POST | 创建订单 | 订单创建页 (pages/order/create/create.ts) |
| `/orders/{id}/cancel` | POST | 取消订单 | 订单页 (pages/profile/orders/orders.ts) |

## 注意事项

1. **API调用方式**：所有API调用均采用页面内直接硬编码API地址的方式，未使用统一配置文件。
2. **身份验证**：大多数API需要在请求头中携带`Authorization: Bearer {token}`进行身份验证。
3. **错误处理**：小程序端已实现API请求失败的错误处理，部分页面提供了备用数据或降级方案。
4. **微信小程序限制**：API请求域名需要在微信小程序开发者后台配置白名单，否则会出现`url not in domain list`错误。开发环境可通过勾选"不校验合法域名"解决。

---

**更新时间**：2025-12-23
**文档说明**：本API总览基于小程序端实际调用的后端接口整理，涵盖了所有主要功能模块。