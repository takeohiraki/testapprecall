var Bot = require('slackbots');
var request = require('request');

var fs = require('fs');
var readline = require('readline');
//var google = require('googleapis');
//var googleAuth = require('google-auth-library');

//const {google} = require('googleapis');
//const OAuth2 = google.auth.OAuth2;


// if you're using Node 6+, you might find this convenient:
const {GoogleAuth, JWT, OAuth2Client} = require('google-auth-library')
const gal = require('google-auth-library');
const auth = new gal.GoogleAuth();
const jwtClient = new gal.JWT();
const oAuth2Client = new gal.OAuth2Client();



var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = '/Users/takeo/Desktop/slack_test_app';
//var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';
//var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.js';
var TOKEN_PATH = TOKEN_DIR + 'credentials.json';


//settings
var settings = {

     token: 'xoxb-511646391078-510247720194-wGXewnNxeJeGKsc7dEKb0XgF',
     name: 'testapp'
};

var channel='starterbot-test' ;

var bot = new Bot(settings);

bot.on('start', function(){
               
               bot.postMessageToChannel(channel, 'Hello Channel. I am successfuly connected');

              }
     );


bot.on('message',  function(message){
                 
            if(message.type === 'message' && Boolean(message.text))
            {
            	console.log(message.channel);
            	if(typeof message.channel === 'string'  && message.channel[0] === 'C')
            	{
            		console.log(message.text.toLowerCase());
            		if(message.text.toLowerCase().indexOf('@uf079m65q') > -1 )
            		{
            			var command = message.text.toLowerCase();
            			var commandType = getCommandType(command);
            			switch(commandType)
            			{
            				case 'drawchart':
            								   console.log('attempting to get chart answer');
                                               var answer = getChartAnswer(command);
                                               bot.postMessageToChannel(channel, answer);
            				                   break;
            				case 'showgitstats':
            								   console.log('attempting to show git stats answer');
                                                getGitStatsAnswer(command);
                          	                   break;

                            case 'showevents':
            								   console.log('attempting to show team events');
                                                getEventsAnswers(command);
                                                 break;

            				default:
                                     bot.postMessageToChannel(channel, "Hey there ! welcome to bot world");
                                     break;

            			}
            			
            		}
            		
            	}
            }
               

     }); 


 function getCommandType(command)    
 {
    if(command.indexOf('draw chart')>-1)  
    	return "drawchart";
    if(command.indexOf('show github top contributor stats')>-1)  
    	return "showgitstats";

    if(command.indexOf('show team events')>-1)  
    	return "showevents";



 }

 function getEventsAnswers(command)
 {
     getEvents();
 }



 function getChartAnswer(command)
 {
      //command : '@funbot draw chart type:pi data:{60,40,20} legends:{USA,UK,Russia}';
      var answer = "";
      var data = command.split(/ /i);
      var chartType = data[3].split(/:/i)[1];
      switch(chartType)
      {
          case 'pi':
                    chartType = 'p3';
                    break; 
          case 'line':
                    chartType = 'lc';
                    break; 
          case 'bar':
                    chartType = 'bvg';
                    break; 

      }
      console.log('chartType is ' + chartType);
      var chartData = data[4].split(/:/i)[1].replace('{','').replace('}','');
      console.log('chartData is ' + chartData);
      var legends = data[5].split(/:/i)[1].replace('{','').replace('}','').replace(/,/gi,'|');
	  console.log('legends is ' + legends);
      var urlFormat = 'https://chart.googleapis.com/chart?cht={0}&chs=250x100&chd=t:{1}&chl={2}';

      answer = urlFormat.replace('{0}',chartType).replace('{1}', chartData).replace('{2}', legends);
      console.log('answer is ' + answer);
      //Chart URL: https://chart.googleapis.com/chart?cht=p3&chs=250x100&chd=t:60,40,20&chl=USA|UK|Russia    

      return answer;

 }

 var options = {
       url: 'https://api.github.com/repos/{0}/contributors',
       headers: {
       	    'User-Agent':'request'
       }
 };

 
 

 function getGitStatsAnswer(command)
 {
      //command : '@funbot show github top contributor stats repo:facebook/stats';
      var answer = "";
      var data = command.split(/ /i);
      console.log("data is " + data);
      var repo = data[6].split(/:/i)[1];
      console.log("repo is " + repo);
      console.log("inside git answer") ;
      console.log("url before " + options.url );
      var localUrl = options.url.replace('{0}', repo);
      console.log("url after " + localUrl );

      options = {
       url: localUrl,
       headers: {
       	    'User-Agent':'request'
                }
       };

      request(options, function(error, response, body)
                {
                	 console.log(response) // Show the HTML for the Google homepage. 
				    var profile = JSON.parse(response.body);
				    //var profile = response;
				    console.log("profile2 " + profile);
				    var cntr=0;
				    for (var myKey in profile)
				    { 
				    	console.log(profile[myKey].avatar_url, profile[myKey].contributions,profile[myKey].login); 
				        var st = 'Name-{0} Contributions-{1}  image- {2}';
				        st = st.replace('{0}', profile[myKey].login).replace('{1}',profile[myKey].contributions).replace('{2}',profile[myKey].avatar_url) ;    
				    	console.log(st);
				    	bot.postMessageToChannel(channel, st);
				    	cntr++;
				    	if(cntr >= 5)
				    	{
				    	  break;
				    	}
				    }

                }

      	);



     
      

 }




function getEvents()
{
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
     if (err) {
                  console.log('Error loading client secret file: ' + err);
                   return;
               }
                // Authorize a client with the loaded credentials, then call the
           // Google Calendar API.
           authorize(JSON.parse(content),listEvents, getResult);


      });
}


function getResult(result)
{
  console.log(result);
  return result;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, cb2) {
  
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  //var auth = new googleAuth();
  console.log('****' + clientId + ' ' + clientSecret + '********')
  //var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  var result = ''; 
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, cb2);
    }
  });
  
  
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, fn) {
  var calendar = google.calendar('v3');
  var result = '';
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        var currentEvent = event.summary.trim().toLowerCase();
        if( (currentEvent.length!=0) && (currentEvent != 'no meeting day'))
        {
       	  result += start + ' - ' + currentEvent + '\n';
       	  console.log('%s - %s', start, event.summary);
        }
      }
      console.log(result);
      bot.postMessageToChannel(channel, result);
    }
    
  });

}
