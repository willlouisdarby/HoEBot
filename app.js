// loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');

// import the REST library so that the bot can listen for messages
var restify = require('restify');
var databaseUtilities = require('./databaseUtilities.js');
var calendarUtilities = require('./calendarUtilities.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

// displays error message if the query sent by the user is not recognised
var bot = new builder.UniversalBot(connector, function(session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});


var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)
    .onEnabled(function (session, callback) {
 
        // if the todo dialog is running turn the LUIS recogniser off so 
        // that it doesn't start a the contact dialog when the to do dialog asks for a name
        
        if (session.userData.addToDoDialog == undefined || session.userData.addToDoDialog == false) {
            console.log('LUIS is recognizer is listening');
            callback(null, true);
        } else {
            console.log('LUIS is recognizer is NOT listening');
            callback(null, false);
        }
    });

bot.recognizer(recognizer);


// this should be the first thing to show a user
bot.dialog('Help', function(session) {
    
    session.send('Hi! I\'m the Howard of Effingham Bot. <br/>You can ask me questions like:<br/> \'Who is the headTeacher?\'<br/>Or \'When does term start?\'<br/><br/>You can also manage \'ToDo\' lists by asking me to \'add to my list\' or \'show my list\'');
    session.endDialog('How can I help?');

}).triggerAction({
    matches: 'Help'
});



// dialog to process the getContact intent
bot.dialog('getContact', function(session, args) {
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
    if (headOfEnglishEntity) {
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

        session.endDialog('Oops! I didn\'t understand what you were asking for.');
    }


    console.log("entity = ", roleToFind);

    // finds if it needs to search by role or by name
    if (roleToFind) {
        // search by role
        searchByRole(roleToFind, session);
    } else if (nameToFind) {
        // search by name
        searchByName(nameToFind, session);
    } else if (timetableToFind) {
        searchByTimetable(timetableToFind, session);
    }

}).triggerAction({
    // map this dialog to the getContact intent 
    matches: 'getContact'
});

// dialog to process getContact intent
bot.dialog('getContactByName', function(session, args) {

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
    if (nameToFind) {
        // search by name
        searchByName(nameToFind, session);
    }

}).triggerAction({
    // map this dialog to the getContact intent 
    matches: 'getContactByName'
});


// dialog to process getDate intent
bot.dialog('getDate', function(session, args) {
    // retrieve all the possible entities from LUIS model

    console.log("entities returned: ", args.intent.entities);


    // date type entities
    var insetEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'inset');
    var termStartEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'termStart');
    var termEndEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'termEnd');
    var parentsEveningEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'parentsEvening');

    var dateToFind = "";

    // are any date entities set? - determines which (if any) date entities were returnded by LUIS
    if (insetEntity) {
        dateToFind = 'inset';
    } else if (termStartEntity) {
        dateToFind = 'termStart';
    } else if (parentsEveningEntity) {
        dateToFind = 'parentsEvening';
    } 
    else if (termEndEntity) {
        dateToFind = 'termEnd';
    } else {
        // no date entity set
        session.endDialog('Oops! I couldn\'t find that date');
    }

    // is the intent to find a date?
    if (dateToFind) {
        // search by date
        searchByDate(dateToFind, session);
    }

}).triggerAction({
    // map this dialog to the getDate intent 
    matches: 'getDate'
});



// dialog to process addToDo intent
bot.dialog('addToDo', [
    // Step 1 - Ask what they want to add
    function(session) {
        builder.Prompts.text(session, 'Sure we can add an item to your list. What is your name?');

        // set a flag that turns LUIS off to stop it from starting a the getcontact dialog whenn the user adds a name
        session.userData.addToDoDialog = true;

    },
    // Step 2 - Get the user's name
    function(session, results) {
        session.userData.userName = results.response;
        builder.Prompts.text(session, "Ok " + session.userData.userName + ", What would you like me to add to your to do list?");
    },
    // Step 3 - Confirm what they want to add
    function(session, results) {
        session.dialogData.newToDo = results.response;
        builder.Prompts.confirm(session, "So you want to add " + session.dialogData.newToDo + " to " + session.userData.userName + "'s to do list. Is that right?");
    },
    function(session, results) {
        console.log(results.response);
        if (results.response) {

            console.log("user wants to add a todo");
            session.endDialog("Ok, adding...");

        } else {
            // answer was no
            session.endDialog("OK. How else can I help you?");
        }

        // turn LUIS back on so that the BOT gets the intents
        session.userData.addToDoDialog = false;

    }
]).triggerAction({
    // map this dialog to the addToDo intent 
    matches: 'addToDo'
});

// dialog to process showToDo intent
bot.dialog('showToDo', [
    // Step 1 - Confirm that they want to see their list
    function(session) {
        builder.Prompts.confirm(session, 'Sure! would you like me to show you your to do list?');
    },
    function(session, results) {
        console.log(results.response);
        if (results.response) {


            if (session.userData.userName) {

                console.log("user is already known", session.userData.userName);

            } else {

                console.log("user is not known");
            }

            console.log("user wants to see the todo");
            session.endDialog("OK, showing list...");
        } else {

            // answer was no
            session.endDialog("OK. How else can I help you?");
        }
    }
]).triggerAction({
    // map this dialog to the showToDo intent 
    matches: 'showToDo'
});



// getContact intent - search contacts by role

function searchByRole(roleToFind, session) {

    databaseUtilities.findRole(roleToFind).then(function(contactsFound) {

        console.log("searchByRole contactsFound", contactsFound);

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

    databaseUtilities.findName(nameToFind).then(function(contactsFound) {

        console.log("searchByName contactsFound", contactsFound);

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
    session.send('Looking for your date...');
    //calls the findDate function in the calendarUtilities file
    calendarUtilities.findDate(dateToFind).then(function(datesFound) {

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
        .subtitle(calendarDate.start);
}

// function to display the card on the specific teacher
function contactAsAttachment(contact) {
    // initialises the card
    return new builder.HeroCard()
        // displays name of staff member on card
        .title(contact.title + ' ' + contact.lastname)
        // displays telephone and email of the staff member on the card
        .subtitle('Email : %s',  contact.email)
        .text('Telephone: %s', contact.phone_number);
}