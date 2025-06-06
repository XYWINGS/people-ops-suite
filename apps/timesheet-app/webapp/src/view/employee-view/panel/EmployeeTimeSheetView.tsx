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
import {
  Box,
  Chip,
  Grid,
  Stack,
  Paper,
  Dialog,
  Button,
  Switch,
  Tooltip,
  useTheme,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  FormControlLabel,
} from "@mui/material";
import {
  DataGrid,
  GridFilterModel,
  GridLogicOperator,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  State,
  Filter,
  TimesheetRecord,
  TimesheetStatus,
  TimesheetUpdate,
  ConfirmationType,
  statusChipStyles,
} from "@utils/types";
import { useEffect, useState } from "react";
import { Messages } from "@config/constant";
import noDataIcon from "@images/no-data.svg";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import notFoundIcon from "@images/not-found.svg";
import CloseIcon from "@mui/icons-material/Close";
import { DEFAULT_PAGE_SIZE } from "@config/config";
import LoadingButton from "@mui/lab/LoadingButton";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FilterComponent from "@component/common/FilterModal";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import { useAppDispatch, useAppSelector } from "@slices/store";
import SubmitRecordModal from "../components/SubmitRecordModal";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InformationHeader from "@component/common/InformationHeader";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CustomModal } from "@component/common/CustomComponentModal";
import { useConfirmationModalContext } from "@context/DialogContext";
import { differenceInMinutes, format, isWeekend, parseISO } from "date-fns";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import InformationHeaderSkeleton from "@component/common/InformationHeaderSkeleton";
import StateWithImage, { StateWithImageFunction } from "@component/ui/StateWithImage";
import { fetchTimesheetRecords, resetTimesheetRecords, updateTimesheetRecord } from "@slices/recordSlice/record";

const EmployeeTimeSheetView = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const handleOpenDialog = () => setOpenDialog(true);
  const dialogContext = useConfirmationModalContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const userEmail = useAppSelector((state) => state.auth.userInfo?.email);
  const submitState = useAppSelector((state) => state.timesheetRecord.submitState);
  const workPolicies = useAppSelector((state) => state.user.userInfo?.workPolicies);
  const [errors, setErrors] = useState<Partial<Record<keyof TimesheetRecord, string>>>({});
  const recordLoadingState = useAppSelector((state) => state.timesheetRecord.retrievingState);
  const timesheetLoadingInfo = useAppSelector((state) => state.timesheetRecord.retrievingState);
  const records = useAppSelector((state) => state.timesheetRecord.timesheetData?.timeLogs || []);
  const timesheetInfo = useAppSelector((state) => state.timesheetRecord.timesheetData?.timesheetStats);
  const regularLunchHoursPerDay = useAppSelector((state) => state.user.userInfo?.workPolicies.lunchHoursPerDay);
  const totalRecordCount = useAppSelector((state) => state.timesheetRecord.timesheetData?.totalRecordCount || 0);
  const regularWorkHoursPerDay = useAppSelector((state) => state.user.userInfo?.workPolicies.workingHoursPerDay);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const columns = [
    {
      field: "recordDate",
      headerName: "Date",
      flex: 0.8,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Stack direction="row" alignItems="center" gap={1}>
          <CalendarMonthIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.row.recordDate}</Typography>
        </Stack>
      ),
    },
    {
      field: "clockInTime",
      headerName: "Clock In",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Stack direction="row" alignItems="center" gap={1}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.row.clockInTime}</Typography>
        </Stack>
      ),
    },
    {
      field: "clockOutTime",
      headerName: "Clock Out",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Stack direction="row" alignItems="center" gap={1}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.row.clockOutTime}</Typography>
        </Stack>
      ),
    },
    {
      field: "isLunchIncluded",
      headerName: "Lunch",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Stack direction="row" alignItems="center" gap={1}>
          <LunchDiningIcon fontSize="small" color={params.row.isLunchIncluded ? "success" : "error"} />
          <Typography variant="body2">{params.row.isLunchIncluded ? "Yes" : "No"}</Typography>
        </Stack>
      ),
    },
    {
      field: "overtimeDuration",
      headerName: "Overtime Duration & Reason",
      flex: 2,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
          {params.row.overtimeDuration > 0 && (
            <Chip
              label={`${params.row.overtimeDuration}h`}
              color="primary"
              size="small"
              sx={{ mr: 2, width: "50px" }}
              variant="outlined"
            />
          )}
          {params.row.overtimeDuration > 0 && (
            <Tooltip title={params.row.overtimeReason}>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-all",
                }}
              >
                {params.row.overtimeReason}
              </Typography>
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: "overtimeRejectReason",
      headerName: "OT Rejection Reason",
      flex: 2,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <>
          {params.row.timeLogStatus === TimesheetStatus.REJECTED && (
            <Tooltip title={params.row.overtimeRejectReason}>
              <Typography
                color="text.secondary"
                noWrap
                variant="body2"
                sx={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-all",
                }}
              >
                {params.row.overtimeRejectReason}
              </Typography>
            </Tooltip>
          )}
        </>
      ),
    },
    {
      field: "recordStatus",
      headerName: "Status",
      flex: 1,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Chip
          icon={statusChipStyles[params.row.timeLogStatus as TimesheetStatus].icon}
          label={params.row.timeLogStatus}
          color={
            statusChipStyles[params.row.timeLogStatus as TimesheetStatus].color as "success" | "error" | "warning"
          }
          variant="outlined"
          size="small"
          sx={{ width: "110px" }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params: GridRenderCellParams<TimesheetRecord>) => (
        <Stack direction="row">
          {params.row.timeLogStatus === TimesheetStatus.PENDING && (
            <Tooltip title="Edit">
              <span>
                <IconButton size="small" color="primary" onClick={() => openEditDialog(params.row)} sx={{ mr: 1 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const availableFields = [
    {
      field: "status",
      label: "Status",
      type: "select",
      options: Object.values(TimesheetStatus),
    },
    { field: "rangeStart", label: "Start Date", type: "date" },
    { field: "rangeEnd", label: "End Date", type: "date" },
  ];

  useEffect(() => {
    if (!userEmail) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    logicOperator: GridLogicOperator.And,
    quickFilterValues: [],
  });

  const fetchData = async () => {
    if (!userEmail) return;

    const filterParams = filters.reduce((acc, filter) => {
      return { ...acc, [filter.field]: filter.value };
    }, {});

    dispatch(
      fetchTimesheetRecords({
        employeeEmail: userEmail,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
        ...filterParams,
      })
    );
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    fetchDefaultData();
  };

  const fetchDefaultData = async () => {
    if (!userEmail) return;
    dispatch(
      fetchTimesheetRecords({
        employeeEmail: userEmail,
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
      })
    );
  };

  const handleResetFilters = () => {
    fetchDefaultData();
    setFilters([]);
  };

  const handleEditFieldChange = (field: keyof TimesheetRecord, value: any) => {
    if (editingEntry) {
      const updatedEntry = {
        ...editingEntry,
        [field]: value,
      };
      if (["recordDate", "clockInTime", "clockOutTime", "isLunchIncluded"].includes(field)) {
        setEditingEntry(calculateOvertime(updatedEntry));
      } else {
        setEditingEntry(updatedEntry);
      }
    }
  };

  const calculateOvertime = (entry: TimesheetRecord): TimesheetRecord => {
    if (!(entry.clockInTime && entry.clockOutTime && entry.recordDate)) return entry;

    const totalMinutes = differenceInMinutes(entry.clockOutTime, entry.clockInTime);
    const lunchBreakMinutes = entry.isLunchIncluded ? (regularLunchHoursPerDay ?? 0) * 60 : 0;
    const regularWorkMinutes = (regularWorkHoursPerDay ?? 8) * 60;
    const workMinutes = Math.max(0, totalMinutes - lunchBreakMinutes);
    const overtimeMinutes = isWeekend(entry.recordDate) ? totalMinutes : Math.max(0, workMinutes - regularWorkMinutes);

    return {
      ...entry,
      overtimeDuration: parseFloat((overtimeMinutes / 60).toFixed(2)),
      overtimeReason:
        overtimeMinutes > 0 ? entry.overtimeReason ?? (isWeekend(entry.recordDate) ? "Weekend work" : "") : "",
    };
  };

  const openEditDialog = (entry: TimesheetRecord) => {
    setEditingEntry({
      ...entry,
      recordDate: parseISO(entry.recordDate.toString()),
      clockInTime: parseISO(`1970-01-01T${entry.clockInTime}`),
      clockOutTime: parseISO(`1970-01-01T${entry.clockOutTime}`),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEditedLogs = () => {
    dialogContext.showConfirmation(
      "Do you want to save the changes?",
      "",
      ConfirmationType.send,
      () => {
        handleSaveEditedEntry();
      },
      "Yes",
      "No"
    );
  };

  const handleSaveEditedEntry = async () => {
    if (!editingEntry) return;

    const newErrors: Partial<Record<keyof TimesheetRecord, string>> = {};

    if (!editingEntry.recordDate) {
      newErrors.recordDate = "Date is required";
    }

    if (!editingEntry.clockInTime) {
      newErrors.clockInTime = "Clock in time is required";
    }

    if (!editingEntry.clockOutTime) {
      newErrors.clockOutTime = "Clock out time is required";
    }

    if (
      editingEntry.clockInTime &&
      editingEntry.clockOutTime &&
      editingEntry.clockOutTime <= editingEntry.clockInTime
    ) {
      newErrors.clockOutTime = "Clock out time must be after clock in time";
    }

    if (editingEntry.overtimeDuration > 0 && !editingEntry.overtimeReason) {
      newErrors.overtimeReason = "Overtime reason is required when there is overtime";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const { timeLogStatus, overtimeRejectReason, ...entryWithoutStatus } = editingEntry;

    const formattedEntry: TimesheetUpdate = {
      ...entryWithoutStatus,
      clockInTime: format(editingEntry.clockInTime, "HH:mm:ss"),
      clockOutTime: format(editingEntry.clockOutTime, "HH:mm:ss"),
    };

    if (!userEmail) return;
    await dispatch(
      updateTimesheetRecord({
        timesheetRecord: formattedEntry,
        employeeEmail: userEmail,
        recordId: editingEntry.recordId,
      })
    ).unwrap();

    fetchData();
    setEditDialogOpen(false);
    setEditingEntry(null);
    setErrors({});
  };

  useEffect(() => {
    return () => {
      dispatch(resetTimesheetRecords());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {timesheetLoadingInfo === State.failed ? (
        <Box height={"100%"} width={"100%"} display={"flex"}>
          <StateWithImage message={Messages.error.fetchRecords} imageUrl={notFoundIcon} />
        </Box>
      ) : (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ width: "100%", height: "99%", overflow: "auto", p: 1 }}>
            {recordLoadingState === State.success && timesheetInfo && workPolicies && (
              <Box sx={{ width: "100%", height: "auto" }}>
                <InformationHeader timesheetInfo={timesheetInfo} workPolicies={workPolicies} />
              </Box>
            )}
            {recordLoadingState === State.loading && (
              <Box sx={{ width: "100%", height: "auto", mb: 1 }}>
                <InformationHeaderSkeleton isEmployeeView={true} />
              </Box>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="right" mb={1} spacing={1}>
              <FilterComponent
                availableFields={availableFields}
                filters={filters}
                setFilters={setFilters}
                onApply={fetchData}
                onReset={handleResetFilters}
              />
              <Tooltip title="Enter time logs to the system">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  ENTER TIME LOGS
                </Button>
              </Tooltip>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                height: "72%",
                width: "100%",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "auto",
                display: "grid",
              }}
            >
              <DataGrid
                pagination
                rows={records}
                columns={columns}
                disableDensitySelector
                paginationMode="server"
                rowCount={totalRecordCount}
                paginationModel={paginationModel}
                pageSizeOptions={[5]}
                onPaginationModelChange={setPaginationModel}
                loading={recordLoadingState === State.loading}
                getRowId={(row) => row.recordId}
                filterModel={filterModel}
                disableRowSelectionOnClick
                onFilterModelChange={setFilterModel}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                  noRowsOverlay: {
                    message: Messages.info.noRecords,
                    imageUrl: noDataIcon,
                  } as any,
                }}
                slots={{
                  noRowsOverlay: StateWithImageFunction,
                }}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: theme.palette.background.paper,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  "& .MuiDataGrid-virtualScroller": {
                    backgroundColor: theme.palette.background.default,
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                  },
                  "& .MuiDataGrid-row": {
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.action.selected,
                      "&:hover": {
                        backgroundColor: theme.palette.action.selected,
                      },
                    },
                  },
                  overflow: "auto",
                  height: "100%",
                  width: "100%",
                }}
              />
            </Paper>

            <CustomModal open={openDialog} onClose={handleCloseDialog}>
              <SubmitRecordModal onClose={handleCloseDialog} />
            </CustomModal>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>Edit Time Entry</DialogTitle>
              <DialogContent>
                {editingEntry && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Date"
                        value={editingEntry.recordDate}
                        disabled
                        onChange={(newDate) => handleEditFieldChange("recordDate", newDate)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            error: !!errors.recordDate,
                            helperText: errors.recordDate,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editingEntry.isLunchIncluded === 1 || editingEntry.isLunchIncluded === true}
                            onChange={(e) => handleEditFieldChange("isLunchIncluded", e.target.checked ? 1 : 0)}
                            name="isLunchIncluded"
                            color="primary"
                          />
                        }
                        label="Lunch Break Taken"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TimePicker
                        label="Clock In"
                        value={editingEntry.clockInTime}
                        onChange={(newTime) => handleEditFieldChange("clockInTime", newTime)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            error: !!errors.clockInTime,
                            helperText: errors.clockInTime,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TimePicker
                        label="Clock Out"
                        value={editingEntry.clockOutTime}
                        onChange={(newTime) => handleEditFieldChange("clockOutTime", newTime)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            error: !!errors.clockOutTime,
                            helperText: errors.clockOutTime,
                          },
                        }}
                      />
                    </Grid>
                    {editingEntry.overtimeDuration > 0 && (
                      <Grid item xs={12}>
                        <TextField
                          label="Overtime Reason"
                          value={editingEntry.overtimeReason}
                          onChange={(e) => handleEditFieldChange("overtimeReason", e.target.value)}
                          error={!!errors.overtimeReason}
                          helperText={errors.overtimeReason}
                          variant="outlined"
                          fullWidth
                          multiline
                          required={editingEntry.overtimeDuration > 0}
                          InputProps={{
                            startAdornment: editingEntry.overtimeDuration > 0 && (
                              <InputAdornment position="start">
                                <Chip
                                  label={`OT: ${editingEntry.overtimeDuration.toFixed(2)} hrs`}
                                  color="primary"
                                  size="small"
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setEditDialogOpen(false)}
                  color="secondary"
                  startIcon={<CloseIcon />}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleSaveEditedLogs}
                  color="primary"
                  startIcon={<SaveIcon />}
                  variant="contained"
                  loading={submitState === State.loading}
                >
                  Save Changes
                </LoadingButton>
              </DialogActions>
            </Dialog>
          </Box>
        </LocalizationProvider>
      )}
    </Box>
  );
};
export default EmployeeTimeSheetView;
