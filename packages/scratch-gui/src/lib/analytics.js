// SPARK: Spark no envía datos de uso ni analítica alguna.
//
// La interfaz sigue llamando a `analytics.event(...)` en algunos sitios, pero
// aquí no se hace nada: no se recogen datos, ni cookies, ni se hacen peticiones
// a servidores de terceros. El módulo se mantiene para no tocar todos los
// puntos de llamada (y para que sea fácil volver a activarlo si algún día
// hiciera falta).

/**
 * Report analytics to GA4 using an interface similar to the 'react-ga' module we were using for UA.
 */
const GA4 = {
    event: ({category, action, label}) => { // eslint-disable-line no-unused-vars
        // SPARK: sin analítica.
    }
};

export default GA4;
