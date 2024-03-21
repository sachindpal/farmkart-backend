
import fs from 'fs'
import moment from 'moment';
import Security from './../libraries/Security.js'
import CommonConstant from './../constants/CommonConstant.js';


class Telemetry {

    constructor(appSessionId, apiName) {
        this.appSessionId = appSessionId;
        this.apiName = apiName;
        this.correlationId = Security.getUUID();
        this.telemetryData = [];
    }

    getDefaultObject() {
        const defaultObj = {
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            appSessionId: this.appSessionId,
            correlationId: this.correlationId,
            apiName: this.apiName,
        }
        return defaultObj;
    }

    addRequest(dataObj) {
        const telemetryObj = this.getDefaultObject();
        telemetryObj['type'] = CommonConstant.REQUEST_TELEMETRY;
        telemetryObj['payload'] = dataObj;
        this.telemetryData.push(telemetryObj);
    }

    addResponse(dataObj) {
        const telemetryObj = this.getDefaultObject();
        telemetryObj['type'] = CommonConstant.RESPONSE_TELEMETRY;
        telemetryObj['data'] = dataObj;
        this.telemetryData.push(telemetryObj);
    }

    addError(dataObj) {
        const telemetryObj = this.getDefaultObject();
        telemetryObj['type'] = CommonConstant.ERROR_TELEMETRY;
        telemetryObj['data'] = dataObj;
        this.telemetryData.push(telemetryObj);
    }


    uploadTelemetry() {
        const filePath = 'caching/telemetryBackend.json';

        const fileSize = fs.statSync(filePath).size;

        // Convert Json to String 
        const jsonString = JSON.stringify(this.telemetryData);

        if (fileSize <= 2) {        // TelemetryBackend.json could be empty or contain an empty array ([]).
            fs.writeFile(filePath, jsonString, (err) => {
                if (err) {
                    throw err;
                }
            });
        }
        else {

            // Open the file for reading and writing
            const fileDescriptor = fs.openSync(filePath, 'r+');

            // Remove the ']' from  telemetryBackend
            fs.ftruncateSync(fileDescriptor, fileSize - 1);

            // Remove initial bracket '[' and add Comma to the telemetryData
            const additionalObjectsString = `,${jsonString.slice(1)}`;

            fs.appendFileSync(filePath, additionalObjectsString);

            // Close the file
            fs.closeSync(fileDescriptor);
        }

    }

}

export default Telemetry;

