// necessary libraries
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
		          		
						// switch case statement to work out what the intent is
		         		switch (typeOfDate) {

		         			case 'parentsEvening':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("Parent") >= 0 && summary.search("Evening") >= 0) {
		         					// adds the event to the list
		         					getTheDates(ev);
		         					recordsFound.push(ev);
		         				}
		         			break;

		         			case 'inset':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("INSET") >= 0) {
		         					// adds the event to the list
		         					getTheDates(ev);
		         					recordsFound.push(ev);
		         				}
		         			break;

		         			case 'termStart':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("Term") >= 0 && summary.search("Start") >= 0) {
		         					// adds the event to the list
		         					getTheDates(ev);
		         					recordsFound.push(ev);
		         				}
		         			break;

		         			case 'termEnd':
		         				// serach for summary: 'INSET Day'
		         				if(summary.search("Term") >= 0 && summary.search("End") >= 0) {
		         					// adds the event to the list
		         					getTheDates(ev);
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


function getTheDates(ev){

	
	console.log ('getTheDates ev:', ev);

	console.log ('getTheDates ev.start:', ev.start);

	console.log ('getTheDates ev.start.length:', ev.start.toString().length);


	// if the date string is longer than 8
	if (ev.start.toString().length > 8) {


		// this has a date and a time
		//eg 20170905T12451445

		// set the options to format the date
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
		var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };



		var startDateObj = new Date(ev.start.toString());
		var endDateObj = new Date(ev.end.toString());
		
		console.log('calendar startDateObj:', startDateObj.toLocaleDateString('en-GB', options));

		 
		// put the string back into the object
		ev.start = startDateObj.toLocaleDateString('en-GB', options);
		ev.end = endDateObj.toLocaleDateString('en-GB', options);

	} else {
		
		console.log('getTheDates for:', ev.summary);	

		// this is just the date
		// eg start:20170905
		var jsStartDate = ev.start.toString();

		// set the options to format the date
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
		var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

		// get all the parts of the date from the string
		var y = parseInt(jsStartDate.substr(0,4)),
	    m = parseInt(jsStartDate.substr(4,2)),
	    d = parseInt(jsStartDate.substr(6,2));

	    
	    // JS Date objects - month starts at zero so take 1 from the month
	    m = m - 1;
	    
		// convert into a js date object
		var startDateObj = new Date(y,m,d);
		console.log('calendar startDateObj:', startDateObj.toLocaleDateString('en-GB', options));

	    // put the string back into the object
	    ev.start = startDateObj.toLocaleDateString('en-GB', options);
	}


}



