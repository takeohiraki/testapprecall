from os import mkdir, path, environ
from os.path import join, dirname
from datetime import datetime, timedelta
import argparse

from httplib2 import Http

from apiclient import discovery

from oauth2client.file import Storage
from oauth2client import client
from oauth2client import tools

from dotenv import load_dotenv
from slackclient import SlackClient

# try getting flags (if any, not sure what this does)
#FLAGS = None

# scopes and google stuff
#SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/spreadsheets'
#CLIENT_SECRET_FILE = 'client_secrets.json'
APPLICATION_NAME = 'starterbot'
#SHEET_ID = 'REDACTED'
CALENDAR_ID = 'bkvgf1vstf9qv7u7e4ve6h6ffc@group.calendar.google.com'

# load variables from .env file
DOTENV_PATH = join(dirname(__file__), '.env')
load_dotenv(DOTENV_PATH)

# set slack authentication constants

export SLACK_TOKEN='xoxb-511646391078-510247720194-wGXewnNxeJeGKsc7dEKb0XgF'
SLACK_TOKEN = environ.get("SLACK_TOKEN")
SLACK_CLIENT = SlackClient(SLACK_TOKEN)

def get_credentials():
    """Gets valid user credentials from storage.

    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    Returns:
        Credentials, the obtained credential.
    """
    home_dir = path.expanduser('~')
    #credential_dir = path.join(home_dir, '.credentials')
    #if not path.exists(credential_dir):
    #    mkdir(credential_dir)
    #credential_path = path.join(credential_dir,'calendar-python-quickstart.json')
    credential_path = '/Users/takeo/Desktop/slack_test_app/calendar-quickstart.py'

    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if FLAGS:
            credentials = tools.run_flow(flow, store, FLAGS)
        print 'Storing credentials to ' + credential_path
    return credentials

def add_event(event_name, service, start_date):
    """Adds an event to the google calendar with the given name.

    Args:
        event_name (str): the name of the calendar event
        service    (obj): the google calendar api service
    """
    end_date = start_date + timedelta((2 - start_date.weekday()) % 7 + 1)

    description = """If unreachable, please contact either:

    foo bar: foo@bar.com (555) 555-5555
    bar foo: bar@foo.com (555) 555-5555"""

    event = {
        'summary': event_name + ' On Call',
        'start': {
            'date': datetime.strftime(start_date, "%Y-%m-%d")
        },
        'end': {
            'date': datetime.strftime(end_date, "%Y-%m-%d")
        },
        'description': description
    }

    event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()




def del_all_events(service):
    """Deletes all on-call events from the current time onwards.

    Args:
        service (obj): the Google Calendar API service
    """
    cur_time = datetime.utcnow().isoformat("T") + "Z"
    events_list = service.events().list(calendarId=CALENDAR_ID,
                                        timeMin=cur_time, q='On Call').execute()['items']
    on_call_events = [event for event in events_list if event['creator']['email'] == 'hello@niceday.com']

    for event in on_call_events:
        event_id = event['id']
        service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()

    print "All events successfully deleted."

def rotate_names_in_sheet(value_range, service):
    """Rotates a given column of cells in the Google Spreadsheet using Google's API.

    Args:
        value_range (obj): a ValueRange object from the Google Spreadsheet
        service     (obj): the Google API service object

    Returns:
        The list of names, after having been rotated.
    """
    values = value_range.get('values', [])

    # rotate the list
    values = values[1:] + values[:1]

    # create new ValueRange instance
    request_data = {
        "values": values
    }

    service.spreadsheets().values().update(
        spreadsheetId=SHEET_ID, range='A2:C', valueInputOption='USER_ENTERED', body=request_data
    ).execute()

    return [value[0] for value in values]

def send_message(channel_id, message_text, user):
    """Sends the given message to the given slack channel.

    Args:
        channel_id   (str): the ID of the channel to post a message in
        message_text (str): the message text to send_message
        user         (bool): is the message sender a user or not

    The user argument determines if the message will be sent as a bot or as the
    currently authorized user.
    """
    if not user:
        SLACK_CLIENT.api_call(
            "chat.postMessage",
            channel=channel_id,
            text=message_text,
            username='Not_A_Robot',
            as_user=user,
            icon_emoji=':robot_face:'
        )
    else:
        SLACK_CLIENT.api_call(
            "chat.postMessage",
            channel=channel_id,
            text=message_text,
            as_user=user
        )

def list_channels():
    """Lists all the private message channels of the authorized user"""
    channels_call = SLACK_CLIENT.api_call("groups.list")
    if channels_call['ok']:
        return channels_call['groups']
    return None

def ping_slack(on_call_name, chan_list):
    """Pings a Slack channel with to alert the channel with the new on call engineer.

    Args:
        on_call_name (str): the name of the new on call engineer
        chan_list    (str): the list of channels as a json object
    """
    names = []
    channel_ids = []

    for chan in chan_list:
        names.append(chan['name'])
        channel_ids.append(chan['id'])

    channels_dict = dict(zip(names, channel_ids))
    send_message(channels_dict['on_call_engineers'],
                 on_call_name + " is on call for this week.", False)

def main():
    """Rotates names of on call engineers in a Google Spreadsheet and updates/notifies the team.

    Uses Google's calendar and sheets API as well as Slack's API to alert a Slack channel.
    """

    # google shizz
    creds = get_credentials()

    http = creds.authorize(Http())
    calendar = discovery.build('calendar', 'v3', http=http)
    sheets = discovery.build('sheets', 'v4', http=http)

    value_range = sheets.spreadsheets().values().get(
        spreadsheetId=SHEET_ID, range='A2:C'
    ).execute()

    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-u', '--update', help='rotate and update/notify', action='store_true')
    group.add_argument('-c', '--clear',
                       help='clears all on-call events from future', action='store_true')

    args = parser.parse_args()

    if args.clear or args.update:
        del_all_events(calendar)

    if args.update:
        list_of_names = rotate_names_in_sheet(value_range, sheets)
        print "List rotated, current new on call is: " + list_of_names[0]
        start_date = datetime.today()
        # display events for next cycle
        for name in list_of_names:
            add_event(name, calendar, start_date)
            start_date = start_date + timedelta((2 - start_date.weekday()) % 7 + 1)

        # slack shizz
        channels = list_channels()
        ping_slack(list_of_names[0], channels)

if __name__ == "__main__":
    main()