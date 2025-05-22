
Search
Introduction
Latest rates
Historical rates
Currency conversion
Forex market
Websocket API
Protocol description
How it works?
Available message codes
Example implementation
Available currencies
Available cryptocurrencies
Sign Up for an API Key
Introduction
Welcome to the xChangeAPI.com documentation

You can use this API to access all our API endpoints.

The API is organized around REST. All requests should be made over SSL.

We also have some specific language bindings to make integration easier. You can switch the programming language of the examples with the tabs in the top right.

Currently we support the following official client bindings: Shell, Go, Python, JavaScript, Node.js, PHP, Java and Ruby.

To play around with a few examples, we recommend a REST client called Postman. Simply tap the button below to import a pre-made collection of examples.

API endpoints
To connect to our API, use the following URLs:

For HTTP connections: https://api.xchangeapi.com/
For WebSocket connections wss://api.xchangeapi.com/
Authentication
We use API keys to allow access to the API. You can register a new account on our website.

Please make sure to include the API key in the api-key header for all requests to our API server.

 Replace your-api-key with your personal API key in all examples used in this documentation.
API Response formats
Responses are delivered as plain-text JSON format. We use a few response formats. They are described individually per specific API endpoint.

Latest rates
It is the most popular route in our API. It provides a list containing all the conversion rates for all of the currently available symbols/currencies.

The latest rates will always be the most up-to-date data available on your plan.

GET /latest
Parameter	Description
base	the currency code of your preferred base currency (see: list of available currencies)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/latest?base=EUR',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "timestamp": 1594404000,
    "base": "EUR",
    "rates": {
        "USD": 1.12897,
        "BGN": 1.96460,
        "ILS": 4.00964,
        "GBP": 0.89632,
        "ETH": 0.00475,
        "DKK": 7.45017,
        "CAD": 1.53669,
        "JPY": 120.49853,
        "HUF": 353.64767,
        "RON": 4.84370,
        "UAH": 31.00377,
        "EUR": 1,
        "SEK": 10.40540,
        "SGD": 1.57176,
        "HKD": 8.75054,
        "AUD": 1.62516,
        "CHF": 1.06318,
        "XAU": 0.62508,
        "CNY": 7.91390,
        "TRY": 7.76031,
        "HRK": 2.00951,
        "NZD": 1.71960,
        "XAG": 6.04685,
        "LTC": 0.02560,
        "NOK": 10.71539,
        "RUB": 80.56847,
        "INR": 85.42634,
        "MXN": 25.72534,
        "CZK": 26.72650,
        "BRL": 6.02954,
        "BTC": 0.00012,
        "PLN": 4.47655,
        "ZAR": 19.12707
    }
}
Historical rates
Get historical exchange rates going back to 1st January 1999.

Similar to the /latest/ API endpoint, /historical/ provides a list containing all the conversion rates for all of the available symbols/currencies.

GET /historical/<date>
Parameter	Description
date	the requested date in YYYY-MM-DD format
base	the currency code of your preferred base currency (see: list of available currencies)
symbols	limit results to specific currencies (a comma-separated list)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/historical/2000-10-10?base=EUR',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "base": "EUR",
    "timestamp": 971136000,
    "rates": {
        "AUD": 1.6385,
        "BGN": 1.9502,
        "CAD": 1.31,
        "CHF": 1.5191,
        "CYP": 0.57241,
        "CZK": 35.54,
        "DKK": 7.4519,
        "EEK": 15.6466,
        "GBP": 0.5992,
        "HKD": 6.8002,
        "HUF": 262.49,
        "ISK": 72.97,
        "JPY": 94.2,
        "KRW": 977.1,
        "LTL": 3.4895,
        "LVL": 0.5392,
        "MTL": 0.3968,
        "NOK": 8.0575,
        "NZD": 2.1605,
        "PLN": 3.984,
        "ROL": 21278.0,
        "SEK": 8.5925,
        "SGD": 1.5266,
        "SIT": 209.6934,
        "SKK": 43.751,
        "TRL": 584867.0,
        "USD": 0.8721,
        "ZAR": 6.4025
    }
}
Currency conversion
This endpoint can be used to convert any amount from one currency to another.

GET /convert?amount=<amount>&from=<from>&to=<to>
Parameter	Description
amount	the amount to be converted.
from	the currency code of the currency you would like to convert from (see: list of available currencies)
to	the currency code of the currency you would like to convert to (see: list of available currencies)
var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/convert?amount=10&from=USD&to=EUR',
  'headers': {
    'api-key': 'your-api-key',
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "info": {
        "timestamp": "1594404000",
        "rate": 0.88567
    },
    "query": {
        "to": "EUR",
        "amount": 10,
        "from": "USD"
    },
    "result": 8.85670
}
Forex market
In this section, we provide methods that deliver live Forex data.

Data formats
For your needs and convenience, the currencies data is available in three formats: JSON, XML and CSV.

JSON
All methods for JSON are available as GET and POST methods. In both cases names and types of parameters are identical. Because JSON is the default format, you can also use the below presented methods without the /json part in each URL (for example, /currencies/all is a shorthand for /json/currencies/all). This is kept for consistency with other formats. When requesting data in this format, set the Content-Type header to application/json.

XML
Methods for XML format are available as POST methods and requires XML-formatted request body. Names of methods and parameters are identical to those in JSON format. When requesting data in XML format, set the Content-Type header to application/xml or text/xml. Here we present the example requests and responses specific to XML format; the details of each method and its parameters can be found in JSON section.

CSV
All methods for CSV format are available as both GET and POST methods. The input parameters are taken in JSON format and the method calls are the same as for the JSON format (JSON), in this case, only the output is CSV-formatted. When requesting API for CSV format, the Content-Type header should be set to application/json. In this section we present available methods and example responses in CSV format; the details of each method and its parameters, as well as example requests can be found in JSON section.

For each method, first row in response is a header row with names of each column and the following rows contain the exchange rates data. For the description of fields go to Data preview and properties.

Data preview and properties
The response data from API can contain various properties. In general there are two structures of responses: the first one is for methods that obtain actual exchange rates and the second for the methods that enables you getting data from the past. Here we give the description for all the properties of response data.

Example response for actual exchange rates looks like this:

{
    "ask": "1.38488",
    "bid": "1.38477",
    "name": "EURUSD",
    "time": "1398420924.000"
}
Data contains the following fields:

name - name of a currency pair
ask - ask price of a related currency pair
bid - bid price of a related currency pair
time - a UNIX timestamp, which indicates the time when the related ask and bid values were calculated
Methods for data from the past (historical data, chart data) will have the following response structure:

{
    "1396267200": [
        1.3775,
        1.38071,
        1.37837,
        1.37989,
        1.37738,
        1.38055,
        1.37827,
        1.37976
    ],
    "1396274400": [
        1.37716,
        1.38071,
        1.37789,
        1.37758,
        1.37706,
        1.38059,
        1.37777,
        1.37747
    ]
}
This data contains is a dictionary of lists; each key in dictionary is a timestamp, which indicates the beginning of a single period for which the values were collected. The difference between timestamps is called the resolution of data.

The interpretation of values in each list is following:

Name	Description
minimal ask price	minimal ask price in the related period
maximal ask price	maximal ask price in the related period
open ask price	ask price at the beginning of the related period
close ask price	ask price at the end of the related period
minimal bid price	minimal bid price in the related period
maximal bid price	maximal bid price in the related period
open bid price	bid price at the beginning of the related period
close bid price	bid price at the end of the related period
Handling data precision through multiplication
GET /json/currencies/multipliers
In order to maintain data precision when dealing with various currency pairs, our API employs a multiplication operation. Some currency pairs are represented in larger units, with the API returning values for 100, 1000, or even more units, depending on the specific currency pair in question.

Take the currency pair PHPEUR as an illustration:

[
   {
      "ask":"1.66256",
      "bid":"1.66231",
      "name":"PHPEUR",
      "time":"1697798570.702"
   }
]
In this example, the provided price is actually for 100 units of PHPEUR, not a single unit. This is a mechanism employed to retain a high level of precision in the data provided.

Our API returns 1.66256 but in fact, the real value is 1.66256/100 which equals 0.0166256.

To accommodate this, you will need to perform a divide operation on your end. The multiplier would depend on the particular currency pair you are working with.

For a comprehensive list of symbols alongside their respective multipliers, please refer to the /currencies/multipliers endpoint. This endpoint provides a detailed list of all currency pairs that require multiplication on your side to obtain the precise data per unit.

Single currency pair rates
In order to get the current exchange rate for a single currency pair, use the following method:

JSON
GET /json/currencies/<currency-pair>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/json/currencies/EURUSD',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "ask": "1.06742",
    "bid": "1.06727",
    "name": "EURUSD",
    "time": "1584640370.007"
}
XML
POST /xml/currencies/<currency-pair>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
Example request:

var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://api.xchangeapi.com/xml/currencies/EURUSD',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <currency>
        <ask>1.06815</ask>
        <bid>1.06802</bid>
        <name>EURUSD</name>
        <time>1584637850.267</time>
    </currency>
</result>
CSV
GET /csv/currencies/<currency-pair>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/csv/currencies/EURUSD',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

ask,bid,name,time
1.06657,1.06644,EURUSD,1584640537.442
Many currency pairs rates
Use this method to get rates for a list of provided currencies pairs.

JSON
GET /json/currencies?pairs=["<currency-pair-1>", [...], "<currency-pair-n>"]
Parameter	Description
currency-pair-{1-n}	desired currency pair (see: list of available currencies)
Example request:

Example response:

[
    {
        "ask": "1.06750",
        "bid": "1.06739",
        "name": "EURUSD",
        "time": "1584641785.210"
    },
    {
        "ask": "0.87759",
        "bid": "0.87680",
        "name": "CHFGBP",
        "time": "1584641785.001"
    }
]
XML
POST /xml/currencies
Requests should be sent with the following body:

<data>
  <pair>EURUSD</pair>
  <pair>CHFGBP</pair>
</data>
Example request:

var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://api.xchangeapi.com/xml/currencies\n',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  },
  body: "<data>\n  <pair>EURUSD</pair>\n  <pair>CHFGBP</pair>\n</data>"

};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <currency>
        <ask>1.06765</ask>
        <bid>1.06751</bid>
        <name>EURUSD</name>
        <time>1584642398.460</time>
    </currency>
    <currency>
        <ask>0.87803</ask>
        <bid>0.87731</bid>
        <name>CHFGBP</name>
        <time>1584642398.623</time>
    </currency>
</result>
CSV
GET /csv/currencies?pairs=["<currency-pair-1>", [...], "<currency-pair-n>"]
Parameter	Description
currency-pair-{1-n}	desired currency pair (see: list of available currencies)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/csv/currencies?pairs=["EURUSD", "CHFGBP"]\n',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

ask,bid,name,time
1.06716,1.06703,EURUSD,1584642639.905
0.87774,0.87709,CHFGBP,1584642639.276
All currency pairs rates
Use this method to get rates for all of available currencies pairs.

JSON
GET /json/currencies/all
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/json/currencies/all',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

[
    {
        "ask": "28.23900",
        "bid": "27.23900",
        "name": "USDUAH",
        "time": "1584712816.841"
    },
    [...]
    {
        "ask": "230.68705",
        "bid": "227.99439",
        "name": "ETHNZD",
        "time": "1584793264.569"
    }
]
XML
GET /xml/currencies/all
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/xml/currencies/all',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <currency>
        <ask>28.23900</ask>
        <bid>27.23900</bid>
        <name>USDUAH</name>
        <time>1584712816.841</time>
    </currency>
    [...]
    <currency>
        <ask>231.24748</ask>
        <bid>228.43153</bid>
        <name>ETHNZD</name>
        <time>1584793483.684</time>
    </currency>
</result>
CSV
GET /csv/currencies/all
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/csv/currencies/all',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

ask,bid,name,time
1.05611,1.05272,AUDBGN,1584737977.016
[...]
6.33750,6.26250,ZARJPY,1584737972.955
Historical data
You can access historical exchange rates with the specified resolution by using the following method.

Depending on the choosen resolution, you can:

for the 1-sec resolution you can get last 60 values
for the 5-sec resolution, you can get last 360 values
for the 10-sec resolution, you can get last 259200 values
for the 60-sec resolution, you can get last 525600 values
for the 1800-sec resolution, you can get last 17520 values
JSON
GET /json/history/<currency-pair>?starttime=<starttime>&endtime=<endtime>&resolution=<resolution>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested period
resolution	resolution of data, possible values are: 1, 5, 10, 60, 1800 (see: data properties)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/json/history/EURUSD?starttime=1577836800&resolution=60&endtime=1577836920',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "1577836800": [
        1.12182,
        1.1221,
        1.12182,
        1.1221,
        1.12169,
        1.12199,
        1.12169,
        1.12199
    ],
    "1577836920": [
        1.12181,
        1.12182,
        1.12181,
        1.12181,
        1.12169,
        1.12169,
        1.12169,
        1.12169
    ],
    "1577836860": [
        1.12181,
        1.12182,
        1.12181,
        1.12181,
        1.12169,
        1.12169,
        1.12169,
        1.12169
    ]
}
XML
POST /xml/history/
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested period
resolution	resolution of data, possible values are: 1, 5, 10, 60, 1800 (see: data properties)
Example request:

var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://api.xchangeapi.com/xml/history/EURUSD',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  },
  body: "<data>\n    <starttime>1577836800</starttime>\n    &lt;endtime>1577836920</endtime>\n    &lt;resolution>60</resolution>\n</data>"

};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <item>
        <time>1577836800</time>
        <min_ask>1.12182</min_ask>
        <max_ask>1.1221</max_ask>
        <open_ask>1.12182</open_ask>
        <close_ask>1.1221</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12199</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12199</close_bid>
    </item>
    <item>
        <time>1577836860</time>
        <min_ask>1.12181</min_ask>
        <max_ask>1.12182</max_ask>
        <open_ask>1.12181</open_ask>
        <close_ask>1.12181</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12169</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12169</close_bid>
    </item>
    <item>
        <time>1577836920</time>
        <min_ask>1.12181</min_ask>
        <max_ask>1.12182</max_ask>
        <open_ask>1.12181</open_ask>
        <close_ask>1.12181</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12169</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12169</close_bid>
    </item>
</result>
CSV
GET /csv/history/<currency-pair>?starttime=<starttime>&endtime=<endtime>&resolution=<resolution>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested period
resolution	resolution of data, possible values are: 1, 5, 10, 60, 1800 (see: data properties)
Example request:

var http = require('follow-redirects').http;
var fs = require('fs');

var options = {
  'method': 'GET',
  'hostname': 'api.eu.xchangeapi.com',
  'path': '/csv/history/EURUSD?starttime=1577836800&resolution=60&endtime=1577836920',
  'headers': {
    'api-key': 'your-api-key'
  },
  'maxRedirects': 20
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });

  res.on("error", function (error) {
    console.error(error);
  });
});

req.end();
Example response:

time,min_ask,max_ask,open_ask,close_ask,min_bid,max_bid,open_bid,close_bid
1577836800,1.12182,1.1221,1.12182,1.1221,1.12169,1.12199,1.12169,1.12199
1577836860,1.12181,1.12182,1.12181,1.12181,1.12169,1.12169,1.12169,1.12169
1577836920,1.12181,1.12182,1.12181,1.12181,1.12169,1.12169,1.12169,1.12169
Chart peaks for selected period
Chart data is similar to historical data. The only difference is, that in this case the resolution is calculated automatically. With the following method, you can access data for the specified periods of time.

JSON
GET /json/chart/<currency-pair>/<period>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
period	one of predefined time periods (30m - last 30 minutes, 1h - last hour, 6h - last 6 hours, 12h - last 12 hours, 1d - last day, 2d - last 2 days, 7d - last 7 days, 1M - last month, 3M - last 3 months, 6M - last 6 months, 1Y - last year)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/json/chart/EURUSD/1d',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "1584714240": [
        1.07217,
        1.07372,
        1.07329,
        1.07233,
        1.07205,
        1.07358,
        1.07315,
        1.07217
    ],
    [...]
    "1584728880": [
        1.0641,
        1.06594,
        1.06543,
        1.06542,
        1.06396,
        1.06583,
        1.06531,
        1.06529
    ]
}
XML
POST /xml/chart/<currency-pair>/<period>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
period	one of predefined time periods (30m - last 30 minutes, 1h - last hour, 6h - last 6 hours, 12h - last 12 hours, 1d - last day, 2d - last 2 days, 7d - last 7 days, 1M - last month, 3M - last 3 months, 6M - last 6 months, 1Y - last year)
Example request:

var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://api.xchangeapi.com/xml/chart/EURUSD/1d',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <item>
        <time>1584709680</time>
        <min_ask>1.07</min_ask>
        <max_ask>1.07129</max_ask>
        <open_ask>1.0703</open_ask>
        <close_ask>1.0711</close_ask>
        <min_bid>1.06988</min_bid>
        <max_bid>1.07115</max_bid>
        <open_bid>1.07019</open_bid>
        <close_bid>1.07097</close_bid>
    </item>
    [...]
    <item>
        <time>1584737520</time>
        <min_ask>1.06966</min_ask>
        <max_ask>1.07034</max_ask>
        <open_ask>1.0699</open_ask>
        <close_ask>1.06996</close_ask>
        <min_bid>1.0692</min_bid>
        <max_bid>1.06987</max_bid>
        <open_bid>1.06927</open_bid>
        <close_bid>1.06966</close_bid>
    </item>
</result>
CSV
GET /csv/chart/<currency-pair>/<period>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
period	one of predefined time periods (30m - last 30 minutes, 1h - last hour, 6h - last 6 hours, 12h - last 12 hours, 1d - last day, 2d - last 2 days, 7d - last 7 days, 1M - last month, 3M - last 3 months, 6M - last 6 months, 1Y - last year)
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/csv/chart/EURUSD/1d',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

time,min_ask,max_ask,open_ask,close_ask,min_bid,max_bid,open_bid,close_bid
1584709680,1.07024,1.07129,1.0703,1.0711,1.07014,1.07115,1.07019,1.07097
[...]
1584737520,1.06966,1.07034,1.0699,1.06996,1.0692,1.06987,1.06927,1.06966
Chart peaks for date range
Use this method to get the chart data for some specific period of time.

JSON
GET /json/chart/<currency-pair>?starttime=<starttime>&endtime=<endtime>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested periods
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/json/chart/EURUSD?starttime=1577836800&endtime=1577836920',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

{
    "1577836800": [
        1.12182,
        1.1221,
        1.12182,
        1.1221,
        1.12169,
        1.12199,
        1.12169,
        1.12199
    ],
    "1577836920": [
        1.12181,
        1.12182,
        1.12181,
        1.12181,
        1.12169,
        1.12169,
        1.12169,
        1.12169
    ],
    "1577836860": [
        1.12181,
        1.12182,
        1.12181,
        1.12181,
        1.12169,
        1.12169,
        1.12169,
        1.12169
    ]
}
XML
POST /xml/chart/<currency-pair>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested periods
Example request:

var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://api.xchangeapi.com/xml/chart/EURUSD',
  'headers': {
    'Content-Type': 'application/xml',
    'api-key': 'your-api-key'
  },
  body: "<data>\n    <starttime>1577836800</starttime>\n    &lt;endtime>1577836920</endtime>\n</data>"

};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

<result>
    <item>
        <time>1577836800</time>
        <min_ask>1.12182</min_ask>
        <max_ask>1.1221</max_ask>
        <open_ask>1.12182</open_ask>
        <close_ask>1.1221</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12199</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12199</close_bid>
    </item>
    <item>
        <time>1577836860</time>
        <min_ask>1.12181</min_ask>
        <max_ask>1.12182</max_ask>
        <open_ask>1.12181</open_ask>
        <close_ask>1.12181</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12169</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12169</close_bid>
    </item>
    <item>
        <time>1577836920</time>
        <min_ask>1.12181</min_ask>
        <max_ask>1.12182</max_ask>
        <open_ask>1.12181</open_ask>
        <close_ask>1.12181</close_ask>
        <min_bid>1.12169</min_bid>
        <max_bid>1.12169</max_bid>
        <open_bid>1.12169</open_bid>
        <close_bid>1.12169</close_bid>
    </item>
</result>
CSV
GET /csv/chart/<currency-pair>?starttime=<starttime>&endtime=<endtime>
Parameter	Description
currency-pair	desired currency pair (see: list of available currencies)
starttime	UNIX timestamp indicating the date of the beginning of requested period, for example 1577836800 for 1st of January 2020.
endtime	as above, but it is the date of the end of requested periods
Example request:

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'https://api.xchangeapi.com/csv/chart/EURUSD?starttime=1577836800&endtime=1577836920',
  'headers': {
    'api-key': 'your-api-key'
  }
};
request(options, function (error, response) { 
  if (error) throw new Error(error);
  console.log(response.body);
});
Example response:

time,min_ask,max_ask,open_ask,close_ask,min_bid,max_bid,open_bid,close_bid
1577836800,1.12182,1.1221,1.12182,1.1221,1.12169,1.12199,1.12169,1.12199
1577836860,1.12181,1.12182,1.12181,1.12181,1.12169,1.12169,1.12169,1.12169
1577836920,1.12181,1.12182,1.12181,1.12181,1.12169,1.12169,1.12169,1.12169
Websocket API
Thanks to Websocket protocol, we can deliver you all currency rates changes in realtime. What you need is just to connect our WebSocket API and provide a list of currency pairs you want to subscribe.

We designed a special WebSocket api to minimize traffic and latency. There you will find how to use this protocol.

You will find also Protocol implementations, that you can use on your side.

Protocol description
It is WebSocket (rfc_6455), with disabled problematic PING/PONG messages. After initialization connection stays open unless you decide to close it (or you reach your limits etc). It’s available via HTTP and HTTPS.

How it works?
Step 1. Connect and subscribe
Please use the following endpoint to connect our Websocket API:

GET /websocket/live
When a connection is estabilished, you have to provide a list of currency pairs to subscribe, using the following format:

{"pairs": pairs}
Parameter	Description
pairs	a list of currency pairs (see: list of available currencies)
for example:

{"pairs": ["EURUSD", "CHFGBP"]}
Step 2. Parse Websocket API responses
The first message you receive after you define the list of currency pairs to track has the following format:

0{"session_uid":"***","time_mult":1000,"start_time":1594922406.851688,"order":["name","ask","bid","time"],"mapping":{"0":"EURUSD","1":"GBPCHF"}}
As you can see, this is a regular JSON string with the "0" prefix. "0" is a message code and it means that this is an initial message (see: list of available message codes).

Some of the values from the JSON will be used later.

Parameter	Description
time_mult	time multiplier, divide received relative timestamps for messages with code 1 by that value
start_time	a time that is base for all further relative timestamps
order	field names for key/value mapping used by code 1 messages
mapping	messages with code 1 will return numbers instead of pair names. Use this mapping to receive requested names
There will be only one initial message (in the JSON format). The next ones (with live currency rates) use the following format:

Example websocket API response

The first character of each reply is a message code. The rest is a message body.

For example, in case of the above API response we have:

Value	Description
1	message code
1	currency pair name (see mappings from the initial message: 1 means GBPCHF)
1.18912	ask price
1.18860	bid price
10	relative timestamp. In order to calculate the full timestamp for the specific currency rate change, you can do: 1594922406.851688 + 10 / 1000 (start_time from the initial message + relative_timestamp / time_mult from the initial message)
Available message codes
Message code	Description	Example message
0	Initial message	0{"session_uid":"***", "time_mult":1000, "start_time":1594922406.851688, "order":["name","ask","bid","time"],"mapping":{"0":"EURUSD","1":"GBPCHF"}}
1	Currency rate update	11|1.18912|1.18860|10
2	A ping message	2
9	Invalid pair chosen	9{"num_error":90, "name":"XXXYYY", "error":"Invalid choice"}
7	None of requested elements is avaliable.	7{"num_error":72 , "error":"No valid elements given"}
7	Request data was malformed, data contains error information.	7{"num_error":73, "error":"Invalid request data", data={}}
Example implementation
Here you can find example implementations in Java Script and NodeJS.

#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

var start_time,
    mapping,
    order,
    time_mult,
    pairs = ['EURUSD', 'GBPCHF'];

function unpackInit(data) {
    var meta = JSON.parse(data);
    start_time = meta['start_time'];
    mapping = meta['mapping'];
    order = meta['order'];
    time_mult = meta['time_mult'];
    return meta;
};

function unpackErrPair(data) {
    return JSON.parse(data);
};

function unpackData(data) {
    var inc = data.split('|');
    var out = {};
    for (var i in order) {
        out[order[i]] = inc[i];
    };
    out["name"] = mapping[out["name"]];
    out["time"] = parseFloat(out["time"]) / time_mult;
    out["time"] += start_time;
    return out;
};

function pack(data) {
    return JSON.stringify(data);
};

function processMessage(data) {
    var t = data.substring(0, 1);
    var msg = data.substring(1);
    var inc_data = null;
    switch (t) {
    case '0':
        inc_data = unpackInit(msg);
        break;
    case '7':
    case '8':
    case '9':
        inc_data = unpackErrPair(msg);
        break;
    case '1':
        inc_data = unpackData(msg);
        break;
    case '2':
        inc_data = "";
        break
    default:
        break;
    }
    if(inc_data != null) {
        try {
            console.log(JSON.stringify(inc_data));
        } catch (e) {
            console.log(inc_data);
        }
    } else {
        console.log('Error:' + error);
    }
}

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {

    connection.sendUTF(pack({"pairs": pairs}));

    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('message', function(message) {
        processMessage(message.utf8Data)
    });
});

client.connect('wss://api.xchangeapi.com/websocket/live?api-key=your-api-key');
Available currencies
The following table contains list of available currencies. In order to query our API you have to provide a currency pair which containts two of the available currencies (for example EURUSD).

Symbol	Currency
AUD	Austalian Dollar
BGN	Bulgarian Lev
BRL	Brazilian Real
CAD	Canadian Dollar
CHF	Swiss Franc
CNY	Chinese Yuan
CZK	Czech Koruna
DKK	Danish Krone
EUR	Euro
GBP	Pound Sterling
HKD	Hong Kong Dollar
HUF	Hungarian Forint
ILS	Israeli New Shekel
INR	Indian Rupee
JPY	Japanese Yen
MXN	Mexican Peso
NOK	Norwegian Krone
NZD	New Zealand Dollar
PLN	Polish Zloty
RON	Romanian Leu
RUB	Russian Ruble
SEK	Swedish Krona
SGD	Singapore Dollar
TRY	Turkish Lira
UAH	Ukrainian Hryvnia
USD	United States Dollar
ZAR	South African Rand
Available cryptocurrencies
 Cryptocurrencies are available only in Premium plan.
Symbol	Cryptocurrency
BTC	Bitcoin
LTH	Ethereum
ETC	Litecoin
cURL
Go
Python
JavaScript
Node.js
PHP
Java
Ruby