
var objSet = {
	strSheetName: 'Sheet1',
	'strAPYkey': 'rrrr',
	'searchEngineID': 'rrrrr',
}

function onOpen() {

	var ui = SpreadsheetApp.getUi();

	ui.createMenu('Utilities')
	.addItem('Search (links only)', 'bolSrc')
	.addItem('Search (include text)', 'bolSrc1')
	// .addItem('Search ', 'bolSrc2')
	.addToUi();

}

function bolSrc() {

	bolSrcMain(1)
}

function bolSrc1() {

	bolSrcMain(2)
}

function bolSrc2() {

	bolSrcMain(3)
}

function bolSrcMain(strType) {

	var sp = SpreadsheetApp.getActiveSpreadsheet();
	var sh = sp.getSheetByName(objSet.strSheetName);
	var data = sh.getDataRange().getValues();

	var arr = [];
	for (var i = 1; i < data.length; i++) {
		var site = ('' + data[i][0]).trim()
		var link = ('' + data[i][1]).trim().toUpperCase().replace("HTTPS://", "").replace("HTTP://", "")

		if (site != "" && link != "") {
			//Logger.log(site)
			//Logger.log(link)
			arr.push([site, link, i])

		}
	}

	if (arr.length > 0) {
		for (var i = 0; i < arr.length; i++) {

			if (strType == 1) {
				var query = "site:" + arr[i][0] + " link:" + arr[i][1] + ""
			} else if (strType == 2) {
				var query = "site:" + arr[i][0] + " " + arr[i][1] + ""
			} else {
				var query = "linkdomain:" + arr[i][0] + " link:" + arr[i][1] + ""
			}

			var res = searchFor(query)

				//  var res= scrapeGoogle(arr[i][0],arr[i][1])
				//  Logger.log(res)
				if (res.searchInformation.formattedTotalResults > 0) {
					sh.getRange(arr[i][2] + 1, 3, 1, 3).setValues([["Y", res.searchInformation.formattedTotalResults, res.items[0].link]])
				} else {
					sh.getRange(arr[i][2] + 1, 3, 1, 3).setValues([["N", res.searchInformation.formattedTotalResults, ""]])
				}
		}
	}

}

function scrapeGoogle(strURL, strLInk) {
	try {
		var response = UrlFetchApp.fetch("" + strURL + "", {
				'muteHttpExceptions': true
			});

		var respCode = response.getResponseCode()
			if (respCode != '200') {
				var row = ["N", "", ""]
				return row
			}
	} catch (e) {
		var row = ["N", "Site cannot be reached", ""]
		return row
	}

	var fail = false
		try {
			var response = UrlFetchApp.fetch("http://www.google.com/search?q=site:" + encodeURIComponent(strURL) + " " + encodeURIComponent(strLInk) + "", {
					'muteHttpExceptions': true
				});

			// Logger.log(response.getResponseCode())
			var respCode = response.getResponseCode()
				if (respCode != '200') {
					fail = true
				}
		} catch (e) {
			fail = true
		}

		if (fail == true) {
			try {
				faile = true
					var response = UrlFetchApp.fetch("http://www.google.com/search?q=site:" + encodeURIComponent(strURL) + " inurl:" + encodeURIComponent(strLInk) + "", {
						'muteHttpExceptions': true
					});

				// Logger.log(response.getResponseCode())
				var respCode = response.getResponseCode()
					if (respCode != '200') {
						fail = true
					}
			} catch (e) {
				fail = true
			}
		}

		if (fail == true) {
			try {
				faile = true
					var response = UrlFetchApp.fetch("http://www.google.com/search?q=info:" + encodeURIComponent(strURL) + " inurl:" + encodeURIComponent(strLInk) + "", {
						'muteHttpExceptions': true
					});

				// Logger.log(response.getResponseCode())
				var respCode = response.getResponseCode()
					if (respCode != '200') {
						var row = ["N", respCode, ""]
						return row
					}
			} catch (e) {
				var row = ["N", "Error", ""]
				return row
			}
		}

		var row = ["N", respCode, ""]

		//Logger.log(response.getContentText())
		//var myRegexp = /<h3 class=\"r\">([\s\S]*?)<\/h3>/gi;
		var myRegexp = /<cite(.*?)cite>/gi;
	//*[@id="rso"]/div/div/div[1]/div/div/div/div/div/cite
	var elems = response.getContentText().match(myRegexp);

	/*
	for(var i in elems) {

	var title = elems[i].replace(/(^\s+)|(\s+$)/g, "")
	.replace(/<\/?[^>]+>/gi, "");
	//Logger.log(title);

	}
	 */

	if (elems == null) {
		return row
	} else {
		var title = elems[0].replace(/(^\s+)|(\s+$)/g, "")
			.replace(/<\/?[^>]+>/gi, "");
		// Logger.log(title);
		row[0] = "Y"
			row[2] = title
			return row
	}

}

function debug() {
	Logger.log(scrapeGoogle("http://www.paulypresleyrealty.com", "www.sentemortgage.com"))
}

/**
 * Use Google's customsearch API to perform a search query.
 * See https://developers.google.com/custom-search/json-api/v1/using_rest.
 *
 * @param {string} query   Search query to perform, e.g. "test"
 *
 * returns {object}        See response data structure at
 *                         https://developers.google.com/custom-search/json-api/v1/reference/cse/list#response
 */
function searchFor(query) {

	// Base URL to access customsearch
	var urlTemplate = "https://www.googleapis.com/customsearch/v1?key=%KEY%&cx=%CX%&q=%Q%";

	// Script-specific credentials & search engine
	var ApiKey = objSet.strAPYkey
		var searchEngineID = objSet.searchEngineID;

	// Build custom url
	var url = urlTemplate
		.replace("%KEY%", encodeURIComponent(ApiKey))
		.replace("%CX%", encodeURIComponent(searchEngineID))
		.replace("%Q%", encodeURIComponent(query));

	var params = {
		muteHttpExceptions: true
	};

	// Perform search
	Logger.log(UrlFetchApp.getRequest(url, params)); // Log query to be sent
	var response = UrlFetchApp.fetch(url, params);
	var respCode = response.getResponseCode();

	if (respCode !== 200) {
		throw new Error("Error " + respCode + " " + response.getContentText());
	} else {
		// Successful search, log & return results
		var result = JSON.parse(response.getContentText());
		Logger.log("Obtained %s search results in %s seconds.",
			result.searchInformation.formattedTotalResults,
			result.searchInformation.formattedSearchTime);
		return result;
	}
}

function debug1() {
	var query = "site:http://www.paulypresleyrealty.com wallethub.com/edu/best-cities-for-jobs"
		Logger.log(searchFor(query))
}