import { Component } from 'react';
import track from 'react-tracking';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape, defineMessages } from 'react-intl';
import { withModal, ModalLayout } from 'components/main/modal';
import { COMMON_LOCALE_KEYS } from 'common/constants/localization';
import { LAUNCHES_MODAL_EVENTS } from 'components/main/analytics/events';
import { InputRadio } from 'components/inputs/inputRadio';
import { InputCheckbox } from 'components/inputs/inputCheckbox';
import { LAUNCH_ANALYZE_TYPES } from 'common/constants/launchAnalyzeTypes';
import { activeProjectSelector } from 'controllers/user';
import classNames from 'classnames/bind';
import styles from './launchAnalysisModal.scss';

const cx = classNames.bind(styles);

const messages = defineMessages({
  analyseButton: {
    id: 'analysisItemsModal.analyse',
    defaultMessage: 'Analyse',
  },
  MOD_TITLE: {
    id: 'analysisItemsModal.modTitle',
    defaultMessage: 'Choose the base on which the Auto Analysis will be performed:',
  },
  OPTIONS_TITLE: {
    id: 'analysisItemsModal.optionsTitle',
    defaultMessage: 'Choose the test items that should be analyzed:',
  },
  ALL: {
    id: 'analysisItemsModal.baseOptions.allLaunches',
    defaultMessage: 'All launches',
  },
  LAUNCH_NAME: {
    id: 'analysisItemsModal.baseOptions.withSameName',
    defaultMessage: 'Launches with the same name',
  },
  CURRENT_LAUNCH: {
    id: 'analysisItemsModal.baseOptions.current',
    defaultMessage: 'Only current launch',
  },
  TO_INVESTIGATE: {
    id: 'analysisItemsModal.itemOptions.investigate',
    defaultMessage: 'To investigated items',
  },
  AUTO_ANALYZED: {
    id: 'analysisItemsModal.itemOptions.byAA',
    defaultMessage: 'Items analyzed automatically (by AA)',
  },
  MANUALLY_ANALYZED: {
    id: 'analysisItemsModal.itemOptions.manually',
    defaultMessage: 'Items analyzed manually',
  },
  VALIDATION_MESSAGE_CHOOSE_OPTION: {
    id: 'analysisItemsModal.validation.chooseOption',
    defaultMessage: 'You can not perform this operation unless at least one item is chosen',
  },
  VALIDATION_MESSAGE_CURRENT_LAUNCH: {
    id: 'analysisItemsModal.validation.currentLaunch',
    defaultMessage:
      'You can not perform this operation for Auto-analyzed and Manually analyzed items simultaneously. Please choose one of them',
  },
  SUCCESS_MESSAGE: {
    id: 'analysisItemsModal.successMessage',
    defaultMessage: 'Auto-analyzer has been started.',
  },
});

@withModal('analysisLaunchModal')
@injectIntl
@connect((state) => ({
  activeProject: activeProjectSelector(state),
}))
@track()
export class LaunchAnalysisModal extends Component {
  static propTypes = {
    intl: intlShape.isRequired,
    data: PropTypes.shape({
      item: PropTypes.object.isRequired,
      onConfirm: PropTypes.func.isRequired,
    }),
    activeProject: PropTypes.string.isRequired,
    tracking: PropTypes.shape({
      trackEvent: PropTypes.func,
      getTrackingData: PropTypes.func,
    }).isRequired,
  };

  static defaultProps = {
    data: {},
  };
  state = {
    ANALYZER_MODE: LAUNCH_ANALYZE_TYPES.ANALYZER_MODE.LAUNCH_NAME,
    ANALYZE_ITEMS_MODE: [LAUNCH_ANALYZE_TYPES.ANALYZE_ITEMS_MODE.TO_INVESTIGATE],
  };
  onChangeRadio = (value) => {
    this.setState({
      ANALYZER_MODE: value,
    });
  };
  onChangeCheckBox = (value) => {
    let { ANALYZE_ITEMS_MODE } = this.state;
    const inState = ANALYZE_ITEMS_MODE.includes(value);
    if (inState) {
      ANALYZE_ITEMS_MODE = ANALYZE_ITEMS_MODE.filter((item) => item !== value);
    } else {
      ANALYZE_ITEMS_MODE = [...ANALYZE_ITEMS_MODE, value];
    }
    this.setState({
      ANALYZE_ITEMS_MODE,
    });
  };
  onChange = (value, type) => {
    const { errorMessage } = this.state;
    if (errorMessage) {
      this.setState({
        errorMessage: '',
      });
    }
    switch (type) {
      case 'radio':
        return this.onChangeRadio(value);
      default:
        return this.onChangeCheckBox(value);
    }
  };
  analysisAndClose = (closeModal) => {
    this.props.tracking.trackEvent(LAUNCHES_MODAL_EVENTS.OK_BTN_ANALYSIS_MODAL);
    const errorMessage = this.isInValid();
    if (errorMessage) {
      this.setState({
        errorMessage,
      });
      return;
    }
    const {
      data: {
        item: { id },
      },
    } = this.props;
    const { ANALYZER_MODE, ANALYZE_ITEMS_MODE } = this.state;
    const data = {
      analyzeItemsMode: ANALYZE_ITEMS_MODE,
      analyzerMode: ANALYZER_MODE,
      launchId: id,
    };
    this.props.data.onConfirm(data);
    closeModal();
  };
  isInValid = () => {
    const { ANALYZER_MODE, ANALYZE_ITEMS_MODE } = this.state;
    const {
      intl: { formatMessage },
    } = this.props;
    const {
      ANALYZER_MODE: { CURRENT_LAUNCH },
      ANALYZE_ITEMS_MODE: { AUTO_ANALYZED, MANUALLY_ANALYZED },
    } = LAUNCH_ANALYZE_TYPES;
    if (ANALYZE_ITEMS_MODE.length === 0) {
      return formatMessage(messages.VALIDATION_MESSAGE_CHOOSE_OPTION);
    }
    if (
      ANALYZER_MODE === CURRENT_LAUNCH &&
      ANALYZE_ITEMS_MODE.includes(AUTO_ANALYZED) &&
      ANALYZE_ITEMS_MODE.includes(MANUALLY_ANALYZED)
    ) {
      return formatMessage(messages.VALIDATION_MESSAGE_CURRENT_LAUNCH);
    }
    return null;
  };
  renderOptions = (object = {}) => {
    const { ANALYZE_ITEMS_MODE } = this.state;
    const {
      intl: { formatMessage },
    } = this.props;
    return Object.keys(object).map((key) => {
      const checked = ANALYZE_ITEMS_MODE.includes(object[key]);
      const onChange = () => {
        this.onChange(object[key], 'checkbox');
      };
      return (
        <InputCheckbox key={key} value={checked} onChange={onChange}>
          {formatMessage(messages[key])}
        </InputCheckbox>
      );
    });
  };
  renderModes = (object) => {
    const { ANALYZER_MODE } = this.state;
    const {
      intl: { formatMessage },
    } = this.props;
    return Object.keys(object).map((key) => {
      const onChange = () => {
        this.onChange(object[key], 'radio');
      };
      return (
        <InputRadio key={key} value={ANALYZER_MODE} ownValue={object[key]} onChange={onChange}>
          {formatMessage(messages[key])}
        </InputRadio>
      );
    });
  };
  render() {
    const {
      intl: { formatMessage },
    } = this.props;
    const okButton = {
      text: formatMessage(messages.analyseButton),
      onClick: this.analysisAndClose,
    };
    const cancelButton = {
      text: formatMessage(COMMON_LOCALE_KEYS.CANCEL),
      eventInfo: LAUNCHES_MODAL_EVENTS.CANCEL_BTN_ANALYSIS_MODAL,
    };
    const { errorMessage } = this.state;
    return (
      <ModalLayout
        title="ANALYSE LAUNCHES"
        okButton={okButton}
        cancelButton={cancelButton}
        closeIconEventInfo={LAUNCHES_MODAL_EVENTS.CLOSE_BTN_ANALYSIS_MODAL}
        warningMessage={errorMessage}
      >
        <p className={cx('launch-analysis-modal-text')}>{formatMessage(messages.MOD_TITLE)}</p>
        <div className={cx('launch-analysis-modal-list')}>
          {this.renderModes(LAUNCH_ANALYZE_TYPES.ANALYZER_MODE)}
        </div>
        <p className={cx('launch-analysis-modal-text')}>{formatMessage(messages.OPTIONS_TITLE)}</p>
        <div className={cx('launch-analysis-modal-list')}>
          {this.renderOptions(LAUNCH_ANALYZE_TYPES.ANALYZE_ITEMS_MODE)}
        </div>
      </ModalLayout>
    );
  }
}
