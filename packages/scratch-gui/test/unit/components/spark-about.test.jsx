import React from 'react';
import {render} from '@testing-library/react';
import '@testing-library/jest-dom';
import {IntlProvider} from 'react-intl';
import SparkAbout from '../../../src/components/spark-about/spark-about.jsx';

const renderComponent = props => render(
    <IntlProvider locale="en">
        <SparkAbout
            intl={{formatMessage: message => String(message.defaultMessage)}}
            {...props}
        />
    </IntlProvider>
);

describe('SparkAbout', () => {
    test('is not rendered when closed', () => {
        const {container} = renderComponent({isOpen: false});
        expect(container).toBeEmptyDOMElement();
    });

    test('credits Scratch, states the disclaimer and the license', () => {
        const {getByText, getAllByText} = renderComponent({isOpen: true});

        expect(getByText(/based on the Scratch 3 editor/)).toBeInTheDocument();
        expect(getByText(/not affiliated with, nor endorsed by/)).toBeInTheDocument();
        expect(getAllByText(/GNU Affero General Public License/).length).toBeGreaterThan(0);
    });

    test('mentions the source code of the project', () => {
        const {getByText} = renderComponent({isOpen: true});

        expect(getByText(/Source code:/)).toBeInTheDocument();
    });
});
