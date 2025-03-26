// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@slices/store";
import { AuthState, AuthData, Role } from "@utils/types";
import { State } from "@/types/types";
import { AppConfig } from "@config/config";
import { APIService } from "@utils/apiService";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { SnackMessage } from "@config/constant"

const initialState: AuthState = {
  status: State.idle,
  mode: "active",
  statusMessage: null,
  isAuthenticated: false,
  userInfo: null,
  decodedIdToken: null,
  roles: [],
};

export const loadPrivileges = createAsyncThunk("auth/loadPrivileges", async (_, { dispatch, rejectWithValue }) => {
  return new Promise<{
    roles: Role[]
  }>((resolve, reject) => {
    APIService.getInstance()
      .get(AppConfig.serviceUrls.userInfo)
      .then((resp) => {
        const userPrivileges: number[] = resp.data.privileges;
        const roles: Role[] = [];
        if (userPrivileges.includes(762)) {
          roles.push(Role.SALES_ADMIN);
        }
        if (userPrivileges.includes(987)) {
          roles.push(Role.SALES_TEAM);
        }
        if (roles.length === 0) {
          dispatch(
            enqueueSnackbarMessage({
              message: "Insufficient privileges",
              type: "error",
            })
          );
          rejectWithValue("No roles found");
        }
        resolve({ roles });
      })
      .catch((error) => {
        const errorMessage = SnackMessage.error.fetchPrivileges;
        dispatch(
          enqueueSnackbarMessage({
            message: errorMessage,
            type: "error",
          })
        );
        reject(error);
      });
  });
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserAuthData: (state, action: PayloadAction<AuthData>) => {
      state.userInfo = action.payload.userInfo;
      state.decodedIdToken = action.payload.decodedIdToken;
      state.status = State.success;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPrivileges.pending, (state) => {
        state.status = State.loading;
      })
      .addCase(loadPrivileges.fulfilled, (state, action) => {
        state.status = State.success;
        state.roles = action.payload.roles
      })
      .addCase(loadPrivileges.rejected, (state, action) => {
        state.status = State.failed;
      });
  },
});



export const { setUserAuthData } = authSlice.actions;
export const selectUserInfo = (state: RootState) => state.auth.userInfo;
export const selectRoles = (state: RootState) => state.auth.roles;
export default authSlice.reducer;
