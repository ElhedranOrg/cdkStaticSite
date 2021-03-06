import * as Core from '@aws-cdk/core';
import * as S3 from '@aws-cdk/aws-s3';
import * as S3Deployment from '@aws-cdk/aws-s3-deployment';
import * as CloudFront from '@aws-cdk/aws-cloudfront';
import * as Route53 from '@aws-cdk/aws-route53';
import * as Route53Targets from '@aws-cdk/aws-route53-targets';
import * as CertManager from '@aws-cdk/aws-certificatemanager';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as IAM from '@aws-cdk/aws-iam';

import * as path from 'path';

import { Stack } from '@aws-cdk/core';

export interface StaticSiteProps {
    /**
     * The domain of the hosted zone to add routes for
     */
    zoneDomain: string,

    /**
     * The domain to register for the site
     */
    siteDomain: string,

    /**
     * The path for assets to deploy as static site contents
     */
    assetPath?: string,

    /**
     * The bucket name to use for site contents
     */
    bucketName?: string,

    /**
     * A prefix for naming resources deployed
     */
    siteName?: string,
    /**
     * If true, cache duration is lengthened to improve site performance.
     * If false, cache duration is shortened to improve iteration of code changes.
     */
    isProduction?: boolean,
}

/**
 * StaticSite deploys the required resources for a static website using;
 * 
 * * A Private S3 Bucket
 * * Lambda edge handler for SPA redirections of non file paths to index.html
 * * routing and certificate validation.
 * 
 * Basically its an opinionated use of existing AWS resources.
 */
export class StaticSite extends Core.Construct {
    constructor(scope: Core.Construct, id: string, props: StaticSiteProps) {
        super(scope, id);

        const siteName = props?.siteName || 'staticsite';
        const assetPath =
            props?.assetPath
            || path.resolve(__dirname, 'assets', 'sampleContent')

        // until https://github.com/aws/aws-cdk/issues/1575 is resolved,
        // easiest just to ensure this is created in us-east-1 so don't have
        // to deal with cross stack issues.
        if (Stack.of(this).region !== 'us-east-1') {
            throw new Error(
                'Currently this must be deployed in a stack in the "us-east-1" region. ' +
                'This is due to constraints around Lambda@Edge.'
            );
        }

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

        const hostedZone = Route53.HostedZone.fromLookup(this, 'zone', {
            domainName: props.zoneDomain
        });

        const cert = new CertManager.DnsValidatedCertificate(this, 'cert', {
            domainName: props.siteDomain,
            region: 'us-east-1',
            hostedZone
        })

        const destinationBucket = new S3.Bucket(this, 'bucket', {
            bucketName: props.bucketName
        });

        const originAccessIdentity = new CloudFront.OriginAccessIdentity(
            this,
            'OriginAccessIdentity',
            {
                comment: `${siteName} static site origin access idenity`
            }
        );

        destinationBucket.grantRead(originAccessIdentity);

        const distribution = new CloudFront.CloudFrontWebDistribution(this, 'distribution', {
            defaultRootObject: 'index.html',
            comment: `${siteName} static site web distribution`,
            viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            aliasConfiguration: {
                acmCertRef: cert.certificateArn,
                names: [props.siteDomain]
            },
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: destinationBucket,
                        originAccessIdentity
                    },
                    behaviors: [
                        {
                            isDefaultBehavior: true,
                            allowedMethods: CloudFront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                            defaultTtl: props.isProduction
                                ? Core.Duration.days(1)
                                : Core.Duration.minutes(1),
                            compress: true,
                            lambdaFunctionAssociations: [
                                {
                                    eventType: CloudFront.LambdaEdgeEventType.ORIGIN_REQUEST,
                                    lambdaFunction: spaEdge.currentVersion,
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        new Route53.ARecord(this, 'alias', {
            zone: hostedZone,
            target: Route53.RecordTarget.fromAlias(
                new Route53Targets.CloudFrontTarget(distribution)
            ),
            recordName: props.siteDomain
        });
        new Route53.AaaaRecord(this, 'ipv6Alias', {
            zone: hostedZone,
            target: Route53.RecordTarget.fromAlias(
                new Route53Targets.CloudFrontTarget(distribution)
            ),
            recordName: props.siteDomain
        });

        new S3Deployment.BucketDeployment(this, 'deploy', {
            destinationBucket,
            distribution,
            sources: [S3Deployment.Source.asset(assetPath)]
        });
    }
}