// loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');

// import the REST library so that the bot can listen for messages
var restify = require('restify');
var databaseUtilities = require('./databaseUtilities.js');
var calendarUtilities = require('./CalendarUtilities.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

// displays error message if the query sent by the user is not recognised
var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});


var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);



// dialog to process the getContact intent
bot.dialog('getContact', function (session, args) {
    // retrieve all the possible entities from LUIS model

    // role entities when searching by role
    var headOfEnglishEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'headOfEnglish');
    var headOfMathsEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'headOfMaths');
    var headOfLanguagesEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'headOfLanguages');
    var headOfSixthFormEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'headOfSixthForm');
    var assistantHeadTeacherEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'assistantHeadTeacher');
    var headTeacherEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'headTeacher');

    // staff name entity when searching by the name of a staff member
    var staffMemberNameEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'staffMemberName');


    var todayEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'today');
    var tomorrowEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'tomorrow');


    var roleToFind = "";
    var nameToFind = "";
    var timetableToFind = "";

    // finds any role entities that have been set
    if (headOfEnglishEntity){
        roleToFind = 'headOfEnglish';       
    } else if (headOfMathsEntity) {
        roleToFind = 'headOfMaths'; 
    } else if (headOfLanguagesEntity) {
        roleToFind = 'headOfSixthForm'; 
    } else if (headOfSixthFormEntity) {
        roleToFind = 'headOfSixthForm'; 
    } else if (assistantHeadTeacherEntity) {
        roleToFind = 'assistantHeadTeacher'; 
    } else if (headTeacherEntity) {
        roleToFind = 'headTeacher'; 
    } else if (staffMemberNameEntity) {
        nameToFind = 'staffMemberName'; 
    } else if (todayEntity) {
        todayEntity = 'today';     
    } else if (tomorrowEntity) {
        tomorrowEntity = 'tomorrow';     
    } else {
        console.log("entity not found");
    }


    console.log("entity = ", roleToFind);

    // finds if it needs to search by role or by name
    if(roleToFind){
        // search by role
        searchByRole(roleToFind, session);
    } else if (nameToFind){
        // search by name
        searchByName(nameToFind, session);
    } else if (timetableToFind){
        searchByTimetable(timetableToFind, session);
    }

}).triggerAction({
    // map this dialog to the getContact intent 
    matches: 'getContact'
});

// dialog to process getContact intent
bot.dialog('getContactByName', function (session, args) {

    // staff name entity - when searching by the name of a staff member
    var staffMemberNameEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'staffMemberName');
    console.log(staffMemberNameEntity);

    var nameToFind = "";

    // are any role entities set?
    if (staffMemberNameEntity) {
        nameToFind = staffMemberNameEntity.entity; 
    } else {
        console.log("entity not found");
        session.endDialog('Oops! I didn\'t recognise that name');
    }

    console.log("entity = ", nameToFind);

    // is the intent to search by role?
    if (nameToFind){
        // search by name
        searchByName(nameToFind, session);
    }

}).triggerAction({
    // map this dialog to the getContact intent 
    matches: 'getContactByName'
});


// dialog to process getDate intent
bot.dialog('getDate', function (session, args) {
    // retrieve all the possible entities from LUIS model

    // date type entities
    var insetEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'inset');
    var termStartEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'termStart');
    var termEndEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'termEnd');

    var dateToFind = "";

    // are any date entities set? - determines which (if any) date entities were returnded by LUIS
    if (insetEntity) {
        dateToFind = 'inset'; 
    } else if (termStartEntity) {
        dateToFind = 'termStart'; 
    }else if (termEndEntity) {
        dateToFind = 'termEnd'; 
    } else {
        // no date entity set
        console.log("entity not found");
        session.endDialog('Oops! I couldn\'t find that date');
    }

    // is the intent to find a date?
    if (dateToFind){
        // search by date
        searchByDate(dateToFind, session);
    }

}).triggerAction({
    // map this dialog to the getDate intent 
    matches: 'getDate'
});


bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'Who is the headTeacher\'');
}).triggerAction({
    matches: 'Help'
});

// getContact intent - search contacts by role

function searchByRole(roleToFind, session) {

   databaseUtilities.findRole(roleToFind).then(function (contactsFound) {
            
        console.log ("searchByRole contactsFound", contactsFound);

        session.send('I found %d contacts:', contactsFound.length);



        // build the records found as a bot carousel
        var message = new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(contactsFound.map(contactAsAttachment));


                // send back the message to the user
                session.send(message);

                // End the dialog - job done!
                session.endDialog();
    })
}

//
// getContact intent - search contacts by name
//
function searchByName(nameToFind, session) {

    session.send('Looking for %s :', nameToFind);

    databaseUtilities.findName(nameToFind).then(function (contactsFound) {
            
        console.log ("searchByName contactsFound", contactsFound);

        session.send('I found %d contacts:', contactsFound.length);

        // build the records found as a bot carousel
        var message = new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(contactsFound.map(contactAsAttachment));

                // send back the message to the user
                session.send(message);

                // End the dialog
                session.endDialog();
    })
}



function searchByDate(dateToFind, session) {
    // message to user displaying a loading message
    session.send('Looking for %s :', dateToFind);
    //calls the findDate function in the calendarUtilities file
    calendarUtilities.findDate(dateToFind).then(function (datesFound) {
            
        // message to user displaying the amount of dates found
        session.send('I found %d dates:', datesFound.length);

        // build the records found as a bot carousel
        var message = new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(datesFound.map(dateAsAttachment));

                // send back the message to the user
                session.send(message);

                // End the dialog
                session.endDialog();
    })
}

// function to display the card on the specific teacher
function dateAsAttachment(calendarDate) {
    // initialises the card
    return new builder.HeroCard()

        // displays the event type as the title on the carousel card
        .title(calendarDate.summary)
        // displays the date of the event on the card
        .subtitle(calendarDate.start)
        ;
}

// function to display the card on the specific teacher
function contactAsAttachment(contact) {
    // initialises the card
    return new builder.HeroCard()
        // displays name of staff member on card
        .title(contact.title + ' ' + contact.lastname)
        // displays telephone and email of the staff member on the card
        .subtitle('telephone: %s email : %s', contact.phone_number, contact.email)
        ;
}