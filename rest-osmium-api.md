# REST: Trade API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/os/v0`.

Definitions for requests and responses can be found in the [Trade OpenAPI Document](generated/core/os_api_30.json).

Further specifics for field enums, reject codes, etc. can be found in the [Trade API Websocket Documentation](generated/ws-api/websocket-trade-api.md).

## Endpoints, authentication required

Endpoints in this section require [REST Authentication
headers](README.md#rest-authentication-headers). Note that only API keys with
access-level `WRITE` are able to access _any_ of these endpoints.

{% swagger src="generated/core/os_api_30.json" path="/orders" method="get" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}

{% swagger src="generated/core/os_api_30.json" path="/orders" method="delete" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}

{% swagger src="generated/core/os_api_30.json" path="/order" method="post" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}

{% swagger src="generated/core/os_api_30.json" path="/order" method="delete" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}

{% swagger src="generated/core/os_api_30.json" path="/order" method="patch" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}

{% swagger src="generated/core/os_api_30.json" path="/positions" method="get" %}
[os_api_30.json](generated/core/os_api_30.json)
{% endswagger %}
