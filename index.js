(function () {
    "use strict";

  	var service = require("./aquastar-service");

    var promptForLogin = false;

    if (promptForLogin) {
		var prompt = require('prompt');

		prompt.start();
		prompt.message = "";
		prompt.delimiter = ">".white;

		prompt.get({
		    properties: {
		      email: {
		        pattern: /^[0-9a-zA-Z]+([0-9a-zA-Z]*[-._+])*[0-9a-zA-Z]+@[0-9a-zA-Z]+([-.][0-9a-zA-Z]+)*([0-9a-zA-Z]*[.])[a-zA-Z]{2,6}$/,
		        message: "Must be a valid email address",
		        description: "Login Id (email address)".cyan,
		        required: true
		      },
		      password: {
		        hidden: true,
		        description: "Password".cyan,
		        required: true
		      }
		    }
		  }, function (err, result) {
		  	service.login({
				"loginId": result.email, 
				"password": result.password
			});
		});
	}
	else {
		service.login({
				"loginId": process.env.AQ_UID, 
				"password": process.env.AQ_PWD
			});
	}
})();