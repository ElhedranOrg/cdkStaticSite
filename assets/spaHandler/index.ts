import * as Lambda from 'aws-lambda';

export const handler: Lambda.CloudFrontRequestHandler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    if (request.uri.indexOf('.') === -1) {
        request.uri = '/index.html'
    }
    console.log(`Request uri set to "${request.uri}"`);
    callback(null, request);
}