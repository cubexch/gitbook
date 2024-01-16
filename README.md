# Cube Exchange API

Cube Exchange offers a comprehensive REST API and a robust streaming WebSocket API. These APIs allow users to access market data and execute trades in real-time.

## Environments and Base URLs

We offer both a live trading environment and a staging trading environment. The base URLs for the web front-end and API for each environment are as follows:

- Live trading:
    - Web front-end: https://cube.exchange
    - API: https://api.cube.exchange
- Staging trading:
    - Web front-end: https://dev.cube.exchange
    - API: https://staging.cube.exchange

## REST Authentication Headers

The REST API uses the following HTTP headers for authentication:

* `x-api-key`:\
  The API Key ID, as specified on the [API settings page](https://cube.exchange/settings/api).
    * Each API key has an associated access level, which is determined at the time of key creation.
        * Read access allows only read HTTP methods (GET, HEAD, etc.).
        * Write access permits all HTTP methods.
* `x-api-signature`:\
  The API signature string authenticating this request.
    * The payload to be signed is a concatenation of the byte string `cube.xyz` and the current Unix epoch timestamp in seconds, converted into an 8-byte little-endian array. The signature is the HMAC-SHA256 digest of the payload, using the secret key associated with the specified API key.
    * Implementation notes:
        * The signature is base-64 encoded with the 'standard' alphabet and padding: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`.
        * The timestamp should be encoded as an 8-byte little-endian array of bytes.
        * The secret key should be decoded from a hex string into a 32-byte array of bytes.
* `x-api-timestamp`:\
  The timestamp used for signature generation.

# WebSocket Ancillary Resources

The `.proto` definition files and example client code for the WebSocket API are available [on Github](https://github.com/cubexch/ws-api).
