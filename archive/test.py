from os import mkdir, path, environ
from os.path import join, dirname
from datetime import datetime, timedelta
import argparse

#from httplib2 import Http

#from apiclient import discovery

from oauth2client.file import Storage
from oauth2client import client
from oauth2client import tools

#from dotenv import load_dotenv
from slackclient import SlackClient
import datetime

import time


SCOPES = 'https://www.googleapis.com/auth/calendar'
#CLIENT_SECRET_FILE = 'client_secrets.json'
APPLICATION_NAME = 'starterbot'
#SHEET_ID = 'REDACTED'
CALENDAR_ID = 'bkvgf1vstf9qv7u7e4ve6h6ffc@group.calendar.google.com'


def add_event(event_name, service, start_date):
    """Adds an event to the google calendar with the given name.

    Args:
        event_name (str): the name of the calendar event
        service    (obj): the google calendar api service
    """
    end_date = start_date

    description = """If unreachable, please contact either:

    foo bar: foo@bar.com (555) 555-5555
    bar foo: bar@foo.com (555) 555-5555"""

    event = {
        'summary': event_name + ' On Call',
        'start': {
            #'date': datetime.strftime(start_date, "%Y-%m-%d")
            'date': datetime.datetime.strptime(start_date, "%Y-%m-%d")
        },
        'end': {
            #'date': datetime.strftime(end_date, "%Y-%m-%d")
            'date': datetime.datetime.strptime(end_date, "%Y-%m-%d")
        },
        'description': description
    }

    event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()


add_event('test1', SCOPES, '2018-12-27')

