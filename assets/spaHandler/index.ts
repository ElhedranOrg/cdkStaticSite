import * as Lambda from 'aws-lambda';

export const handler: Lambda.CloudFrontRequestHandler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    if (request.uri.indexOf('.') === -1) {
        console.log(`Changing request path from "${request.uri}" to "/index.html"`);
        request.uri = '/index.html'
    }
    callback(null, request);
}