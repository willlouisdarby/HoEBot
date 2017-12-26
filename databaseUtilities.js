// Module to handle the database queries

// import the sqlite module so that we can access the database
var sqlite3 = require('sqlite3').verbose();
var file = "./database/hoebot.sqlite";
var util = require('util');
var Promise = require('bluebird');


// functions to access the database


module.exports = {
    findRole: function (roleToFind) {
        return new Promise(function (resolve) {

            console.log("method findRole", roleToFind);

			// connect to the database
			var db = new sqlite3.Database(file); 

			// build SQL string
			var SQL = util.format("SELECT s.staff_id, s.title, s.firstname, s.lastname, s.email, s.phone_number, s.role_id FROM staff s, roles r WHERE s.role_id = r.role_id AND role_code = '%s'", roleToFind);
			var recordsFound = [];

			console.log("method findRole running SQL", SQL);

			db.all(SQL, function(err, rows) {  

				
				// check for any errors
				if (err){
					console.log("method findRole - err:", err);
		        }

				// check that some rows were returned
				if (rows && rows.length > 0){
					console.log("method findRole - number of rows returned: ", rows.length );
					recordsFound = rows;
					resolve(recordsFound); 	
		    	} else {
		    		// no rows found
		    		console.log("method findRole - no rows returned");
		    		recordsFound = null;
		    		resolve(recordsFound); 
		    	}
		    });   
			
			// close the database connection
			db.close(); 
			return;

        });
    },





    findName: function (nameToFind) {
        return new Promise(function (resolve) {

        	console.log("method findName", nameToFind);

			// connect to the database
			var db = new sqlite3.Database(file); 

			// build SQL string
			var SQL = util.format("SELECT * FROM staff WHERE lastname LIKE '%%%s%%'", nameToFind);
			var recordsFound = [];

			console.log("method findName running SQL", SQL);

			db.all(SQL, function(err, rows) {  

				
				// check for any errors
				if (err){
					console.log("method findName - err:", err);
		        }

				// check that some rows were returned
				if (rows && rows.length > 0){
					console.log("method findName - number of rows returned: ", rows.length );
					recordsFound = rows;
					resolve(recordsFound); 	
		    	} else {
		    		// no rows found
		    		console.log("method findName - no rows returned");
		    		recordsFound = null;
		    		resolve(recordsFound); 
		    	}
		    });   
			
			// close the database connection
			db.close(); 
			return;
            
        });
    }
};