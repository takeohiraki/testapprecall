var Bot = require('slackbots');
var request = require('request');

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

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
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
  
  /**
   * Lists the next 10 events on the user's primary calendar.
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listEvents(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const events = res.data.items;
      if (events.length) {
        console.log('Upcoming 10 events:');
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
        });
      } else {
        console.log('No upcoming events found.');
      }
    });
  }