import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage, defineMessages} from 'react-intl';

import Modal from '../modal/modal.jsx';
import {SPARK_SOURCE_URL} from '../../lib/spark-config';

import styles from './spark-about.css';

const messages = defineMessages({
    title: {
        id: 'spark.about.title', // SPARK: id propio
        defaultMessage: 'About Spark',
        description: 'Title of the About Spark dialog'
    },
    contentLabel: {
        id: 'spark.about.contentLabel', // SPARK: id propio
        defaultMessage: 'About Spark',
        description: 'Accessibility label for the About Spark dialog'
    },
    intro: {
        id: 'spark.about.intro', // SPARK: id propio
        defaultMessage: 'Spark is a free and open-source visual programming editor ' +
            'for LEGO WeDo 2.0. It works entirely on your device: no accounts, no server, no tracking.',
        description: 'Introduction paragraph of the About Spark dialog'
    },
    basedOn: {
        id: 'spark.about.basedOn', // SPARK: id propio
        defaultMessage: 'Spark is based on the Scratch 3 editor, a project of the Scratch Foundation. ' +
            'Scratch is licensed under the GNU Affero General Public License v3.0.',
        description: 'Credit to Scratch in the About Spark dialog'
    },
    disclaimer: {
        id: 'spark.about.disclaimer', // SPARK: id propio
        defaultMessage: 'Spark is an independent project. It is not affiliated with, nor endorsed by, ' +
            'the Scratch Foundation or the LEGO Group. LEGO and WeDo are trademarks of their respective owners.',
        description: 'Disclaimer in the About Spark dialog'
    },
    license: {
        id: 'spark.about.license', // SPARK: id propio
        defaultMessage: 'Spark is free software released under the GNU Affero General Public License v3.0. ' +
            'You may use, study, modify and share it, and publish your own version, ' +
            'as long as you keep this license and make the source code available.',
        description: 'License paragraph in the About Spark dialog'
    },
    sourceCode: {
        id: 'spark.about.sourceCode', // SPARK: id propio
        defaultMessage: 'Source code:',
        description: 'Label for the source code link in the About Spark dialog'
    },
    sourceCodePending: {
        id: 'spark.about.sourceCodePending', // SPARK: id propio
        defaultMessage: 'the public repository address is pending confirmation',
        description: 'Placeholder for the source code link while the URL is unknown'
    }
});

const SparkAbout = ({
    isOpen,
    onRequestClose,
    intl
}) => {
    // SPARK: el componente Modal de la GUI siempre se monta abierto; aquí se
    // controla con el estado del menú.
    if (!isOpen) return null;

    return (
        <Modal
            id="sparkAboutModal"
            onRequestClose={onRequestClose}
            contentLabel={intl.formatMessage(messages.contentLabel)}
        >
            <div className={styles.body}>
                <h2 className={styles.title}>
                    <FormattedMessage {...messages.title} />
                </h2>
                <p><FormattedMessage {...messages.intro} /></p>
                <p><FormattedMessage {...messages.basedOn} /></p>
                <p><FormattedMessage {...messages.disclaimer} /></p>
                <p><FormattedMessage {...messages.license} /></p>
                <p className={styles.source}>
                    <FormattedMessage {...messages.sourceCode} />{' '}
                    {SPARK_SOURCE_URL ? (
                        <a
                            href={SPARK_SOURCE_URL}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {SPARK_SOURCE_URL}
                        </a>
                    ) : (
                        <FormattedMessage {...messages.sourceCodePending} />
                    )}
                </p>
            </div>
        </Modal>
    );
};

SparkAbout.propTypes = {
    intl: PropTypes.object.isRequired,
    isOpen: PropTypes.bool,
    onRequestClose: PropTypes.func
};

export default SparkAbout;
