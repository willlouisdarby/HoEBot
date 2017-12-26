// necessary libraries
require('ical-date-parser');
var Promise = require('bluebird');
var ical = require('ical');

// functions to access the calendar

module.exports = {
	// find date function called in the app.js file
    findDate: function (typeOfDate) {
        return new Promise(function (resolve) {

            //accessing the google calendar
            ical.fromURL('http://howardofeffingham.greenhousecms.co.uk/ical.ics', {}, function(err, data) {

            	// creates a list that will be used to store the results found.
				var recordsFound = [];	      		

				// loops through the different objects in the calendar
	      		for (var k in data){
		        	if (data.hasOwnProperty(k)) { 
		        		
		        		// ev is the current object (event)
		          		var ev = data[k]
		          		// summary is the name of the object
		          		var summary = '' + ev.summary;
		          		// if the date string is longer than 8
		         		if (ev.start.length > 8) {
			            	// this has a date and a time
			            	//eg 20170905T12451445

							var jsStartDate = iCalDateParser(ev.start);
							var jsEndDate = iCalDateParser(ev.end);
 
							// converts the JS date objects to a string
							 
							var startDate = jsStartDate.getDay() + '-' + jsStartDate.getMonth() + '-' + jsStartDate.getFullYear();
							var EndDate = jsEndDate.getDay() + '-' + jsEndDate.getMonth() + '-' + jsEndDate.getFullYear();
							 
							// put the string back into the object
							ev.start = startDate;
							ev.end = EndDate;
 
						} else {
            				// this is just the date
							// eg start:20170905
							var jsStartDate = ev.start.toString();
							// get all the parts of the date from the string
                   			var y = jsStartDate.substr(0,4),
                            	m = jsStartDate.substr(4,2),
                            	d = jsStartDate.substr(6,2);
		                	// convert into a js date object
		                	var startDateObj = new Date(y,m,d);

							// turn the object into a string
							var startDate = startDateObj.getDay() + '-' + startDateObj.getMonth() + '-' + startDateObj.getFullYear();
 
				            // put the string back into the object
				            ev.start = startDate;
						}
						// switch case statement to work out what the intent is
		         		switch (typeOfDate) {

		         			case 'inset':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("INSET") >= 0) {
		         					// adds the event to the list
		         					recordsFound.push(ev);
		         				}
		         			break;

		         			case 'termStart':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("Term") >= 0 && summary.search("Start") >= 0) {
		         					// adds the event to the list
		         					recordsFound.push(ev);
		         				}
		         			break;

		         			case 'termEnd':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("Term") >= 0 && summary.search("End") >= 0) {
		         					// adds the event to the list
		         					recordsFound.push(ev);
		         				}
		         			break;
		         		}
		        	}
	      		}
	      		//console.log('records found: ', recordsFound);
	      		resolve(recordsFound);
    		});
			return;

        });
    }
}

