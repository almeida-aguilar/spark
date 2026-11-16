import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useRef} from 'react';
import {useIntl, FormattedMessage, defineMessage} from 'react-intl';
import {connect} from 'react-redux';
import locales, {isRtl} from 'scratch-l10n';

import check from './check.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import languageIcon from '../language-selector/language-icon.svg';
import {selectLocale, addLocaleMessages} from '../../reducers/locales.js';
import {loadLocaleMessages} from '../../lib/spark-l10n/locale-loader';
import {setPersistedLocale} from '../../lib/detect-locale';
import useMenuNavigation from '../../hooks/use-menu-navigation';

import stylesSettingsMenu from './settings-menu.css';
import stylesLanguageMenu from './language-menu.css';

import dropdownCaret from './dropdown-caret.svg';

const languageMenu = defineMessage({
    id: 'gui.aria.languageMenu',
    defaultMessage: 'Language menu',
    description: 'accessibility label for language menu'
});

const LanguageMenu = ({
    currentLocale,
    isRtl,
    messagesByLocale,
    onChangeLanguage,
    onLocaleLoaded,
    depth
}) => {
    const intl = useIntl();

    const selectedRef = useRef(null);

    const {
        isExpanded,
        handleKeyDown,
        handleKeyDownOpenMenu,
        handleOnOpen,
        menuRef
    } = useMenuNavigation({
        depth: depth ?? 1,
        defaultIndexOnOpen: (Object.keys(locales).indexOf(currentLocale)),
        isRtl
    });

    const setRef = useCallback(component => {
        selectedRef.current = component;
    }, []);

    const handleMouseOver = useCallback(() => {
        // If we are using hover rather than clicks for submenus, scroll the selected option into view
        if (isExpanded() && selectedRef.current) {
            selectedRef.current.scrollIntoView({block: 'center'});
        }
    }, [isExpanded]);

    return (
        <MenuItem
            ref={menuRef}
            isExpanded={isExpanded()}
            ariaLabel={intl.formatMessage(languageMenu)}
            onKeyDown={handleKeyDown}
            isDataMenuItemWrapper
        >
            <button
                className={stylesSettingsMenu.option}
                onClick={handleOnOpen}
                onMouseOver={handleMouseOver}
                data-menu-item
            >
                <img
                    className={stylesSettingsMenu.icon}
                    src={languageIcon}
                />
                <span className={stylesSettingsMenu.submenuLabel}>
                    <FormattedMessage
                        defaultMessage="Language"
                        description="Language sub-menu"
                        id="gui.menuBar.language"
                    />
                </span>
                <img
                    className={stylesSettingsMenu.expandCaret}
                    src={dropdownCaret}
                />
            </button>
            <Submenu
                className={stylesLanguageMenu.languageSubmenu}
                place={isRtl ? 'left' : 'right'}
            >
                {
                    Object.keys(locales)
                        .map(locale => {
                            const isSelected = currentLocale === locale;

                            return (<MenuItem
                                key={locale}
                                className={stylesLanguageMenu.languageMenuItem}
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={() => {
                                    const apply = () => {
                                        onChangeLanguage(locale);
                                        setPersistedLocale(locale);
                                        document.documentElement.lang = locale;
                                        document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
                                    };
                                    if (messagesByLocale && messagesByLocale[locale]) {
                                        apply();
                                        return;
                                    }
                                    // SPARK: carga diferida del idioma solicitado (fase 7)
                                    loadLocaleMessages(locale).then(messages => {
                                        onLocaleLoaded(locale, messages);
                                        apply();
                                    }).catch(() => {});
                                }}
                                isDataMenuItem
                                onParentKeyDown={handleKeyDownOpenMenu}
                                isSelected={isSelected}
                            >
                                <img
                                    className={classNames(stylesSettingsMenu.check, {
                                        [stylesSettingsMenu.selected]: isSelected
                                    })}
                                    src={check}
                                    {...(isSelected && {ref: setRef})}
                                />
                                {locales[locale].name}
                            </MenuItem>);
                        })
                }
            </Submenu>
        </MenuItem>
    );
};

LanguageMenu.propTypes = {
    currentLocale: PropTypes.string,
    depth: PropTypes.number,
    isRtl: PropTypes.bool,
    messagesByLocale: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    onChangeLanguage: PropTypes.func,
    onLocaleLoaded: PropTypes.func
};

const mapStateToProps = state => ({
    currentLocale: state.locales.locale,
    isRtl: state.locales.isRtl,
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
)(LanguageMenu);
