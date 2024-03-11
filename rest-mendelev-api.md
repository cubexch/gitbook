# REST: Market Data API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/md/v0`.

[OpenAPI document for Market Data API](.gitbook/assets/md_api_30.json)

## Endpoints, public

Endpoints in this section do not require authentication.

{% swagger src=".gitbook/assets/md_api_30.json" path="/book/{market_id}/snapshot" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/book/{market_id}/recent-trades" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/tickers/snapshot" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/parsed/tickers" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/parsed/book/{market_symbol}/snapshot" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/parsed/book/{market_symbol}/recent-trades" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
