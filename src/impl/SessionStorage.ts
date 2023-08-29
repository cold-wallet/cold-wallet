import StorageFactory from "../core/domain/StorageFactory";

const platform: string = process.env.REACT_APP_PLATFORM || "web";

const storageFactoryImpl = require("../" + platform + "/storage/SessionStorageFactory");

const storageFactory: StorageFactory = storageFactoryImpl.default;
export default storageFactory;
