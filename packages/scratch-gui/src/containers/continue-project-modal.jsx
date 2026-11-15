import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import ContinueProjectModalComponent from '../components/continue-project-modal/continue-project-modal.jsx';
import getProjectStore from '../lib/project-store-provider';
import {
    getIsShowingWithoutId,
    setProjectId
} from '../reducers/project-state';

// SPARK: identificador del último proyecto guardado en este navegador
const LAST_PROJECT_KEY = 'spark.lastProjectId';

/**
 * Ofrece reabrir el último proyecto guardado en el navegador al arrancar el
 * editor con el proyecto por defecto. Solo se comprueba una vez: si el
 * usuario ya empezó a trabajar (proyecto cambiado) o abrió un proyecto por
 * su hash, no se ofrece nada.
 * @param {object} props - component props.
 * @param {boolean} props.isReady - whether the default project is showing.
 * @param {boolean} props.projectChanged - whether the project has unsaved changes.
 * @param {function} props.onContinue - callback to load a project by id.
 * @returns {React.ReactNode} the modal, or null when there is nothing to offer.
 */
const ContinueProjectModal = ({isReady, projectChanged, onContinue}) => {
    const [open, setOpen] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const attempted = useRef(false);

    useEffect(() => {
        if (attempted.current || projectChanged) return;
        if (!isReady) return;
        attempted.current = true;
        if (window.location.hash && window.location.hash !== '#') return;
        let lastId = null;
        try {
            lastId = window.localStorage.getItem(LAST_PROJECT_KEY);
        } catch (e) {
            // modo privado: no hay proyecto previo que ofrecer
            return;
        }
        if (!lastId) return;
        let cancelled = false;
        getProjectStore()
            .getEntry(lastId)
            .then(entry => {
                if (cancelled) return;
                if (entry) {
                    setCandidateId(lastId);
                    setOpen(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [isReady, projectChanged]);

    const handleContinue = useCallback(() => {
        setOpen(false);
        onContinue(candidateId);
    }, [candidateId, onContinue]);
    const handleNewProject = useCallback(() => setOpen(false), []);

    if (!open) return null;
    return (
        <ContinueProjectModalComponent
            onContinue={handleContinue}
            onNewProject={handleNewProject}
        />
    );
};

ContinueProjectModal.propTypes = {
    isReady: PropTypes.bool,
    projectChanged: PropTypes.bool,
    onContinue: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isReady: getIsShowingWithoutId(state.scratchGui.projectState.loadingState),
    projectChanged: state.scratchGui.projectChanged
});

const mapDispatchToProps = dispatch => ({
    onContinue: projectId => dispatch(setProjectId(projectId))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ContinueProjectModal);
