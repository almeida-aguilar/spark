import {defineMessages} from 'react-intl';

const messages = defineMessages({
    bip: {
        defaultMessage: 'Bip', // SPARK: sonido propio en lugar de "Meow"
        description: 'Name for the bip sound',
        id: 'spark.defaultProject.bip' // SPARK: id propio
    },
    variable: {
        defaultMessage: 'my variable',
        description: 'Name for the default variable',
        id: 'gui.defaultProject.variable'
    }
});

export default messages;
