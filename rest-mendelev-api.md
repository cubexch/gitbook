The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/md/v0`.

Definitions for requests and responses can be found in the [Market Data OpenAPI Document](generated/core/md_api_30.json).

Further specifics for field enums, reject codes, etc. can be found in the [Market Data API Websocket Documentation](generated/ws-api/websocket-market-data-api.md).

## Endpoints, public

Endpoints in this section do not require authentication.

{% swagger src="generated/core/md_api_30.json" path="/book/{market_id}/snapshot" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}

{% swagger src="generated/core/md_api_30.json" path="/book/{market_id}/recent-trades" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}

{% swagger src="generated/core/md_api_30.json" path="/tickers/snapshot" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}

{% swagger src="generated/core/md_api_30.json" path="/parsed/tickers" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}

{% swagger src="generated/core/md_api_30.json" path="/parsed/book/{market_symbol}/snapshot" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}

{% swagger src="generated/core/md_api_30.json" path="/parsed/book/{market_symbol}/recent-trades" method="get" %}
[md_api_30.json](generated/core/md_api_30.json)
{% endswagger %}
