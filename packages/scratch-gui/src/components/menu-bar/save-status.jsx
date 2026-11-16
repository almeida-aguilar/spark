import classNames from 'classnames';

import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import InlineMessages from '../../containers/inline-messages.jsx';

import {
    manualUpdateProject
} from '../../reducers/project-state';

import {
    filterInlineAlerts
} from '../../reducers/alerts';

import saveIcon from './icon--save.svg';

import styles from './save-status.css';

// Wrapper for inline messages in the nav bar, which are all related to saving.
// Show any inline messages if present, else show the "Save" button if the
// project has changed.
// We decided to not use an inline message for "Save" because it is a reflection
// of the project state, rather than an event.
const SaveStatus = ({
    alertsList,
    projectChanged,
    onClickSave,
    className
}) => (
    filterInlineAlerts(alertsList).length > 0 ? (
        <InlineMessages className={styles.alert} />
    ) : projectChanged && (
        <button
            className={classNames(styles.saveNow, className)}
            onClick={onClickSave}
        >
            <img
                alt=""
                aria-hidden="true"
                className={styles.saveIcon}
                draggable={false}
                src={saveIcon}
            />
            <span className={styles.saveLabel}>
                <FormattedMessage
                    defaultMessage="Save"
                    description="Menu bar button for saving the project"
                    id="spark.menuBar.save"
                />
            </span>
        </button>
    ));

SaveStatus.propTypes = {
    className: PropTypes.string,
    alertsList: PropTypes.arrayOf(PropTypes.object),
    onClickSave: PropTypes.func,
    projectChanged: PropTypes.bool
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    projectChanged: state.scratchGui.projectChanged
});

const mapDispatchToProps = dispatch => ({
    onClickSave: () => dispatch(manualUpdateProject())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SaveStatus);
