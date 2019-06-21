import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape, defineMessages } from 'react-intl';
import track from 'react-tracking';
import isEqual from 'fast-deep-equal';
import {
  LAUNCHES_PAGE,
  LAUNCHES_PAGE_EVENTS,
  LAUNCHES_MODAL_EVENTS,
} from 'components/main/analytics/events';
import { PageLayout, PageSection } from 'layouts/pageLayout';
import { fetch } from 'common/utils';
import { URLS } from 'common/urls';
import { LAUNCH_ITEM_TYPES } from 'common/constants/launchItemTypes';
import { IN_PROGRESS } from 'common/constants/testStatuses';
import { levelSelector } from 'controllers/testItem';
import { PaginationToolbar } from 'components/main/paginationToolbar';
import { activeProjectSelector, userIdSelector } from 'controllers/user';
import { projectConfigSelector } from 'controllers/project';
import { withPagination, DEFAULT_PAGINATION, SIZE_KEY } from 'controllers/pagination';
import { withSorting, SORTING_ASC } from 'controllers/sorting';
import { showModalAction } from 'controllers/modal';
import { ENTITY_START_TIME } from 'components/filterEntities/constants';
import { showNotification, NOTIFICATION_TYPES } from 'controllers/notification';
import { showScreenLockAction, hideScreenLockAction } from 'controllers/screenLock';
import {
  debugModeSelector,
  selectedLaunchesSelector,
  toggleLaunchSelectionAction,
  unselectAllLaunchesAction,
  validationErrorsSelector,
  proceedWithValidItemsAction,
  forceFinishLaunchesAction,
  mergeLaunchesAction,
  compareLaunchesAction,
  moveLaunchesAction,
  launchesSelector,
  launchPaginationSelector,
  fetchLaunchesAction,
  lastOperationSelector,
  loadingSelector,
  NAMESPACE,
  toggleAllLaunchesAction,
  deleteItemsAction,
  updateLaunchLocallyAction,
  updateLaunchesLocallyAction,
} from 'controllers/launch';
import { prevTestItemSelector } from 'controllers/pages';
import { LaunchSuiteGrid } from 'pages/inside/common/launchSuiteGrid';
import { LaunchFiltersContainer } from 'pages/inside/common/launchFiltersContainer';
import { LEVEL_LAUNCH } from 'common/constants/launchLevels';
import { FilterEntitiesContainer } from 'components/filterEntities/containers';
import { LaunchFiltersToolbar } from 'pages/inside/common/launchFiltersToolbar';
import { LaunchToolbar } from './LaunchToolbar';

const messages = defineMessages({
  deleteModalHeader: {
    id: 'LaunchesPage.deleteModalHeader',
    defaultMessage: 'Delete launch',
  },
  deleteModalMultipleHeader: {
    id: 'LaunchesPage.deleteModalMultipleHeader',
    defaultMessage: 'Delete launches',
  },
  deleteModalContent: {
    id: 'LaunchesPage.deleteModalContent',
    defaultMessage:
      "Are you sure you want to delete launch <b>'{name}'</b>? It will no longer exist.",
  },
  deleteModalMultipleContent: {
    id: 'LaunchesPage.deleteModalMultipleContent',
    defaultMessage: 'Are you sure you want to delete launches? They will no longer exist.',
  },
  warning: {
    id: 'LaunchesPage.warning',
    defaultMessage:
      'You are going to delete not your own launch. This may affect other users information on the project.',
  },
  warningMultiple: {
    id: 'LaunchesPage.warningMultiple',
    defaultMessage:
      'You are going to delete not your own launches. This may affect other users information on the project.',
  },
  success: {
    id: 'LaunchesPage.success',
    defaultMessage: 'Launch was deleted',
  },
  successMultiple: {
    id: 'LaunchesPage.successMultiple',
    defaultMessage: 'Launches were deleted',
  },
  error: {
    id: 'LaunchesPage.error',
    defaultMessage: 'Error when deleting launch',
  },
  errorMultiple: {
    id: 'LaunchesPage.errorMultiple',
    defaultMessage: 'Error when deleting launches',
  },
  analyseStartSuccess: {
    id: 'LaunchesPage.analyseStartSuccess',
    defaultMessage: 'Auto-analyzer has been started.',
  },
  addWidgetSuccess: {
    id: 'LaunchesPage.addWidgetSuccess',
    defaultMessage: 'Widget has been added',
  },
});

@connect(
  (state) => ({
    debugMode: debugModeSelector(state),
    userId: userIdSelector(state),
    activeProject: activeProjectSelector(state),
    url: URLS.launches(activeProjectSelector(state)),
    selectedLaunches: selectedLaunchesSelector(state),
    validationErrors: validationErrorsSelector(state),
    launches: launchesSelector(state),
    lastOperation: lastOperationSelector(state),
    loading: loadingSelector(state),
    level: levelSelector(state),
    projectSetting: projectConfigSelector(state),
    highlightItemId: prevTestItemSelector(state),
  }),
  {
    showModalAction,
    toggleLaunchSelectionAction,
    unselectAllLaunchesAction,
    proceedWithValidItemsAction,
    forceFinishLaunchesAction,
    mergeLaunchesAction,
    compareLaunchesAction,
    moveLaunchesAction,
    fetchLaunchesAction,
    toggleAllLaunchesAction,
    deleteItemsAction,
    showNotification,
    showScreenLockAction,
    hideScreenLockAction,
    updateLaunchLocallyAction,
    updateLaunchesLocallyAction,
  },
)
@withSorting({
  defaultSortingColumn: ENTITY_START_TIME,
  defaultSortingDirection: SORTING_ASC,
})
@withPagination({
  paginationSelector: launchPaginationSelector,
  namespace: NAMESPACE,
})
@injectIntl
@track({ page: LAUNCHES_PAGE })
export class LaunchesPage extends Component {
  static propTypes = {
    level: PropTypes.string,
    debugMode: PropTypes.bool.isRequired,
    userId: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    launches: PropTypes.arrayOf(PropTypes.object),
    activePage: PropTypes.number,
    itemCount: PropTypes.number,
    pageCount: PropTypes.number,
    pageSize: PropTypes.number,
    sortingColumn: PropTypes.string,
    sortingDirection: PropTypes.string,
    showModalAction: PropTypes.func,
    onChangePage: PropTypes.func,
    onChangePageSize: PropTypes.func,
    onChangeSorting: PropTypes.func,
    sortingString: PropTypes.string,
    activeProject: PropTypes.string.isRequired,
    selectedLaunches: PropTypes.arrayOf(PropTypes.object),
    validationErrors: PropTypes.object,
    toggleAllLaunchesAction: PropTypes.func,
    unselectAllLaunchesAction: PropTypes.func,
    proceedWithValidItemsAction: PropTypes.func,
    toggleLaunchSelectionAction: PropTypes.func,
    forceFinishLaunchesAction: PropTypes.func,
    mergeLaunchesAction: PropTypes.func,
    compareLaunchesAction: PropTypes.func,
    moveLaunchesAction: PropTypes.func,
    lastOperation: PropTypes.string,
    loading: PropTypes.bool,
    fetchLaunchesAction: PropTypes.func,
    showNotification: PropTypes.func.isRequired,
    showScreenLockAction: PropTypes.func.isRequired,
    hideScreenLockAction: PropTypes.func.isRequired,
    deleteItemsAction: PropTypes.func,
    tracking: PropTypes.shape({
      trackEvent: PropTypes.func,
      getTrackingData: PropTypes.func,
    }).isRequired,
    projectSetting: PropTypes.object.isRequired,
    updateLaunchLocallyAction: PropTypes.func.isRequired,
    updateLaunchesLocallyAction: PropTypes.func.isRequired,
    highlightItemId: PropTypes.number,
  };

  static defaultProps = {
    level: '',
    launches: [],
    activePage: 1,
    itemCount: null,
    pageCount: null,
    pageSize: DEFAULT_PAGINATION[SIZE_KEY],
    sortingColumn: null,
    sortingDirection: null,
    showModalAction: () => {},
    onChangePage: () => {},
    onChangePageSize: () => {},
    onChangeSorting: () => {},
    sortingString: '',
    selectedLaunches: [],
    validationErrors: {},
    toggleAllLaunchesAction: () => {},
    unselectAllLaunchesAction: () => {},
    proceedWithValidItemsAction: () => {},
    toggleLaunchSelectionAction: () => {},
    forceFinishLaunchesAction: () => {},
    mergeLaunchesAction: () => {},
    compareLaunchesAction: () => {},
    moveLaunchesAction: () => {},
    lastOperation: '',
    loading: false,
    fetchLaunchesAction: () => {},
    deleteItemsAction: () => {},
    highlightItemId: null,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    return prevState.prevLaunches !== nextProps.launches
      ? {
          prevLaunches: nextProps.launches,
          launchesInProgress: nextProps.launches
            .filter((item) => item.status === IN_PROGRESS)
            .map((item) => item.id),
        }
      : null;
  }

  state = {
    highlightedRowId: null,
    isGridRowHighlighted: false,
    prevLaunches: [],
    launchesInProgress: [],
    finishedLaunchesCount: null,
  };

  componentDidMount() {
    const { highlightItemId } = this.props;
    if (highlightItemId) {
      this.onHighlightRow(highlightItemId);
    }
  }

  componentDidUpdate() {
    if (!this.state.launchesInProgress.length && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.state.launchesInProgress.length && !this.intervalId) {
      this.intervalId = setInterval(
        () => this.fetchLaunchStatus(this.state.launchesInProgress),
        5000,
      );
    }
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    this.props.unselectAllLaunchesAction();
  }

  onHighlightRow = (highlightedRowId) => {
    this.setState({
      highlightedRowId,
      isGridRowHighlighted: false,
    });
  };

  onGridRowHighlighted = () => {
    this.setState({
      isGridRowHighlighted: true,
    });
  };

  onAnalysis = (launch) => {
    const {
      projectSetting: { attributes },
      tracking: { trackEvent },
    } = this.props;
    trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_ANALYSIS_LAUNCH_MENU);
    this.props.showModalAction({
      id: 'analysisLaunchModal',
      data: {
        item: launch,
        onConfirm: (data) => this.analyseItem(launch, data),
        analyzerMode: attributes['analyzer.autoAnalyzerMode'],
      },
    });
  };
  onAddDashBoard = (dashboard) => {
    const { activeProject } = this.props;
    if (dashboard.id) {
      return Promise.resolve(dashboard);
    }
    return fetch(URLS.dashboards(activeProject), {
      method: 'post',
      data: dashboard,
    });
  };
  onAddWidget = (widget, closeModal, dashboard) => {
    const {
      activeProject,
      intl: { formatMessage },
    } = this.props;
    this.onAddDashBoard(dashboard).then(({ id }) => {
      fetch(URLS.addDashboardWidget(activeProject, id), {
        method: 'put',
        data: { addWidget: widget },
      })
        .then(() => {
          this.props.hideScreenLockAction();
          closeModal();
          this.props.showNotification({
            message: formatMessage(messages.addWidgetSuccess),
            type: NOTIFICATION_TYPES.SUCCESS,
          });
        })
        .catch((err) => {
          this.props.hideScreenLockAction();
          this.props.showNotification({ message: err.message, type: NOTIFICATION_TYPES.ERROR });
        });
    });
  };
  showWidgetWizard = () => {
    const {
      tracking: { trackEvent },
    } = this.props;
    trackEvent(LAUNCHES_PAGE.ADD_NEW_WIDGET_BTN);
    this.props.showModalAction({
      id: 'widgetWizardModal',
      data: {
        onConfirm: this.onAddWidget,
        eventsInfo: {
          closeIcon: LAUNCHES_MODAL_EVENTS.CLOSE_ICON_ADD_WIDGET_MODAL,
          chooseWidgetType: LAUNCHES_MODAL_EVENTS.CHOOSE_WIDGET_TYPE_ADD_WIDGET_MODAL,
          nextStep: LAUNCHES_MODAL_EVENTS.NEXT_STEP_ADD_WIDGET_MODAL,
          prevStep: LAUNCHES_MODAL_EVENTS.PREVIOUS_STEP_ADD_WIDGET_MODAL,
          changeDescription: LAUNCHES_MODAL_EVENTS.ENTER_WIDGET_DESCRIPTION_ADD_WIDGET_MODAL,
          shareWidget: LAUNCHES_MODAL_EVENTS.SHARE_WIDGET_ADD_WIDGET_MODAL,
          addWidget: LAUNCHES_MODAL_EVENTS.ADD_BTN_ADD_WIDGET_MODAL,
        },
      },
    });
  };
  analyseItem = (launch, data) => {
    const {
      activeProject,
      intl: { formatMessage },
    } = this.props;
    fetch(URLS.launchAnalyze(activeProject), {
      method: 'POST',
      data,
    })
      .then(() => {
        this.props.showNotification({
          message: formatMessage(messages.analyseStartSuccess),
          type: NOTIFICATION_TYPES.SUCCESS,
        });
        const item = {
          ...launch,
          analyzing: true,
        };
        this.props.updateLaunchLocallyAction(item);
      })
      .catch((error) => {
        this.props.showNotification({
          message: error.message,
          type: NOTIFICATION_TYPES.ERROR,
        });
      });
  };

  unselectAndFetchLaunches = () => {
    this.props.unselectAllLaunchesAction();
    this.props.fetchLaunchesAction();
  };

  deleteItem = (item) => this.deleteItems([item]);

  confirmDeleteItems = (items) => {
    const ids = items.map((item) => item.id);
    this.props.showScreenLockAction();
    fetch(URLS.launches(this.props.activeProject), {
      method: 'delete',
      data: {
        ids,
      },
    })
      .then(() => {
        this.unselectAndFetchLaunches();
        this.props.hideScreenLockAction();
        this.props.showNotification({
          message:
            items.length === 1
              ? this.props.intl.formatMessage(messages.success)
              : this.props.intl.formatMessage(messages.successMultiple),
          type: NOTIFICATION_TYPES.SUCCESS,
        });
      })
      .catch(() => {
        this.props.hideScreenLockAction();
        this.props.showNotification({
          message:
            items.length === 1
              ? this.props.intl.formatMessage(messages.error)
              : this.props.intl.formatMessage(messages.errorMultiple),
          type: NOTIFICATION_TYPES.ERROR,
        });
      });
  };

  deleteItems = (launches) => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_DELETE_ACTION);
    const { intl, userId } = this.props;
    const selectedLaunches = launches || this.props.selectedLaunches;
    this.props.deleteItemsAction(selectedLaunches, {
      onConfirm: this.confirmDeleteItems,
      header:
        selectedLaunches.length === 1
          ? intl.formatMessage(messages.deleteModalHeader)
          : intl.formatMessage(messages.deleteModalMultipleHeader),
      mainContent:
        selectedLaunches.length === 1
          ? intl.formatMessage(messages.deleteModalContent, { name: selectedLaunches[0].name })
          : intl.formatMessage(messages.deleteModalMultipleContent),
      userId,
      warning:
        selectedLaunches.length === 1
          ? intl.formatMessage(messages.warning)
          : intl.formatMessage(messages.warningMultiple),
      eventsInfo: {
        closeIcon: LAUNCHES_MODAL_EVENTS.CLOSE_ICON_DELETE_MODAL,
        cancelBtn: LAUNCHES_MODAL_EVENTS.CANCEL_BTN_DELETE_MODAL,
        deleteBtn: LAUNCHES_MODAL_EVENTS.DELETE_BTN_DELETE_MODAL,
      },
    });
  };

  finishForceLaunches = (eventData) => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_FORCE_FINISH_ACTION);
    const launches = eventData && eventData.id ? [eventData] : this.props.selectedLaunches;
    this.props.forceFinishLaunchesAction(launches, {
      fetchFunc: this.unselectAndFetchLaunches,
    });
  };

  fetchLaunchStatus = (launches) => {
    fetch(URLS.launchStatus(this.props.activeProject, launches), {
      method: 'get',
    }).then((launchesWithStatus) => {
      const newLaunchesInProgress = this.state.launchesInProgress.filter(
        (item) => launchesWithStatus[item] === IN_PROGRESS,
      );

      if (!isEqual(this.state.launchesInProgress, newLaunchesInProgress)) {
        const { finishedLaunchesCount, launchesInProgress } = this.state;
        const diff = launchesInProgress.length - newLaunchesInProgress.length;
        const newFinishedLaunchesCount = finishedLaunchesCount
          ? finishedLaunchesCount + diff
          : diff;

        const newLaunchesData = this.props.launches
          .filter((item) => !item.endTime && !newLaunchesInProgress.includes(item.id))
          .map((item) => ({
            ...item,
            endTime: Date.now(),
            status: launchesWithStatus[item.id],
          }));

        this.props.updateLaunchesLocallyAction(newLaunchesData);

        this.setState({
          launchesInProgress: newLaunchesInProgress,
          finishedLaunchesCount: newFinishedLaunchesCount,
        });
      }
    });
  };

  openEditModal = (launch) => {
    this.props.showModalAction({
      id: 'editItemModal',
      data: {
        item: launch,
        type: LAUNCH_ITEM_TYPES.launch,
        fetchFunc: this.props.fetchLaunchesAction,
      },
    });
  };
  openImportModal = () => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_IMPORT_BTN);
    this.props.showModalAction({
      id: 'launchImportModal',
      data: {
        onImport: this.props.fetchLaunchesAction,
      },
    });
  };

  resetPageNumber = () => {
    if (this.props.activePage !== 1) {
      this.props.onChangePage(1);
    }
  };

  refreshLaunch = () => {
    this.setState({
      finishedLaunchesCount: null,
    });
    this.props.fetchLaunchesAction();
  };

  handleAllLaunchesSelection = () => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_SELECT_ALL_ICON);
    this.props.toggleAllLaunchesAction(this.props.launches);
  };

  handleOneLaunchSelection = (value) => {
    !this.props.level && this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_SELECT_ONE_ITEM);
    this.props.toggleLaunchSelectionAction(value);
  };

  proceedWithValidItems = () =>
    this.props.proceedWithValidItemsAction(this.props.lastOperation, this.props.selectedLaunches, {
      fetchFunc: this.unselectAndFetchLaunches,
    });

  mergeLaunches = () => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_MERGE_ACTION);
    this.props.mergeLaunchesAction(this.props.selectedLaunches, {
      fetchFunc: this.unselectAndFetchLaunches,
    });
  };

  moveLaunches = (eventData) => {
    const launches = eventData && eventData.id ? [eventData] : this.props.selectedLaunches;
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_MOVE_TO_DEBUG_LAUNCH_MENU);
    this.props.moveLaunchesAction(launches, {
      fetchFunc: this.unselectAndFetchLaunches,
      debugMode: this.props.debugMode,
    });
  };

  compareLaunches = () => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_COMPARE_ACTION);
    this.props.compareLaunchesAction(this.props.selectedLaunches);
  };

  unselectAllItems = () => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_CLOSE_ICON_ALL_SELECTION);
    this.props.unselectAllLaunchesAction();
  };

  unselectItem = (item) => {
    this.props.tracking.trackEvent(LAUNCHES_PAGE_EVENTS.CLICK_CLOSE_ICON_FROM_SELECTION);
    this.props.toggleLaunchSelectionAction(item);
  };

  handleChangeSorting = (sortingColumn) => {
    let orderBy = sortingColumn;

    this.onUpdateFilterOrder(this.activeFilterId, this.props.sortingString);

    if (Array.isArray(sortingColumn)) {
      orderBy = sortingColumn[0].sortingColumn;
    }

    this.props.onChangeSorting(orderBy);
  };

  renderPageContent = ({
    launchFilters,
    activeFilterId,
    activeFilter,
    activeFilterConditions,
    onSelectFilter,
    onRemoveFilter,
    onChangeFilter,
    onResetFilter,
    onUpdateFilterOrder,
  }) => {
    const {
      activePage,
      itemCount,
      pageCount,
      pageSize,
      onChangePage,
      onChangePageSize,
      sortingColumn,
      sortingDirection,
      selectedLaunches,
      launches,
      loading,
      debugMode,
      sortingString,
      userId,
    } = this.props;

    const rowHighlightingConfig = {
      onGridRowHighlighted: this.onGridRowHighlighted,
      isGridRowHighlighted: this.state.isGridRowHighlighted,
      highlightedRowId: this.state.highlightedRowId,
    };

    this.onUpdateFilterOrder = onUpdateFilterOrder;
    this.activeFilterId = activeFilterId;

    const { finishedLaunchesCount } = this.state;
    return (
      <FilterEntitiesContainer
        level={LEVEL_LAUNCH}
        filterId={activeFilterId}
        entities={activeFilterConditions}
        onChange={onChangeFilter}
        render={({ onFilterAdd, ...rest }) => (
          <PageLayout>
            <PageSection>
              {!debugMode && (
                <LaunchFiltersToolbar
                  filters={launchFilters}
                  activeFilterId={activeFilterId}
                  activeFilter={activeFilter}
                  onSelectFilter={onSelectFilter}
                  onRemoveFilter={onRemoveFilter}
                  onFilterAdd={onFilterAdd}
                  onResetFilter={onResetFilter}
                  onChangeSorting={this.handleChangeSorting}
                  sortingString={sortingString}
                  userId={userId}
                  {...rest}
                />
              )}
            </PageSection>
            <PageSection>
              <LaunchToolbar
                errors={this.props.validationErrors}
                onRefresh={this.refreshLaunch}
                selectedLaunches={selectedLaunches}
                onUnselect={this.unselectItem}
                onUnselectAll={this.unselectAllItems}
                onProceedValidItems={this.proceedWithValidItems}
                onMove={this.moveLaunches}
                onMerge={this.mergeLaunches}
                onForceFinish={this.finishForceLaunches}
                onCompare={this.compareLaunches}
                onImportLaunch={this.openImportModal}
                debugMode={debugMode}
                onDelete={this.deleteItems}
                activeFilterId={activeFilterId}
                onAddNewWidget={this.showWidgetWizard}
                finishedLaunchesCount={finishedLaunchesCount}
              />
              <LaunchSuiteGrid
                data={launches}
                sortingColumn={sortingColumn}
                sortingDirection={sortingDirection}
                onChangeSorting={this.handleChangeSorting}
                onDeleteItem={this.deleteItem}
                onMove={this.moveLaunches}
                onEditItem={this.openEditModal}
                onForceFinish={this.finishForceLaunches}
                selectedItems={selectedLaunches}
                onItemSelect={this.handleOneLaunchSelection}
                onAllItemsSelect={this.handleAllLaunchesSelection}
                withHamburger
                loading={loading}
                onFilterClick={onFilterAdd}
                events={LAUNCHES_PAGE_EVENTS}
                onAnalysis={this.onAnalysis}
                rowHighlightingConfig={rowHighlightingConfig}
              />
              {!!pageCount &&
                !loading && (
                  <PaginationToolbar
                    activePage={activePage}
                    itemCount={itemCount}
                    pageCount={pageCount}
                    pageSize={pageSize}
                    onChangePage={onChangePage}
                    onChangePageSize={onChangePageSize}
                  />
                )}
            </PageSection>
          </PageLayout>
        )}
      />
    );
  };

  render() {
    const { isGridRowHighlighted, finishedLaunchesCount } = this.state;

    return (
      <LaunchFiltersContainer
        {...this.props}
        finishedLaunchesCount={finishedLaunchesCount}
        isGridRowHighlighted={isGridRowHighlighted}
        onChange={this.resetPageNumber}
        render={this.renderPageContent}
      />
    );
  }
}
