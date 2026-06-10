import UserDataStorageFactory from "../core/domain/UserDataStorageFactory";
import webStorageFactory from "../web/storage/UserDataLocalStorageFactory";

// Platform swap point: the single place binding the UserDataStorageFactory interface to
// a concrete implementation. Web-only for now; when a mobile build exists, swap this
// import for the mobile factory (e.g. a `.native.ts` file or a build-time `@platform`
// alias) — no other code changes.
const storageFactory: UserDataStorageFactory = webStorageFactory;
export default storageFactory;
