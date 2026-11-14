import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

/* Higher Order Component to get parameters from the URL query string and initialize redux state
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with query parsing behavior
 */
const QueryParserHOC = function (WrappedComponent) {
    // SPARK: sin tutoriales ni proyectos por URL: los parámetros de la URL
    // ya no cambian el estado de la aplicación.
    const QueryParserComponent = function (props) {
        return (
            <WrappedComponent
                {...props}
            />
        );
    };
    QueryParserComponent.propTypes = {
        children: PropTypes.node
    };
    return connect(
        null,
        null
    )(QueryParserComponent);
};

export {
    QueryParserHOC as default
};
