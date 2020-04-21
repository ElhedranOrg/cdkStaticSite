# CDK Static Site Module

This is a CDK package for creating a static AWS websites based on the
preferences of the package's creator

Its doesn't add features, just opinions.  It is shared as an example of how
common usage of AWS CDK resources might be encoded into a CDK package.

The preferences implemented in this package are:

* S3 Content bucket is private and behind a CloudFront distribution
* The static site is expected to have a specified domain name for which a
  certificate will be created.
* The site will be hosting a SPA application such that paths that do not contain
  a `.` character will serve the contents of `index.html`. i.e. if it doesn't
  look like a request for a file, serve `index.html` under the assumption that
  the path is for front end routing.
* Both IPV4 and IPV6 routes will be created.

# Usage

It is intended for this module to be pulled in as an NPM package.

# Building

This build uses GNUMake and NPM in order to build the required resource.

```bash
# Building
make build
# Deploy sample environment
make deploy
# Packaging
make package
```