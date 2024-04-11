# REST: Market & User API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/ir/v0`.

[OpenAPI document for Market & User API](generated/core/ir_api_30.json)

## Endpoints, public

{% swagger src="generated/core/ir_api_30.json" path="/markets" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

## Endpoints, authentication required

Endpoints in this section require [REST Authentication headers](README.md#rest-authentication-headers).

{% swagger src="generated/core/ir_api_30.json" path="/users/check" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/info" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/positions" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/transfers" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/deposits" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/withdrawals" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/orders" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/fills" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccounts" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/users/subaccounts/{subaccount_id}" method="post" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}
