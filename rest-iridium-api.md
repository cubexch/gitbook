The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/ir/v0`.

[OpenAPI document for Market & User API](generated/core/ir_api_30.json)

## Market Definitions

Definitions are [available as JSON](https://api.cube.exchange/ir/v0/markets)
and provide all of the information needed to convert between on-chain amounts
and the values used on the exchange.  For further details, see the [Trade Api](trade-api.md).

### Market Status Field

Some trading pairs appear in multiple markets,
but only a single market will be in use
for a given trading pair at any given time.

Definitions appear for markets that are no longer in use; these can be used to interpret historical orders.

- Markets that are currently active for trading will have a `status` of `1` or `2`.
- Markets that are no longer in use will have a `status` of `3`.

## Authentication Headers

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

## Endpoints, public

{% swagger src="generated/core/ir_api_30.json" path="/markets" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/history/klines" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

## Endpoints, authentication required

Endpoints in this section require [REST Authentication
headers](#authentication-headers).

{% swagger src="generated/core/ir_api_30.json" path="/users/check" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/apikeys" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/apikeys/{api_key}" method="delete" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccounts" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccounts" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}" method="patch" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/positions" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/transfers" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/deposits" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/withdrawals" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/orders" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccount/{subaccount_id}/fills" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/fee-estimates" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/address" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/address/settings" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/withdraw" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}
