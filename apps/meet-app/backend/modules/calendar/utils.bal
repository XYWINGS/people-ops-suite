// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import ballerina/http;
import ballerina/uuid;
import ballerinax/googleapis.calendar as gcalendar;

configurable string calendarId = ?;
configurable string disclaimerMessage = ?;

# Create an event in the calendar.
#
# + createCalendarEventRequest - Create calendar event request
# + creatorEmail - Event creator Email
# + return - JSON response if successful, else an error
public isolated function createCalendarEvent(
        CreateCalendarEventRequest createCalendarEventRequest, string creatorEmail)
returns CreateCalendarEventResponse|error {

    // WSO2 participants validation
    string:RegExp wso2EmailDomainRegex = re `^([a-zA-Z0-9_\-\.]+)(@wso2\.com|@ws02\.com)$`;
    foreach string participant in createCalendarEventRequest.wso2Participants {
        if (!wso2EmailDomainRegex.isFullMatch(participant.trim())) {
            return error("Failed to create the calendar event.");
        }
    }

    // Replace creator email with a mailto link and add separator before event description.
    string updatedDisclaimer = replaceCreatorEmail(disclaimerMessage, creatorEmail);
    string separator = string `<hr style="border: none; border-top: 2px solid #ccc; margin: 15px 0;"><br>`;
    string updatedDescription = updatedDisclaimer + separator + createCalendarEventRequest.description;

    // Format the event payload as required by the Google Calendar API.
    CreateCalendarEventPayload calendarEventPayload = {
        summary: createCalendarEventRequest.title,
        description: updatedDescription,
        'start: {
            dateTime: createCalendarEventRequest.startTime,
            timeZone: createCalendarEventRequest.timeZone
        },
        end: {
            dateTime: createCalendarEventRequest.endTime,
            timeZone: createCalendarEventRequest.timeZone
        },
        attendees: [
            ...createCalendarEventRequest.wso2Participants.map((email) => ({email: email.trim()})),
            ...createCalendarEventRequest.externalParticipants.map((email) => ({email: email.trim()}))
        ],
        guestsCanModify: true,
        conferenceData: {
            createRequest: {
                requestId: uuid:createType4AsString(),
                conferenceSolutionKey: {
                    'type: "hangoutsMeet"
                }
            }
        }
    };

    // Create the payload for the API request.
    http:Request req = new;
    json calendarEventPayloadJson = calendarEventPayload.toJson();
    req.setPayload(calendarEventPayloadJson);

    // Make the API call to create the event.
    http:Response|error response = calendarClient->post(string `/events/${calendarId}?sendUpdates=all`, req);
    if response is error {
        return error("Failed to create the calendar event.");
    }

    // Check if the event was created successfully.
    if response.statusCode == 201 {
        json responseJson = check response.getJsonPayload();
        CreateCalendarEventResponse createCalendarEventResponse = check responseJson
        .cloneWithType(CreateCalendarEventResponse);
        return createCalendarEventResponse;
    }

    return error("Failed to create the calendar event.");
}

# Delete an event from the calendar.
#
# + eventId - Event Id
# + return - JSON response if successful, else an error
public isolated function deleteCalendarEvent(string eventId) returns DeleteCalendarEventResponse|error {

    // Make the API call to delete the event.
    http:Response|error response = calendarClient->delete(string `/events/${calendarId}/${eventId}`);
    if response is error {
        return error("Failed to delete the calendar event.");
    }

    // Check if the event was deleted successfully.
    if response.statusCode == 200 {
        json responseJson = check response.getJsonPayload();
        DeleteCalendarEventResponse deleteCalendarEventResponse = check responseJson
        .cloneWithType(DeleteCalendarEventResponse);
        return deleteCalendarEventResponse;
    }

    return error("Failed to delete the calendar event.");
}

# Get an event from the calendar.
#
# + eventId - Event Id
# + return - JSON response if successful, else an error
public isolated function getCalendarEventAttachments(string eventId) returns gcalendar:Attachment[]|error? {

    // Make the API call to get the event attachments.
    http:Response|error response = calendarClient->get(string `/calendars/${calendarId}/events/${eventId}`);
    if response is error {
        return error("Failed to get calendar event attachments.");
    }

    // Check if the event attachments were fetched successfully.
    if response.statusCode == 200 {
        json responseJson = check response.getJsonPayload();
        gcalendar:Event calendarEvent = check responseJson.cloneWithType(gcalendar:Event);
        if calendarEvent.attachments is () {
            return [];
        }
        return calendarEvent.attachments;
    }

    return error("Failed to get calendar event attachments.");
}

# Replace the ${creatorEmail} placeholder with a mailto link.
#
# + message - Message with the creator email placeholder
# + creatorEmail - Event creator Email
# + return - Updated message with the creator email replaced by a mailto link
isolated function replaceCreatorEmail(string message, string creatorEmail) returns string {
    // Regex pattern to find the ${creatorEmail} placeholder
    string:RegExp pattern = re `\$\{creatorEmail\}`;

    // Replace ${creatorEmail} with <a href="mailto:creatorEmail">creatorEmail</a>
    string result = pattern.replace(message, string `<a href="mailto:${creatorEmail}">${creatorEmail}</a>`);
    return result;
}
