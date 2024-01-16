# REST: Market Data API

The base URL for endpoints described in this page of live trading API is `https://api.cube.exchange/md/v0`.

## Endpoints, public

{% swagger src=".gitbook/assets/md_api_30.json" path="/book/{market_id}/snapshot" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/book/{market_id}/recent-trades" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/tickers/snapshot" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/cgk/tickers" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}

{% swagger src=".gitbook/assets/md_api_30.json" path="/cgk/orderbook" method="get" %}
[md_api_30.json](.gitbook/assets/md_api_30.json)
{% endswagger %}
