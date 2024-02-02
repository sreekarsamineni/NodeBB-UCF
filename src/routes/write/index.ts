import { Router, Request, Response, NextFunction } from 'express';
import winston from 'winston';
import * as meta from '../../meta';
import * as plugins from '../../plugins';
import * as middleware from '../../middleware';
import * as writeControllers from '../../controllers/write';
import * as helpers from '../../controllers/helpers';

interface ApiSettings {
    requireHttps: string;
}

interface Params {
    router: Router;
}

const Write = {
    reload: async (params: Params): Promise<void> => {
        const { router } = params;
        let apiSettings: ApiSettings = await meta.settings.get('core.api');

        plugins.hooks.register('core', {
            hook: 'action:settings.set',
            method: async (data: { plugin: string }): Promise<void> => {
                if (data.plugin === 'core.api') {
                    apiSettings = await meta.settings.get('core.api');
                }
            },
        });

        router.use('/api/v3', (req: Request, res: Response, next: NextFunction): void => {
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
        const pluginRouter: Router = require('express').Router();
        await plugins.hooks.fire('static:api.routes', {
            router: pluginRouter,
            middleware,
            helpers,
        });
        winston.info(`[api] Adding ${pluginRouter.stack.length} route(s) to \`api/v3/plugins\``);
        router.use('/api/v3/plugins', pluginRouter);

        // 404 handling
        router.use('/api/v3', (req: Request, res: Response): void => {
            helpers.formatApiResponse(404, res);
        });
    },

    cleanup: (req?: Request): void => {
        if (req && req.session) {
            req.session.destroy((err: any): void => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
            });
        }
    },
};

export default Write;
