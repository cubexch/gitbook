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

## Endpoints, public

{% swagger src="generated/core/ir_api_30.json" path="/markets" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

{% swagger src="generated/core/ir_api_30.json" path="/history/klines" method="get" %}
[ir_api_30.json](generated/core/ir_api_30.json)
{% endswagger %}

## Endpoints, authentication required

Endpoints in this section require [REST Authentication headers](README.md#rest-authentication-headers).

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
