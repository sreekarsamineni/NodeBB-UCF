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
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const meta = __importStar(require("../../meta"));
const plugins = __importStar(require("../../plugins"));
const middleware = __importStar(require("../../middleware"));
const writeControllers = __importStar(require("../../controllers/write"));
const helpers = __importStar(require("../../controllers/helpers"));
const Write = {
    reload: (params) => __awaiter(void 0, void 0, void 0, function* () {
        const { router } = params;
        let apiSettings = yield meta.settings.get('core.api');
        plugins.hooks.register('core', {
            hook: 'action:settings.set',
            method: (data) => __awaiter(void 0, void 0, void 0, function* () {
                if (data.plugin === 'core.api') {
                    apiSettings = yield meta.settings.get('core.api');
                }
            }),
        });
        router.use('/api/v3', (req, res, next) => {
            // Require https if configured so
            if (apiSettings.requireHttps === 'on' && req.protocol !== 'https') {
                res.set('Upgrade', 'TLS/1.0, HTTP/1.1');
                helpers.formatApiResponse(426, res);
                return;
            }
            res.locals.isAPI = true;
            next();
        });
        router.use('/api/v3/users', require('./users')());
        router.use('/api/v3/groups', require('./groups')());
        router.use('/api/v3/categories', require('./categories')());
        router.use('/api/v3/topics', require('./topics')());
        router.use('/api/v3/posts', require('./posts')());
        router.use('/api/v3/chats', require('./chats')());
        router.use('/api/v3/flags', require('./flags')());
        router.use('/api/v3/admin', require('./admin')());
        router.use('/api/v3/files', require('./files')());
        router.use('/api/v3/utilities', require('./utilities')());
        router.get('/api/v3/ping', writeControllers.utilities.ping.get);
        router.post('/api/v3/ping', middleware.authenticateRequest, middleware.ensureLoggedIn, writeControllers.utilities.ping.post);
        /**
         * Plugins can add routes to the Write API by attaching a listener to the
         * below hook. The hooks added to the passed-in router will be mounted to
         * `/api/v3/plugins`.
         */
        const pluginRouter = require('express').Router();
        yield plugins.hooks.fire('static:api.routes', {
            router: pluginRouter,
            middleware,
            helpers,
        });
        winston_1.default.info(`[api] Adding ${pluginRouter.stack.length} route(s) to \`api/v3/plugins\``);
        router.use('/api/v3/plugins', pluginRouter);
        // 404 handling
        router.use('/api/v3', (req, res) => {
            helpers.formatApiResponse(404, res);
        });
    }),
    cleanup: (req) => {
        if (req && req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
            });
        }
    },
};
exports.default = Write;
