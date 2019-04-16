import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FieldProvider } from 'components/fields/fieldProvider';
import { injectIntl, defineMessages, intlShape } from 'react-intl';
import { URLS } from 'common/urls';
import { arrayRemoveDoubles, validate } from 'common/utils';
import { GROUP_TO_ACTION_MAP, ACTION_TO_GROUP_MAP } from 'common/constants/actionTypes';
import { activeProjectSelector } from 'controllers/user';
import { getWidgetCriteriaOptions } from './utils/getWidgetCriteriaOptions';
import { USER_ACTIONS_OPTIONS, ITEMS_INPUT_WIDTH, CONTENT_FIELDS } from './constants';
import { DropdownControl, InputControl, TagsControl } from './controls';

const DEFAULT_ITEMS_COUNT = '50';
const messages = defineMessages({
  CriteriaFieldLabel: {
    id: 'ProjectActivityControls.CriteriaFieldLabel',
    defaultMessage: 'Criteria for widget',
  },
  ItemsFieldLabel: {
    id: 'ProjectActivityControls.ItemsFieldLabel',
    defaultMessage: 'Items',
  },
  UsernameControlText: {
    id: 'ProjectActivityControls.UsernameControlText',
    defaultMessage: 'User name',
  },
  UsersPlaceholder: {
    id: 'ProjectActivityControls.UsersPlaceholder',
    defaultMessage: 'Enter user name',
  },
  UsersFocusPlaceholder: {
    id: 'ProjectActivityControls.UsersFocusPlaceholder',
    defaultMessage: 'At least 3 symbols required.',
  },
  UsersNoMatches: {
    id: 'ProjectActivityControls.UsersNoMatches',
    defaultMessage: 'No matches found.',
  },
  ItemsValidationError: {
    id: 'ProjectActivityControls.ItemsValidationError',
    defaultMessage: 'Items count should have value from 1 to 150',
  },
  ActionTypesValidationError: {
    id: 'ProjectActivityControls.ActionTypesValidationError',
    defaultMessage: 'You must select at least one item',
  },
  FiltersValidationError: {
    id: 'ProductStatusControls.FiltersValidationError',
    defaultMessage: 'You must select at least one item',
  },
  FiltersFieldLabel: {
    id: 'ProductStatusControls.FiltersFieldLabel',
    defaultMessage: 'Filters',
  },
  FiltersPlaceholder: {
    id: 'ProductStatusControls.FiltersPlaceholder',
    defaultMessage: 'Enter filter names',
  },
  FiltersFocusPlaceholder: {
    id: 'ProductStatusControls.FiltersFocusPlaceholder',
    defaultMessage: 'At least 3 symbols required.',
  },
  FiltersNoMatches: {
    id: 'ProductStatusControls.FiltersNoMatches',
    defaultMessage: 'No matches found.',
  },
});
const validators = {
  items: (formatMessage) => (value) =>
    (!value || !validate.inRangeValidate(value, 1, 150)) &&
    formatMessage(messages.ItemsValidationError),
  actionType: (formatMessage) => (value) =>
    (!value || !value.length) && formatMessage(messages.ActionTypesValidationError),
  filterIds: (formatMessage) => (value) =>
    (!value || !value.length) && formatMessage(messages.FiltersValidationError),
};

@injectIntl
@connect((state) => ({
  usernamesSearchUrl: URLS.projectUsernamesSearch(activeProjectSelector(state)),
  filtersSearchUrl: URLS.filtersSearch(activeProjectSelector(state)),
}))
export class ProjectActivityControls extends Component {
  static propTypes = {
    intl: intlShape.isRequired,
    widgetSettings: PropTypes.object.isRequired,
    usernamesSearchUrl: PropTypes.string.isRequired,
    initializeControlsForm: PropTypes.func.isRequired,
    filtersSearchUrl: PropTypes.string.isRequired,
  };

  constructor(props) {
    super(props);
    const { intl, widgetSettings, initializeControlsForm } = props;
    this.criteria = getWidgetCriteriaOptions([USER_ACTIONS_OPTIONS], intl.formatMessage);
    // from other widget
    // this.criteria = getWidgetCriteriaOptions([DEFECT_TYPES_GROUPS_OPTIONS], intl.formatMessage);

    initializeControlsForm({
      contentParameters: widgetSettings.contentParameters || {
        contentFields: [
          CONTENT_FIELDS.NAME,
          CONTENT_FIELDS.USER,
          CONTENT_FIELDS.LAST_MODIFIED,
          CONTENT_FIELDS.ACTION_TYPE,
          CONTENT_FIELDS.OBJECT_TYPE,
          CONTENT_FIELDS.PROJECT_REF,
          CONTENT_FIELDS.LOGGED_OBJECT_REF,
          CONTENT_FIELDS.HISTORY,
        ],
        itemsCount: DEFAULT_ITEMS_COUNT,
        widgetOptions: {
          actionType: this.parseActionTypes(this.criteria),
          user: '',
          user2: [],
          // user2: '', // with this widget does not load
        },
      },
      filters: [],
    });
  }

  formatActionTypes = (criteries) =>
    arrayRemoveDoubles(criteries.map((criteria) => ACTION_TO_GROUP_MAP[criteria] || criteria));
  parseActionTypes = (criteries) => {
    if (!criteries) {
      return this.props.widgetSettings.contentParameters.widgetOptions.actionType;
    }
    return criteries
      .map((criteria) => {
        const value = criteria.value || criteria;
        return GROUP_TO_ACTION_MAP[value] || value;
      })
      .reduce((acc, val) => acc.concat(val), []);
  };

  normalizeValue = (value) => value && `${value}`.replace(/\D+/g, '');

  formatUsernames = (values) =>
    ((values.length && values.split && values.split(',')) || values || []).map((value) => ({
      value,
      label: value,
    }));

  parseUsernames = (values) =>
    (values && values.map((value) => value.value).join(',')) || undefined;

  formatUsernamesOptions = (values) =>
    ((values.length && values.split && values.split(',')) || values || []).map((value) => ({
      value,
      label: value,
    }));

  // updated functions from user names copied from filters
  // formatUserNames2 = (values) =>
  //   values.map((value) => ({ value, label: value.name })); // F1 searches but names are blank, select and clear works ok

  // F2 blank after search and crash when selected
  // formatUserNames2 = (values) =>
  //   values.map((value) => ({ value, label: value.value }));

  // F3 blank after search and crash when selected
  formatUserNames2 = (values) => values.map((value) => ({ value, label: value.value }));

  // formatUserNames2 = (values) => values.map((value) => ({ value, label: value })); // outputs correct username after search but then crash with Invalid prop `children` supplied to `Value`, expected a ReactNode.
  // formatUserNames2 = (values) => values.map((value) => ({ value, label: value.label })); // searches but names are blank, select and clear works ok

  // parseUserNames2 = (values) =>
  //   (values && values.map((value) => ({ value: value.value, name: value.label }))) || undefined;
  // parseUserNames2 = (values) =>
  //   (values && values.map((value) => ({ value: value.value, label: value.label }))) || undefined; // Invalid prop `children` supplied to `Value`, expected a ReactNode.
  // parseUserNames2 = (values) =>
  //   (values && values.map((value) => ({ value: value, label: value }))) || undefined; // Invalid prop `children` supplied to `Value`, expected a ReactNode. works good with O1, not names in search though
  // parseUserNames2 = (values) =>
  //   (values && values.map((value) =>
  //     ({ value: value.value, label: value.label }))) || undefined; // Invalid prop `children` supplied to `Value`, expected a ReactNode. works good with O1, not names in search though

  // P5 Invalid prop `children` supplied to `Value`, expected a ReactNode. works good with F1, not names in search though
  // works good with F2, users are visible after search, cleared, deleted, but not visible while search result selection
  // gets array in first item instead of value property
  parseUserNames2 = (values) =>
    (values && values.map((value) => ({ value: value.value, label: value.value }))) || undefined;

  // formatUserOptions = (values) =>
  //   values.content.map((value) => ({ value: value.id, label: value.name }));  // does not search users

  // formatUserOptions = (values) =>
  //   values.content.map((value) => ({ value: value, label: value.name }));

  // FUO3  -  works good with P5, users are veisible after search, cleared, deleted, but not visible while search result selection
  // formatUserOptions = (values) => values.map((value) => ({ value, label: value.name }));

  // FUO4 return array of strings instead of objects, works with P5 and F2 but no users in search
  // along with P5 and F2 shows grey screen after selecting second user
  // formatUserOptions = (values) =>
  //   values.map((value) => ({ value, label: value.label }));

  // FUO5  // does not search users - no match found
  // formatUserOptions = (values) =>
  //   values.content.map((value) => ({ value: value.id, label: value.value }));

  // FUO6 label again undefined
  // formatUserOptions = (values) =>
  //   values.map((value) => ({ value, label: value.value }));

  // FUO7 label again undefined , seems to work with P5 and F2 but crash after entering 2nd user
  // with P5&F2 no matches found in search
  formatUserOptions = (values) => values.map((value) => ({ value, label: value }));

  // FUO8 label again undefined , seems to work with P5 and F2 but crash after entering 2nd user
  // formatUserOptions = (values) =>
  // values.map((value) => ({ value:value, label: value }));

  // added from other widget
  formatFilterOptions = (values) =>
    values.content.map((value) => ({ value: value.id, label: value.name }));
  // formatFilters = (values) => {
  //   // console.log("FILTER VALUES:"+values);
  //   values.map((value) => ({ value, label: value.name }));
  // }
  formatFilters = (values) => values.map((value) => ({ value, label: value.name }));

  parseFilters = (values) =>
    (values && values.map((value) => ({ value: value.value, name: value.label }))) || undefined;

  render() {
    const {
      intl: { formatMessage },
      usernamesSearchUrl,
      filtersSearchUrl,
    } = this.props;

    return (
      <Fragment>
        <FieldProvider
          name="contentParameters.widgetOptions.actionType"
          format={this.formatActionTypes}
          parse={this.parseActionTypes}
          validate={validators.actionType(formatMessage)}
        >
          <DropdownControl
            fieldLabel={formatMessage(messages.CriteriaFieldLabel)}
            multiple
            selectAll
            options={this.criteria}
          />
        </FieldProvider>
        <FieldProvider
          name="contentParameters.itemsCount"
          validate={validators.items(formatMessage)}
          format={String}
          normalize={this.normalizeValue}
        >
          <InputControl
            fieldLabel={formatMessage(messages.ItemsFieldLabel)}
            inputWidth={ITEMS_INPUT_WIDTH}
            maxLength="3"
          />
        </FieldProvider>
        <FieldProvider
          name="contentParameters.widgetOptions.user"
          // name="someuser"
          format={this.formatUsernames}
          parse={this.parseUsernames}
        >
          <TagsControl
            fieldLabel={formatMessage(messages.UsernameControlText)}
            placeholder={formatMessage(messages.UsersPlaceholder)}
            focusPlaceholder={formatMessage(messages.UsersFocusPlaceholder)}
            nothingFound={formatMessage(messages.UsersNoMatches)}
            minLength={3}
            async
            uri={usernamesSearchUrl}
            makeOptions={this.formatUsernamesOptions}
            multi
            removeSelected
          />
        </FieldProvider>
        <FieldProvider
          name="filters"
          format={this.formatFilters} // bug somewhere here, seems initial value is not set, mysteriously dissapeared
          parse={this.parseFilters}
          validate={validators.filterIds(formatMessage)}
        >
          <TagsControl
            fieldLabel={formatMessage(messages.FiltersFieldLabel)}
            placeholder={formatMessage(messages.FiltersPlaceholder)}
            focusPlaceholder={formatMessage(messages.FiltersFocusPlaceholder)}
            nothingFound={formatMessage(messages.FiltersNoMatches)}
            minLength={3}
            async
            multi
            uri={filtersSearchUrl}
            makeOptions={this.formatFilterOptions}
            removeSelected
          />
        </FieldProvider>
        <FieldProvider
          name="contentParameters.widgetOptions.user2"
          format={this.formatUserNames2}
          parse={this.parseUserNames2}
          // no validate?
        >
          <TagsControl
            fieldLabel={formatMessage(messages.UsernameControlText)}
            placeholder={formatMessage(messages.UsersPlaceholder)}
            focusPlaceholder={formatMessage(messages.UsersFocusPlaceholder)}
            nothingFound={formatMessage(messages.UsersNoMatches)}
            minLength={3}
            async
            multi
            uri={usernamesSearchUrl}
            makeOptions={this.formatUserOptions}
            removeSelected
          />
        </FieldProvider>
      </Fragment>
    );
  }
}
