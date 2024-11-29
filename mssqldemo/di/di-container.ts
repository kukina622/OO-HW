import { Container } from "inversify";
import MemberModel from "../model/member.model";
import getDecorators from "inversify-inject-decorators";
import ProductModel from "../model/product.model";

const IOCContainer = new Container();

IOCContainer.bind<MemberModel>("MemberModel").to(MemberModel);
IOCContainer.bind<ProductModel>("ProductModel").to(ProductModel);

export default IOCContainer;

export const { lazyInject } = getDecorators(IOCContainer);
