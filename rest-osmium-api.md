# REST: Trade API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/os/v0`.

[OpenAPI document for Trade API](.gitbook/assets/os_api_30.json)

## Endpoints, require authentication

Endpoints in this section require [REST Authentication headers](README.md#rest-authentication-headers).

{% swagger src=".gitbook/assets/os_api_30.json" path="/orders" method="get" %}
[os_api_30.json](.gitbook/assets/os_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/os_api_30.json" path="/orders" method="delete" %}
[os_api_30.json](.gitbook/assets/os_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/os_api_30.json" path="/order" method="post" %}
[os_api_30.json](.gitbook/assets/os_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/os_api_30.json" path="/order" method="delete" %}
[os_api_30.json](.gitbook/assets/os_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/os_api_30.json" path="/order" method="patch" %}
[os_api_30.json](.gitbook/assets/os_api_30.json)
{% endswagger %}
