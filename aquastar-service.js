(function () {
   "use strict";

	var rp = require("request-promise"),
		cheerio = require("cheerio"),
		_ = require("lodash"),
		q = require("q");

	require("stringformat").extendString("format");

	var service = (function (baseUrl) {
		if (typeof baseUrl !== "string") throw("baseUrl is not defined");

		var cookieJar = rp.jar(),
		    request = rp.defaults({ 
				proxy: process.env.AQ_PROXY || null, 
				jar: cookieJar,
				rejectUnauthorized: false,
				headers: {
					"accept": "text/html,application/xhtml+xml;q=0.9,application/xml;q=0.8,*/*;q=0.7",
					"user-agent": "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
					"dnt": "1",
					"accept-language": "en-US,en;q=0.8"
				}
			}),
			urlForPath = function (path) {
				return "{0}/{1}".format(baseUrl, path);
			};

		var connect = function () {
				var deferred = q.defer();

				request.get(urlForPath("tcnc"))
					.then(function(body) {
						deferred.resolve(body);
					})
				    .catch(function(reason) {
				        deferred.reject(reason);
				    });

				return deferred.promise;
			},
			authenticate = function (credentials) {
				var deferred = q.defer();

				request.post({
						headers: {"content-type" : "application/x-www-form-urlencoded"},
						url: urlForPath("logon.do"), 
						body: credentials 
					})
					.then(function (body) {
						deferred.resolve(body);
					})
				    .catch(function(reason) {
				        deferred.reject(reason);
				    });

				return deferred.promise;
			};

		var getHiddenParams = function (html) {
			var $ = cheerio.load(html),
			    params = {};

			_.forEach($("form[name=ActionForm] input[type=hidden]"), function (element) {
				var key = element.attribs["name"];
				(typeof key === "string") && (params[key] = element.attribs["value"]);
			});

			return params;
		};

		var getStatements = function (html) {
			var $ = cheerio.load(html),
			    statements = [];

			_.forEach($("tr[class^=search_cell_]"), function (element) {
				var selector = "td[align=center][nowrap=nowrap]",
				    dateCell = $(element).find(selector).eq(0),
				    dateString = dateCell.text(),
				    linkCell = dateCell.siblings(selector).eq(0),
				    linkTag = linkCell.find("a[href*=aquastar\\.townofcary\\.org]").eq(0),
				    linkString = linkTag[0].attribs["href"];

			 	statements.push({
			 		date: new Date(Date.parse(dateString)),
			 		link: linkString
			 	});
			});

			return statements;
		};

		var serialize = function (obj) {
			return _.map(Array.isArray(obj) ? obj : [ obj ], function (dictionary) {
				var pairs = [];
				for (var key in dictionary) {
					if (dictionary.hasOwnProperty(key)) {
						pairs.push("{0}={1}".format(escape(key), escape(dictionary[key])));
					}
				}
				return pairs.join("&");
			}).join("&");
		};

		return {
			login: function(params) {
					connect()
					.then(function (body) {
						authenticate(serialize([params, getHiddenParams(body)]))
						.then(function (body) {
							var statements = getStatements(body);
							_.forEach(statements, function (statement) {
								console.log(statement.date.toISOString().slice(0,10));
								console.log(statement.link);
								console.log();
							})
						});
					});
			}
		};
	})("https://ipn.paymentus.com/epd/stde");

	module.exports = service;
})();