#!/usr/bin/env node
import 'source-map-support/register';
import * as Core from '@aws-cdk/core';
import { StaticSite } from './StaticSite';

const defaultEnvTag = process.env.ENVIRONMENT

const app = new Core.App({
    context: defaultEnvTag
    ? {
        envTag: defaultEnvTag
    }
    : undefined
});

const siteName = `sample${app.node.tryGetContext('envTag')}`;

class MainStack extends Core.Stack {
    constructor(scope: Core.Construct, id: string, props?: Core.StackProps) {
        super(scope, id, props);

        new StaticSite(this, 'site', {
            zoneDomain: 'elhedran.com',
            siteDomain: 'sample.elhedran.com',
            siteName
        });
    }
}

new MainStack(app, 'sample-stack', {
    env: {
        account: '057191276549',
        region: 'us-east-1'
    }
});