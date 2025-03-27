// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License. 
import ballerina/sql;

# Fetch meeting types.
#
# + domain - meeting domain
# + return - Meeting | Error, if not found
public isolated function fetchMeetingTypes(string domain) returns MeetingTypes|error? {
    RawMeetingTypes|sql:Error meetingTypes = databaseClient->queryRow(getMeetingTypesQuery(domain));

    if meetingTypes is sql:Error && meetingTypes is sql:NoRowsError {
        return;
    }
    if meetingTypes is sql:Error {
        return meetingTypes;
    }

    // Convert the types field (comma-separated) into a string array.
    string:RegExp r = re `,`;
    string[] types = r.split(meetingTypes.types).map(str => str.trim());

    return {
        domain: meetingTypes.domain,
        types
    };
}

# Create new meeting.
#
# + addMeetingPayload - Meeting details
# + createdBy - Person who created the meeting
# + return - Id of the meeting | Error
public isolated function addMeeting(AddMeetingPayload addMeetingPayload, string createdBy) returns int|error {
    sql:ExecutionResult executionResults = check databaseClient->execute(
        addMeetingQuery(addMeetingPayload, createdBy));
    return executionResults.lastInsertId.ensureType(int);
}

# Fetch meetings.
#
# + title - Name to filter  
# + host - Host email filter  
# + startTime - Start time filter  
# + endTime - End time filter  
# + wso2Participants - WSO2 participants filter
# + 'limit - Limit of the response
# + offset - Offset of the number of meetings to retrieve  
# + return - List of meetings | Error
public isolated function fetchMeetings(string? title, string? host, string? startTime, string? endTime,
        string? wso2Participants, int? 'limit, int? offset) returns Meeting[]|error {

    stream<Meeting, error?> resultStream = databaseClient->
                query(getMeetingsQuery(title, host, startTime, endTime, wso2Participants, 'limit, offset));

    Meeting[] meetings = [];

    check from Meeting meeting in resultStream
        do {
            meetings.push(meeting);
        };

    return meetings;
}

# Fetch specific meeting.
#
# + meetingId - The ID of the meeting to fetch
# + return - Meeting | Error, if not found
public isolated function fetchMeeting(int meetingId) returns Meeting|error? {
    Meeting|sql:Error meeting = databaseClient->queryRow(getMeetingQuery(meetingId));
    if meeting is sql:Error && meeting is sql:NoRowsError {
        return;
    }
    return meeting;
}

# Cancels a meeting by updating its status to 'CANCELLED'.
#
# + meetingId - The ID of the meeting to cancel
# + return - Id of the cancelled meeting|Error
public isolated function cancelMeeting(int meetingId) returns int|error {
    sql:ExecutionResult _ = check databaseClient->execute(cancelMeetingStatusQuery(meetingId));
    return meetingId.ensureType(int);
}
