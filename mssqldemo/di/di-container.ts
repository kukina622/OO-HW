import { Container } from "inversify";
import MemberModel from "../model/member.model";
import getDecorators from "inversify-inject-decorators";
import ProductModel from "../model/product.model";
import OrderModel from "../model/order.model";
import CartModel from "../model/cart.model";

const IOCContainer = new Container();

IOCContainer.bind<MemberModel>("MemberModel").to(MemberModel);
IOCContainer.bind<ProductModel>("ProductModel").to(ProductModel);
IOCContainer.bind<OrderModel>("OrderModel").to(OrderModel);
IOCContainer.bind<CartModel>("CartModel").to(CartModel);

export default IOCContainer;

export const { lazyInject } = getDecorators(IOCContainer);
