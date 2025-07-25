import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import i18next from 'i18next'
import { toast } from 'react-toastify'

import { getLocationsChanges } from '../utils/api'

const fetchLocationChangesUser = createAsyncThunk(
  'activity/fetchLocationChangesUser',
  getLocationsChanges,
)

const fetchLocationChangesAll = createAsyncThunk(
  'activity/fetchLocationChangesAll',
  getLocationsChanges,
)

export const getUserActivity = (userId) => (dispatch, getState) => {
  const state = getState()
  const { changesByUser } = state.activity

  if (changesByUser[userId]) {
    return Promise.resolve(changesByUser[userId])
  } else {
    return dispatch(fetchLocationChangesUser({ user_id: userId }))
  }
}

export const fetchMoreLocationChanges = () => (dispatch, getState) => {
  const state = getState()
  const latest =
    state.activity.recentChanges.fetchedUntilDate || new Date().toISOString()
  const earliest = new Date(
    new Date(latest).getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString()

  return dispatch(fetchLocationChangesAll({ earliest, latest }))
}

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    recentChanges: {
      data: [],
      isLoading: false,
      fetchedUntilDate: null,
      lastBrowsedSection: {
        id: null,
      },
    },
    changesByUser: {},
    userActivityLastBrowsedSection: {
      id: null,
      userId: null,
      displayLimit: null,
    },
  },
  reducers: {
    setRecentChangesLastBrowsedSection: (state, action) => {
      state.recentChanges.lastBrowsedSection = action.payload
    },
    setUserActivityLastBrowsedSection: (state, action) => {
      state.userActivityLastBrowsedSection = action.payload
    },
  },
  extraReducers: {
    [fetchLocationChangesUser.fulfilled]: (state, action) => {
      const userId = action.meta.arg.user_id
      state.changesByUser[userId] = action.payload
    },
    [fetchLocationChangesAll.pending]: (state) => {
      state.recentChanges.isLoading = true
    },
    [fetchLocationChangesAll.fulfilled]: (state, action) => {
      const { earliest } = action.meta.arg

      state.recentChanges.data.push(...action.payload)
      state.recentChanges.fetchedUntilDate = state.recentChanges
        .fetchedUntilDate
        ? new Date(
            Math.min(
              new Date(state.recentChanges.fetchedUntilDate),
              new Date(earliest),
            ),
          ).toISOString()
        : earliest

      state.recentChanges.isLoading = false
    },
    [fetchLocationChangesAll.rejected]: (state, action) => {
      state.recentChanges.isLoading = false

      toast.error(
        i18next.t('error_message.api.fetch_location_changes_failed', {
          message:
            action.error.message || i18next.t('error_message.unknown_error'),
        }),
      )
    },
  },
})

export const resetRecentChangesLastBrowsedSection = () =>
  setRecentChangesLastBrowsedSection({
    id: null,
  })

export const resetUserActivityLastBrowsedSection = () =>
  setUserActivityLastBrowsedSection({
    id: null,
    userId: null,
    displayLimit: null,
  })

export const {
  setRecentChangesLastBrowsedSection,
  setUserActivityLastBrowsedSection,
} = activitySlice.actions

export default activitySlice.reducer
