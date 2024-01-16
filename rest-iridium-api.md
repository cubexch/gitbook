# REST: Market & User API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/ir/v0`.

## Endpoints, public

{% swagger src=".gitbook/assets/ir_api_30.json" path="/markets" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

## Endpoints, require authentication

Endpoints in this section require [REST Authentication headers](README.md#rest-authentication-headers).

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/check" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/info" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/positions" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/transfers" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/deposits" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/withdrawals" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/orders" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/fills" method="get" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/subaccounts" method="post" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/ir_api_30.json" path="/users/subaccounts/{subaccount_id}" method="post" %}
[ir_api_30.json](.gitbook/assets/ir_api_30.json)
{% endswagger %}
