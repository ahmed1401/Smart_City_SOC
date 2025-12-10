import { readAuthState } from '../utils/auth';
import { gatewayBaseUrl } from './http';
function soapEnvelope(zoneA, zoneB) {
    return [
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"',
        ' xmlns:aq="http://smartcity.example.com/airquality">',
        '<soapenv:Body>',
        `<aq:CompareZones><zoneA>${zoneA}</zoneA><zoneB>${zoneB}</zoneB></aq:CompareZones>`,
        '</soapenv:Body>',
        '</soapenv:Envelope>',
    ].join('');
}
function extractNodeValue(doc, localName) {
    const byLocal = doc.getElementsByTagName(localName).item(0)?.textContent;
    if (byLocal) {
        return byLocal;
    }
    const byNs = doc.getElementsByTagNameNS('*', localName).item(0)?.textContent;
    return byNs ?? undefined;
}
export async function compareZones(zoneA, zoneB) {
    const payload = soapEnvelope(zoneA, zoneB);
    const auth = readAuthState();
    const response = await fetch(`${gatewayBaseUrl}/api/airquality`, {
        method: 'POST',
        body: payload,
        headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            ...(auth.apiKey ? { 'x-api-key': auth.apiKey } : {}),
            ...(auth.jwt ? { Authorization: `Bearer ${auth.jwt}` } : {}),
        },
    });
    const xml = await response.text();
    if (!response.ok) {
        throw new Error(`SOAP ${response.status}: ${xml}`);
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Impossible de parser la réponse SOAP');
    }
    const delta = Number(extractNodeValue(doc, 'deltaAQI'));
    const higherZone = extractNodeValue(doc, 'higherZone') ?? 'N/A';
    const dominantPollutant = extractNodeValue(doc, 'dominantPollutant') ?? 'PM2.5';
    if (Number.isNaN(delta)) {
        throw new Error('Réponse SOAP invalide: deltaAQI absent');
    }
    return {
        deltaAQI: delta,
        higherZone,
        dominantPollutant,
        rawResponse: xml,
    };
}
