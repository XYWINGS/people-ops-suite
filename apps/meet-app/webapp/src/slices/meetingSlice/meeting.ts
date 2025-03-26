// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { State } from "../../types/types";
import { APIService } from "@utils/apiService";
import { AppConfig } from "@config/config";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { SnackMessage } from "@config/constant";
import axios, { HttpStatusCode } from "axios";

interface MeetingState {
  state: State;
  submitState: State;
  stateMessage: string | null;
  errorMessage: string | null;
  meetings: Meetings | null;
  meetingTypes: string[] | null;
  backgroundProcess: boolean;
  backgroundProcessMessage: string | null;
}

const initialState: MeetingState = {
  state: State.idle,
  submitState: State.idle,
  stateMessage: "",
  errorMessage: "",
  meetings: null,
  meetingTypes: null,
  backgroundProcess: false,
  backgroundProcessMessage: null,
}

export interface MeetingTypes {
  domain: string;
  types: string[];
}

export const fetchMeetingTypes = createAsyncThunk(
  "meeting/fetchMeetingTypes",
  async (_, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<MeetingTypes>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.meetingTypes, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            return rejectWithValue("Request canceled");
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchMeetingTypes
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response.data.message);
        });
    });
  }
)

export interface AddMeetingPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  wso2Participants: string[];
  externalParticipants: string[];
}

export const addMeetings = createAsyncThunk(
  "meeting/addMeetings",
  async (payload: AddMeetingPayload, { dispatch }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<AddMeetingPayload>((resolve, reject) => {
      APIService.getInstance()
        .post(AppConfig.serviceUrls.meetings, payload, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          dispatch(
            enqueueSnackbarMessage({
              message: SnackMessage.success.addMeetings,
              type: "success",
            })
          );
          resolve(response.data);
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            (error.response?.status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.addMeetings
              : "An unknown error occurred.");
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            })
          );
          reject(error);
        });
    });
  }
)

interface Meetings {
  count: number;
  meetings: Meeting[];
}

export interface Meeting {
  meetingId: number;
  title: string;
  googleEventId: string;
  host: string;
  startTime: string;
  endTime: string;
  wso2Participants: string;
  meetingStatus: string;
}

export const fetchMeetings = createAsyncThunk(
  "meeting/fetchMeetings",
  async ({ limit, offset }: { limit: number; offset: number }, { dispatch }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<Meetings>((resolve, reject) => {
      APIService.getInstance()
        .get(AppConfig.serviceUrls.meetings, {
          params: { limit, offset },
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            (error.response?.status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.fetchMeetings
              : "An unknown error occurred.");
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            })
          );
          reject(error);
        });
    });
  }
);

export interface DeleteMeeting {
  message: string;
}

export const deleteMeeting = createAsyncThunk(
  "meeting/deleteMeeting",
  async (meetingId: number, { dispatch }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<DeleteMeeting>((resolve, reject) => {
      APIService.getInstance()
        .delete(`${AppConfig.serviceUrls.meetings}/${meetingId}`, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          dispatch(
            enqueueSnackbarMessage({
              message: SnackMessage.success.deleteMeeting,
              type: "success",
            })
          );
          resolve(response.data);
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.message ||
            (error.response?.status === HttpStatusCode.InternalServerError
              ? SnackMessage.error.deleteMeeting
              : "An unknown error occurred.");
          dispatch(
            enqueueSnackbarMessage({
              message: errorMessage,
              type: "error",
            })
          );
          reject(error);
        });
    });
  }
)

interface Attachment {
  fileUrl: string;
  title: string;
  mimeType: string;
  iconLink: string;
  fileId: string;
}

interface Attachments {
  attachments: Attachment[];
}

export const fetchAttachments = createAsyncThunk(
  "meeting/fetchAttachments",
  async (meetingId: number, { dispatch, rejectWithValue }) => {
    APIService.getCancelToken().cancel();
    const newCancelTokenSource = APIService.updateCancelToken();
    return new Promise<Attachments>((resolve, reject) => {
      APIService.getInstance()
        .get(`${AppConfig.serviceUrls.meetings}/${meetingId}/attachments`, {
          cancelToken: newCancelTokenSource.token,
        })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          if (axios.isCancel(error)) {
            return rejectWithValue("Request canceled");
          }
          dispatch(
            enqueueSnackbarMessage({
              message:
                error.response?.status === HttpStatusCode.InternalServerError
                  ? SnackMessage.error.fetchAttachments
                  : "An unknown error occurred.",
              type: "error",
            })
          );
          reject(error.response.data.message);
        });
    });
  }
)

const MeetingSlice = createSlice({
  name: "meeting",
  initialState,
  reducers: {
    resetSubmitSate(state) {
      state.submitState = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeetingTypes.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching meeting types...";
      })
      .addCase(fetchMeetingTypes.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.meetingTypes = action.payload.types;
      })
      .addCase(fetchMeetingTypes.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(addMeetings.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Creating meetings...";
      })
      .addCase(addMeetings.fulfilled, (state) => {
        state.submitState = State.success;
        state.stateMessage = "Successfully created!";
      })
      .addCase(addMeetings.rejected, (state, action) => {
        state.submitState = State.failed;
        state.stateMessage = "Failed to create!";
      })
      .addCase(fetchMeetings.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching meetings...";
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched!";
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch!";
      })
      .addCase(deleteMeeting.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Deleting meeting...";
      })
      .addCase(deleteMeeting.fulfilled, (state) => {
        state.submitState = State.success;
        state.stateMessage = "Successfully deleted!";
      })
      .addCase(deleteMeeting.rejected, (state) => {
        state.submitState = State.failed;
        state.stateMessage = "Failed to delete!";
      })
      .addCase(fetchAttachments.pending, (state) => {
        state.submitState = State.loading;
        state.stateMessage = "Fetching attachments...";
      })
      .addCase(fetchAttachments.fulfilled, (state) => {
        state.submitState = State.success;
        state.stateMessage = "Successfully fetched!";
      })
      .addCase(fetchAttachments.rejected, (state) => {
        state.submitState = State.failed;
        state.stateMessage = "Failed to fetch!";
      })

      ;
  },
});

export const { resetSubmitSate } = MeetingSlice.actions;
export default MeetingSlice.reducer;
