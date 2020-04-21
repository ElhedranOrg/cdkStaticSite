import * as Lambda from 'aws-lambda';

export const handler: Lambda.CloudFrontRequestHandler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const url = new URL(request.uri);
    if (url.pathname.indexOf('.') !== -1) {
        url.pathname = 'index.html'
    };
    request.uri = url.toString();
    console.log(`Request uri set to "${request.uri}"`);
    callback(null, request); 
}