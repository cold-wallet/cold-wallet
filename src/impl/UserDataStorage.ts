import UserDataStorageFactory from "../core/domain/UserDataStorageFactory";

const platform: string = process.env.REACT_APP_PLATFORM || "web";

const storageFactoryImpl = require("../" + platform + "/storage/UserDataLocalStorageFactory");

const storageFactory: UserDataStorageFactory = storageFactoryImpl.default;
export default storageFactory;
