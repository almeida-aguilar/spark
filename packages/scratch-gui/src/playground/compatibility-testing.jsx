import React from 'react';
import ReactDomClient from 'react-dom/client';

import GUI from '../containers/gui.jsx';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import AppStateHOC from '../lib/app-state-hoc.jsx';
const WrappedGui = AppStateHOC(HashParserHOC(GUI));

class Player extends React.Component {
    render () {
        return (
            <div style={{display: 'flex'}}>
                <WrappedGui
                    isPlayerOnly
                    isFullScreen={false}
                />
            </div>
        );
    }
}

const appTarget = document.createElement('div');
document.body.appendChild(appTarget);

const root = ReactDomClient.createRoot(appTarget);
root.render(<Player />);
