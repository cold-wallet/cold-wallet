import StorageFactory from "../core/domain/StorageFactory";
import webStorageFactory from "../web/storage/LocalStorageFactory";

// Platform swap point: the single place binding the StorageFactory interface to a
// concrete implementation. Web-only for now; when a mobile build exists, swap this
// import for the mobile factory (e.g. a `.native.ts` file or a build-time `@platform`
// alias) — no other code changes.
const storageFactory: StorageFactory = webStorageFactory;
export default storageFactory;
