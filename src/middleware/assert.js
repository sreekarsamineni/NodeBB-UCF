"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const path = __importStar(require("path"));
const nconf_1 = __importDefault(require("nconf"));
const file_1 = __importDefault(require("../file"));
const user_1 = __importDefault(require("../user"));
const groups_1 = __importDefault(require("../groups"));
const topics_1 = __importDefault(require("../topics"));
const posts_1 = __importDefault(require("../posts"));
const messaging_1 = __importDefault(require("../messaging"));
const flags_1 = __importDefault(require("../flags"));
const slugify_1 = __importDefault(require("../slugify"));
const helpers = __importStar(require("./helpers"));
const controllerHelpers = __importStar(require("../controllers/helpers"));
const Assert = {};
Assert.user = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield user_1.default.exists(req.params.uid))) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-user]]'));
    }
    next();
}));
Assert.group = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const name = yield groups_1.default.getGroupNameByGroupSlug(req.params.slug);
    if (!name || !(yield groups_1.default.exists(name))) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-group]]'));
    }
    next();
}));
Assert.topic = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield topics_1.default.exists(req.params.tid))) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-topic]]'));
    }
    next();
}));
Assert.post = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield posts_1.default.exists(req.params.pid))) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-post]]'));
    }
    next();
}));
Assert.flag = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const canView = yield flags_1.default.canView(req.params.flagId, req.uid);
    if (!canView) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-flag]]'));
    }
    next();
}));
Assert.path = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.path.startsWith('file:///')) {
        req.body.path = new URL(req.body.path).pathname;
    }
    if (req.body.path.startsWith(nconf_1.default.get('upload_url'))) {
        req.body.path = req.body.path.slice(nconf_1.default.get('upload_url').length);
    }
    const pathToFile = path.join(nconf_1.default.get('upload_path'), req.body.path);
    res.locals.cleanedPath = pathToFile;
    if (!pathToFile.startsWith(nconf_1.default.get('upload_path'))) {
        return controllerHelpers.formatApiResponse(403, res, new Error('[[error:invalid-path]]'));
    }
    if (!(yield file_1.default.exists(pathToFile))) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:invalid-path]]'));
    }
    next();
}));
Assert.folderName = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const folderName = (0, slugify_1.default)(path.basename(req.body.folderName.trim()));
    const folderPath = path.join(res.locals.cleanedPath, folderName);
    if (!folderName) {
        return controllerHelpers.formatApiResponse(403, res, new Error('[[error:invalid-path]]'));
    }
    if (yield file_1.default.exists(folderPath)) {
        return controllerHelpers.formatApiResponse(403, res, new Error('[[error:folder-exists]]'));
    }
    res.locals.folderPath = folderPath;
    next();
}));
Assert.room = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isFinite(parseInt(req.params.roomId))) {
        return controllerHelpers.formatApiResponse(400, res, new Error('[[error:invalid-data]]'));
    }
    const [exists, inRoom] = yield Promise.all([
        messaging_1.default.roomExists(req.params.roomId),
        messaging_1.default.isUserInRoom(req.uid, req.params.roomId),
    ]);
    if (!exists) {
        return controllerHelpers.formatApiResponse(404, res, new Error('[[error:chat-room-does-not-exist]]'));
    }
    if (!inRoom) {
        return controllerHelpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }
    next();
}));
Assert.message = helpers.try((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isFinite(parseInt(req.params.mid)) ||
        !(yield messaging_1.default.messageExists(req.params.mid)) ||
        !(yield messaging_1.default.canViewMessage(req.params.mid, req.params.roomId, req.uid))) {
        return controllerHelpers.formatApiResponse(400, res, new Error('[[error:invalid-mid]]'));
    }
    next();
}));
module.exports = Assert;
// import * as path from 'path';
// import * as nconf from 'nconf';
// import { NextFunction } from 'express';
// import * as file from '../file';
// import * as user from '../user';
// import * as groups from '../groups';
// import * as topics from '../topics';
// import * as posts from '../posts';
// import * as messaging from '../messaging';
// import * as flags from '../flags';
// import * as slugify from '../slugify';
// import * as helpers from './helpers';
// import * as controllerHelpers from '../controllers/helpers';
// interface CustomRequest {
//     params: { [key: string]: string };
//     body: CustomRequestBody;
//     uid?: string;
// }
// interface CustomRequestBody {
//     folderName?: string;
//     path?: string;
// }
// interface CustomResponse {
//     locals: {
//         cleanedPath?: string;
//         folderPath?: string;
//     };
//     status: (status: number) => CustomResponse;
//     json: (body: string) => void;
// }
// // type NextFunction = (error?: unknown) => void;
// const Assert = {
//     user: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         if (!await user.exists(req.params.uid)) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-user]]'));
//         }
//         next();
//     }),
//     group: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         const name = await groups.getGroupNameByGroupSlug(req.params.slug) as string | null;
//         if (!name || !await groups.exists(name)) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-group]]'));
//         }
//         next();
//     }),
//     topic: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         if (!await topics.exists(req.params.tid)) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-topic]]'));
//         }
//         next();
//     }),
//     post: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         if (!await posts.exists(req.params.pid)) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-post]]'));
//         }
//         next();
//     }),
//     flag: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         const canView = await flags.canView(req.params.flagId, req.uid) as boolean;
//         if (!canView) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:no-flag]]'));
//         }
//         next();
//     }),
//     path: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         let filePath = req.body.path;
//         // file: URL support
//         if (filePath.startsWith('file:///')) {
//             filePath = new URL(filePath).pathname;
//         }
//         const uploadUrl = nconf.get('upload_url') as string;
//         if (filePath.startsWith(uploadUrl)) {
//             filePath = filePath.slice(uploadUrl.length);
//         }
//         const uploadPath = nconf.get('upload_path') as string;
//         const pathToFile = path.join(uploadPath, filePath);
//         res.locals.cleanedPath = pathToFile;
//         if (!pathToFile.startsWith(uploadPath)) {
//             return controllerHelpers.formatApiResponse(403, res, new Error('[[error:invalid-path]]'));
//         }
//         if (!await file.exists(pathToFile)) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:invalid-path]]'));
//         }
//         next();
//     }),
//     folderName: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         const { body } = req;
//         const folderName = slugify(path.basename(body.folderName?.trim() ?? '')) as string;
//         if (!folderName) {
//             return controllerHelpers.formatApiResponse(403, res, new Error('[[error:invalid-path]]'));
//         }
//         if (!res.locals.cleanedPath) {
//             return controllerHelpers.formatApiResponse(500, res, new Error('Server configuration error'));
//         }
//         const folderPath = path.join(res.locals.cleanedPath, folderName);
//         if (await file.exists(folderPath)) {
//             return controllerHelpers.formatApiResponse(403, res, new Error('[[error:folder-exists]]'));
//         }
//         res.locals.folderPath = folderPath;
//         next();
//     }),
//     room: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         const roomId = parseInt(req.params.roomId, 10);
//         if (!isFinite(roomId)) {
//             return controllerHelpers.formatApiResponse(400, res, new Error('[[error:invalid-data]]'));
//         }
//         const roomExistsFunction = messaging.roomExists as unknown as (roomId: number) => Promise<boolean>;
//         const isUserInRoomFunction: (uid: string, roomId: number) => Promise<boolean> =
//             messaging.isUserInRoom as unknown as (uid: string, roomId: number) => Promise<boolean>;
//         const [exists, inRoom] = await Promise.all([
//             roomExistsFunction(roomId),
//             isUserInRoomFunction(req.uid, roomId),
//         ]);
//         if (!exists) {
//             return controllerHelpers.formatApiResponse(404, res, new Error('[[error:chat-room-does-not-exist]]'));
//         }
//         if (!inRoom) {
//             return controllerHelpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
//         }
//         next();
//     }),
//     message: helpers.try(async (req: CustomRequest, res: CustomResponse, next: NextFunction) => {
//         const messageId = parseInt(req.params.mid, 10);
//         if (!isFinite(messageId) ||
//             !(await messaging.messageExists(messageId)) ||
//             !(await messaging.canViewMessage(messageId, req.params.roomId, req.uid))) {
//             return controllerHelpers.formatApiResponse(400, res, new Error('[[error:invalid-mid]]'));
//         }
//         next();
//     }),
// };
// export = Assert;
