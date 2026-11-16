import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {isRtl} from 'scratch-l10n';
import {selectLocale, addLocaleMessages} from '../reducers/locales';
import {loadLocaleMessages} from '../lib/spark-l10n/locale-loader';
import {setPersistedLocale} from '../lib/detect-locale';

import LanguageSelectorComponent from '../components/language-selector/language-selector.jsx';

class LanguageSelector extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChange'
        ]);
        document.documentElement.lang = props.currentLocale;
    }
    handleChange (e) {
        const newLocale = e.target.value;
        const apply = () => {
            this.props.onChangeLanguage(newLocale);
            setPersistedLocale(newLocale);
            document.documentElement.lang = newLocale;
            document.documentElement.dir = isRtl(newLocale) ? 'rtl' : 'ltr';
        };
        if (this.props.messagesByLocale[newLocale]) {
            apply();
            return;
        }
        // SPARK: carga diferida del idioma solicitado (fase 7)
        loadLocaleMessages(newLocale).then(messages => {
            this.props.onLocaleLoaded(newLocale, messages);
            apply();
        }).catch(() => {
            // sin red o error de carga: se mantiene el idioma actual
        });
    }
    render () {
        const {
            onChangeLanguage,
            onLocaleLoaded,
            messagesByLocale,
            children,
            ...props
        } = this.props;
        return (
            <LanguageSelectorComponent
                onChange={this.handleChange}
                {...props}
            >
                {children}
            </LanguageSelectorComponent>
        );
    }
}

LanguageSelector.propTypes = {
    children: PropTypes.node,
    currentLocale: PropTypes.string.isRequired,
    // Only checking key presence for messagesByLocale, no need to be more specific than object
    messagesByLocale: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    onChangeLanguage: PropTypes.func.isRequired,
    onLocaleLoaded: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    currentLocale: state.locales.locale,
    messagesByLocale: state.locales.messagesByLocale
});

const mapDispatchToProps = dispatch => ({
    onChangeLanguage: locale => {
        dispatch(selectLocale(locale));
    },
    onLocaleLoaded: (locale, messages) => {
        dispatch(addLocaleMessages(locale, messages));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LanguageSelector);
