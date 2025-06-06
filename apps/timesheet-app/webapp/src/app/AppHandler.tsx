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

import Error from "../layout/pages/404";
import MaintenancePage from "../layout/pages/Maintenance";
import { getActiveRoutesV2, routes } from "../route";
import Layout from "../layout/Layout";
import { RootState, useAppSelector } from "@slices/store";
import PreLoader from "@component/common/PreLoader";
import ErrorHandler from "@component/common/ErrorHandler";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { selectRoles } from "@slices/userSlice/user";

const AppHandler = () => {
  const auth = useAppSelector((state: RootState) => state.auth);
  const roles = useAppSelector(selectRoles)

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <Error />,
      children: getActiveRoutesV2(routes, roles),
    },
  ]);

  return (
    <>
      {auth.status === "loading" && (
        <PreLoader isLoading={true} message={auth.statusMessage}></PreLoader>
      )}
      {auth.status === "success" && auth.mode === "active" && (
        <RouterProvider router={router} />
      )}
      {auth.status === "success" && auth.mode === "maintenance" && (
        <MaintenancePage />
      )}
      {auth.status === "failed" && (
        <ErrorHandler
          message={"Sometimes went wrong while authenticating the user :("}
        />
      )}
    </>
  );
};

export default AppHandler;
