import PropTypes from 'prop-types';
import React from 'react';
import ReactModal from 'react-modal';
import Box from '../box/box.jsx';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import styles from './continue-project-modal.css';

const messages = defineMessages({
    label: {
        id: 'spark.continueProjectModal.label',
        defaultMessage: 'Continue where you left off?',
        description: 'Title of the dialog that offers to reopen the last project'
    },
    description: {
        id: 'spark.continueProjectModal.description',
        defaultMessage: 'Your last project was saved in this browser.',
        description: 'Description of the continue dialog'
    },
    continue: {
        id: 'spark.continueProjectModal.continue',
        defaultMessage: 'Continue',
        description: 'Button to reopen the last saved project'
    },
    newProject: {
        id: 'spark.continueProjectModal.newProject',
        defaultMessage: 'New project',
        description: 'Button to start a new project instead of the last saved one'
    }
});

const ContinueProjectModal = props => {
    const intl = useIntl();
    return (
        <ReactModal
            isOpen
            className={styles.modalContent}
            contentLabel={intl.formatMessage({...messages.label})}
            overlayClassName={styles.modalOverlay}
            onRequestClose={props.onNewProject}
        >
            <div dir={props.isRtl ? 'rtl' : 'ltr'}>
                <Box className={styles.body}>
                    <h2>
                        <FormattedMessage {...messages.label} />
                    </h2>
                    <p>
                        <FormattedMessage {...messages.description} />
                    </p>

                    <Box className={styles.buttonRow}>
                        <button
                            className={styles.secondaryButton}
                            onClick={props.onNewProject}
                        >
                            <FormattedMessage {...messages.newProject} />
                        </button>
                        <button
                            onClick={props.onContinue}
                        >
                            <FormattedMessage {...messages.continue} />
                        </button>
                    </Box>
                </Box>
            </div>
        </ReactModal>
    );
};

ContinueProjectModal.propTypes = {
    isRtl: PropTypes.bool,
    onContinue: PropTypes.func.isRequired,
    onNewProject: PropTypes.func.isRequired
};

export default ContinueProjectModal;
