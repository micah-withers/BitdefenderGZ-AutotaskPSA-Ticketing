# BitdefenderGZ-AutotaskPSA-Ticketing
Listen for Bitdefender alerts and create tickets in Autotask PSA using Node.JS
AV Event-PSA Ticket Integration
Add Flag
This application runs on Node.js and listens for incoming TCP data using Express.js. It is designed to listen for push notifications from Bitdefender, identify the target device in Autotask PSA, then create a ticket using the event information. 
A) Setting Up the Application
1 - Obtain dependencies
Install npm
sudo apt install npm
Copy AV_PSA_APP (in the zip file attachment) into any directory on the device.
cd into AV_PSA_APP

Install dependencies and save them to package.js
npm install express --save
npm install body-parser --save
npm install syslog-client --save
npm install axios --save
npm install fuse.js --save
2 - Start syslog
Check if syslog is running
netstat -tnulp | grep :514
If you get a result, go to step 3
Edit syslog to listen for TCP and UDP on port 514
nano /etc/rsyslog/.conf

Uncomment the following lines:
#module(load="imudp")
#input(type="imudp" port="514")

#module(load="imtcp")
#input(type="imtcp" port="514")

Restart syslog
/etc/init.d/rsyslog restart
Check that syslog is running (i.e. port 514 is open and listening)
netstat -tunlp | grep :514
3 - Start the application
cd into the APP_ROUTE directory

Install screen to run the application when the terminal is closed

sudo apt-get install screen
Start a screen session with 'screen', or use 'screen -S' followed by a word

screen -S AV-PSA
You are now 'attached' to the screen. Start the server and feel free to close the window or press "CTRL-A", "D" to detach from the screen
node server.js ./api/config/config.json
Check that the application is still running when you detach from the screen

netstat -tnulp | grep node

Reattach to the screen with "screen -r" in any terminal
View a list of current screen sessions with "screen -ls"
Leave and close a screen session with "exit"
B) Setting up Push Events from AV
1 - Install and setup Postman
Install Postman from https://www.postman.com/downloads/
Open Postman and go to Workspaces -> My Workspace from the taskbar at the top

Click the Import button just under the taskbar to import both JSON files from AV-PSA_files "Autotask PSA API.postman_collection.json" and "Bitdefender.postman_collection.json"

See section D "Interacting with the APIs Using Postman" for usage (not needed for initial setup, only for reference)
2 - Setup push events from Bitdefender
Under Collections (on the left), expand Bitdefender and select "Set Push Event Settings"

In the opened tab, select Body under the API URL

Enter the URL:port/api in the JSON array "params" ->"serviceSettings"->"url"
The port is configured in APP_ROUTE\api\config\config.json (default is 3000) -- THIS IS THE PORT THE APP WILL LISTEN ON
Lets say the current IP for the listener is E.XAM.PLE.IP on port 3000
It is specifically listening for http requests in the "api" folder
The resulting URL is "http://E.XAM.PLE.IP:3200/api"  which is entered in the JSON body:

"params": {
        "status": 1,
        "serviceType": "jsonRPC",
        "serviceSettings": {
            "url": "http://E.XAM.PLE.IP:3000/api",
            "requireValidSslCertificate": "true",
            "authorization": "{{auth_string}}"
        },
You can change which modules' events will be pushed by changing the values in the "subscribeToEventTypes" array to "true" or "false"
"subscribeToEventTypes": { 
            "adcloud": "false", 
            "av": "true", 
            "avc": "true", 
            "dp": "true", 
            "exchange-malware": "false",
You can find the full names of each of the modules in APP_ROUTE\api\json\bdModules.json
Click SEND to the right of the API URL to set these settings
NOTE: Each push events can only be sent to one URL, so setting up another event listener would require another API key

Verify that the changes were made successfully by sending "Get Push Event Settings" in the Bitdefender folder and checking the results
3 - Test push events and application
FIRST NOTIFY THE TEAM THAT YOU ARE TESTING THE APPLICATION BY SENDING TEST AV EVENTS TO AVOID PANIC/CONFUSION

Now that the application has been started and Bitdefender is set to send events to the specified URL, we need to check that the events are actually being received and tickets are being created

Make sure that you have the application open in the terminal/command prompt and it is started

In Postman, expand the Bitdefender folder again in Collections and select "Test Push Event"
You can modify the Body however you want (different module, specific computer, etc.) then click "Send"
Postman will display the result of the test event, which should be reflected in the application window within a few minutes
The application will print some lines as it processes the event details and creates a ticket
If successful, the last line will say "Ticket created with id ..." and list the ID of the ticket
If there was a problem creating the ticket, it will write "There was a problem creating this ticket"

You can check that a ticket was created in Autotask (then mark as completed)

IF NOTHING HAPPENS -- 
Verify that the server is listening on the correct port (see APP_ROUTE\api\config\config.json for the port number)
Make sure the port (same as above) is open to external requests on the server where the application is running
Verify that rsyslog is listening on port 514
Make sure the URL was entered correctly when setting up the Push Event notifications (see section 2 - Setup push events from Bitdefender)
C) Modifying Ticket Information
1 - Ticket default values (APP_ROUTE/api/json/ticketDefaults.json)
Each of the fields in ticketDefaults.json are fields that will be submitted to Autotask to create a ticket

Most of these will stay the same across all tickets coming in from Bitdefender

Some fields will be added only when an event comes through (e.g. title, description, dueDateTime)

The subIssueType field can change depending on the values set in bdModules.json. Each event can have a subIssueType given to them instead of the default by changing the value in bdModules.json (see below).
2 - Bitdefender event modules (APP_ROUTE/api/json/bdModules.json)
Event module info is accessed in bdModules.json with the abbreviation given by Bitdefender. 

Each module as two attributes: label and subIssueType.

The label is the full name of the module in Bitdefender (e.g. "av" is the "Antimalware" module)

The subIssueType is the id of the subIssueType given to the ticket in Autotask PSA.
The default value for each module is set in ticketDefaults.json (currently 256, referring to the "Other" subIssueType). 
There may be reasons to change the default subIssueType based on a value of a key passed from Bitdefender (e.g. the "final_status" key for Antimalware/AV events could have a value of "blocked", "deleted", or "quarantined")

"subIssueType": {
            "default": "258",
            "field": "final_status",
            "list": {
                "blocked": "261",
                "deleted": "260",
                "quarantined": "259"
            }
        },
This is the subIssueType field for the AV module. The application will check the "field" value and set the subIssueType in the ticket depending on the value of "final_status". If the final_status is not one of those values, the subIssueType will be set to the default value (258 in this case refers to the "Virus" subIssueType)

An additional attribute can be added to each module to determine the order of information presented in the ticket's description.
"sort_order": ["TestEvent","Malware Type","Malware Name","Final Status","Module","Computer Name","Timestamp"],
Andrew wanted to see useful information at the top of the description or the short description when browsing tickets. 
The AV module includes fields such as Malware Type, Malware Name, Computer Id, Endpoint Id, etc. 
You can choose which values you see first and what order they are in by creating the "sort_order" key and an array containing the names of each field. 
Any fields that are not included will appear after the indicated fields in no particular order. There is no need to include every field in the sort order array. 
D) Interacting with the APIs Using Postman
1 - Autotask PSA
All Companies
Returns list of active companies in PSA along with their IDs
Company Entity Info Fields
Returns list of company attributes
All Configuration Items (devices)
Returns list of all active devices along with their ID, company ID, hostname, external IP, and internal IP
The other fields can be included or excluded (see Configuration Item Entity Info Fields below)
Configuration Item Entity Info Fields
Returns list of configuration item attributes
All Tickets with specific issue type
Returns list of tickets associated with a specified issue type
Default is '20' referring to AV issues
Ticket EntityInformation (values for all ticket fields)
Returns list of all ticket attributes along with their IDs
These fields can be added to tickets in the application when creating new tickets
Ticket Billing Codes (for billingCodeID)
Returns list of billing codes to be associated with tickets upon creation
2 - Bitdefender
API Key Details
Returns a list of APIs that the current API key has access to
Test Push Event
Sends a test event with specified computer name, IP, ID, and other associated information
Any field in the "data" array in the Body of the request can be changed
Set Push Event Settings
Sets the URL that events will be pushed to and which modules will be pushed
Change the values of the modules in the "subscribeToEventTypes" array to true or false to send/ignore events
Get Push Event Settings
Retrieves the current settings for push events including the URL the events are being sent to along with which modules are subscribed
Company by id
Returns the information about the company with the ID provided in the JSON Body
Useful for debugging if the company of the device could not be determined by the application
Managed Endpoint by id
Returns information pertaining to an the endpoint associated with the ID provided in the JSON Body
Useful for debugging when the computer/company could not be identified by the application
