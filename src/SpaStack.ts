import * as Core from '@aws-cdk/core';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import * as IAM from '@aws-cdk/aws-iam';
import * as SSM from '@aws-cdk/aws-ssm';

export interface SpaStackProps extends Core.StackProps {
    siteName?: string;
    outputName?: string;
}

export class SpaStack extends Core.Stack {
    readonly versionTag = 'v1';

    constructor(scope: Core.Construct, id: string, props?: SpaStackProps) {
        super(scope, id, props);

        const siteName = props?.siteName || 'staticsite';
        const parameterName = props?.outputName || `${siteName}-spaEdgeArn`;

        const spaCode = Lambda.Code.fromAsset(path.resolve(
            __dirname,
            'assets',
            'spaHandler'
        ));

        const spaEdge = new Lambda.Function(this, 'spaHandler', {
            functionName: `${siteName}-spaEdge`,
            runtime: Lambda.Runtime.NODEJS_12_X,
            handler: 'index.handler',
            code: spaCode,
            role: new IAM.Role(this, 'spaHandlerRole', {
                assumedBy: new IAM.CompositePrincipal(
                    new IAM.ServicePrincipal('lambda.amazonaws.com'),
                    new IAM.ServicePrincipal('edgelambda.amazonaws.com'),
                ),
            }),
        });

        const spaEdgeVersion = new Lambda.Version(this, this.versionTag, {
            lambda: spaEdge
        });
        spaEdgeVersion.addAlias('live');

        new SSM.StringParameter(this, "ssm-value", {
            parameterName,
            stringValue: `${spaEdge.functionArn}:${spaEdgeVersion.version}`
          });
    }
}